import { create } from 'zustand'
import { authApi, LoginCredentials } from '../api/auth'
import { User } from '../api/users'
import { Resource, PermissionLevel } from '../types/permissions'
import { getErrorMessage } from '../types/common'
import logger from '../utils/logger'
import { 
  hasPermission, 
  canView, 
  canManage, 
  isAdmin as checkIsAdmin,
  hasAnyPermission,
  getVisibleResources,
  shouldFilterByUser,
  canAccessResource
} from '../utils/permissions'
import { TOKEN_REFRESH_INTERVAL_MS, CONFIGURED_WARNING_MINUTES } from '../constants/auth'
import { STORAGE_KEYS } from '../constants/storage'

interface TokenInfo {
  token: string
  user: User
  expires: string
  addedAt: Date
}

interface AuthState {
  user: User | null
  token: string | null
  tokenExpiresAt: Date | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tokenStack: TokenInfo[]
  refreshInterval: NodeJS.Timeout | null
  expiryWarningTimeout: NodeJS.Timeout | null
  isRefreshing: boolean
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ token: string; user: User } | void>
  logout: () => void
  loadUser: () => Promise<void>
  clearError: () => void
  setUser: (user: User) => void
  switchAccount: (token: TokenInfo) => Promise<void>
  pushCurrentToStack: () => void
  popFromStack: () => Promise<void>
  startTokenRefresh: () => void
  stopTokenRefresh: () => void
  refreshToken: () => Promise<void>
  scheduleExpiryWarning: () => void
  clearExpiryWarning: () => void
  
  // Permission helpers
  hasPermission: (resource: Resource, level: PermissionLevel) => boolean
  canView: (resource: Resource) => boolean
  canManage: (resource: Resource) => boolean
  canAccess: (resource: Resource, action: 'view' | 'create' | 'edit' | 'delete') => boolean
  isAdmin: () => boolean
  hasAnyPermission: (level?: PermissionLevel) => boolean
  getVisibleResources: () => Resource[]
  shouldFilterByUser: () => boolean
}

// Helper to load token stack from localStorage
const loadTokenStack = (): TokenInfo[] => {
  try {
    const stack = localStorage.getItem(STORAGE_KEYS.TOKEN_STACK)
    return stack ? JSON.parse(stack) : []
  } catch {
    return []
  }
}

// Helper to save token stack to localStorage
const saveTokenStack = (stack: TokenInfo[]) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN_STACK, JSON.stringify(stack))
}

// Helper to validate JWT format
const isValidJWT = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

// Helper to extract expiry from JWT token
const getTokenExpiry = (token: string): Date | null => {
  try {
    // Validate JWT format first
    if (!isValidJWT(token)) {
      logger.warn('Invalid JWT format')
      return null
    }
    
    const payload = JSON.parse(atob(token.split('.')[1]))
    
    // Validate that exp exists and is a number
    if (typeof payload.exp !== 'number') {
      logger.warn('JWT payload missing or invalid exp field')
      return null
    }
    
    return new Date(payload.exp * 1000)
  } catch (error) {
    logger.error('Failed to parse JWT token:', error)
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.TOKEN),
  tokenExpiresAt: localStorage.getItem(STORAGE_KEYS.TOKEN) ? getTokenExpiry(localStorage.getItem(STORAGE_KEYS.TOKEN)!) : null,
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.TOKEN),
  isLoading: false,
  error: null,
  tokenStack: loadTokenStack(),
  refreshInterval: null,
  expiryWarningTimeout: null,
  isRefreshing: false,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null })
    
    try {
      // Get token
      const tokenResponse = await authApi.login(credentials)
      localStorage.setItem(STORAGE_KEYS.TOKEN, tokenResponse.token)

      // Get user info
      const user = await authApi.getMe()
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      
      const tokenExpiresAt = getTokenExpiry(tokenResponse.token)
      
      set({
        user,
        token: tokenResponse.token,
        tokenExpiresAt,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      
      // Start token refresh timer
      get().startTokenRefresh()
      
      // Schedule expiry warning
      get().scheduleExpiryWarning()
      
      // Return the login data for checking default admin
      return { token: tokenResponse.token, user }
    } catch (error) {
      const errorMessage = getErrorMessage(error) || 'Login failed'

      set({
        isLoading: false,
        error: errorMessage
      })
      throw error
    }
  },

  logout: () => {
    const state = get()
    
    // Stop token refresh
    state.stopTokenRefresh()
    
    // Clear expiry warning
    state.clearExpiryWarning()
    
    // Clear auth data
    authApi.logout()
    
    // Clear token stack
    localStorage.removeItem(STORAGE_KEYS.TOKEN_STACK)
    
    set({
      user: null,
      token: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      error: null,
      tokenStack: [],
      isRefreshing: false
    })
  },

  loadUser: async () => {
    const token = get().token
    if (!token) return

    set({ isLoading: true })
    
    try {
      // Try to get user from localStorage first
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
      if (storedUser) {
        set({ user: JSON.parse(storedUser), isLoading: false })
      }
      
      // Then fetch fresh user data
      const user = await authApi.getMe()
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))

      // Get token expiry
      const tokenExpiresAt = token ? getTokenExpiry(token) : null
      
      set({
        user,
        tokenExpiresAt,
        isAuthenticated: true,
        isLoading: false
      })
      
      // Start token refresh if not already running
      const state = get()
      if (!state.refreshInterval) {
        state.startTokenRefresh()
      }
      
      // Schedule expiry warning
      get().scheduleExpiryWarning()
    } catch {
      // If loading user fails, clear auth state
      authApi.logout()
      get().clearExpiryWarning()
      set({
        user: null,
        token: null,
        tokenExpiresAt: null,
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false
      })
    }
  },

  clearError: () => set({ error: null }),
  
  setUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    set({ user })
  },

  switchAccount: async (tokenInfo: TokenInfo) => {
    const state = get()
    
    // Stop current refresh timer
    state.stopTokenRefresh()
    
    // Clear current expiry warning
    state.clearExpiryWarning()
    
    // Set new active token
    localStorage.setItem(STORAGE_KEYS.TOKEN, tokenInfo.token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(tokenInfo.user))
    
    const tokenExpiresAt = getTokenExpiry(tokenInfo.token)
    
    set({
      token: tokenInfo.token,
      user: tokenInfo.user,
      tokenExpiresAt,
      isAuthenticated: true,
      error: null
    })
    
    // Remove this token from stack
    const newStack = state.tokenStack.filter(t => t.token !== tokenInfo.token)
    set({ tokenStack: newStack })
    saveTokenStack(newStack)
    
    // Start refresh timer for new token
    state.startTokenRefresh()
    
    // Schedule expiry warning for new token
    get().scheduleExpiryWarning()
  },

  pushCurrentToStack: () => {
    const state = get()
    if (!state.token || !state.user) return
    
    // Get current token expiry
    const tokenData = JSON.parse(atob(state.token.split('.')[1]))
    const expires = new Date(tokenData.exp * 1000).toISOString()
    
    const tokenInfo: TokenInfo = {
      token: state.token,
      user: state.user,
      expires,
      addedAt: new Date()
    }
    
    const newStack = [...state.tokenStack, tokenInfo]
    set({ tokenStack: newStack })
    saveTokenStack(newStack)
  },

  popFromStack: async () => {
    const state = get()
    if (state.tokenStack.length === 0) return
    
    const previousToken = state.tokenStack[state.tokenStack.length - 1]
    await state.switchAccount(previousToken)
  },

  startTokenRefresh: () => {
    const state = get()
    
    // Clear any existing interval
    if (state.refreshInterval) {
      clearInterval(state.refreshInterval)
    }
    
    // Refresh token at configured interval
    const interval = setInterval(() => {
      state.refreshToken()
    }, TOKEN_REFRESH_INTERVAL_MS)
    
    set({ refreshInterval: interval })
    
    // Also do an immediate refresh to ensure token is fresh
    state.refreshToken()
  },

  stopTokenRefresh: () => {
    const state = get()
    
    if (state.refreshInterval) {
      clearInterval(state.refreshInterval)
      set({ refreshInterval: null })
    }
  },

  refreshToken: async () => {
    const state = get()
    
    // Prevent duplicate refresh attempts
    if (state.isRefreshing) {
      logger.log('Token refresh already in progress')
      return
    }
    
    set({ isRefreshing: true })
    
    try {
      const response = await authApi.refreshToken()
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.token)
      
      const tokenExpiresAt = getTokenExpiry(response.token)
      
      set({ 
        token: response.token,
        tokenExpiresAt,
        isRefreshing: false
      })
      
      // Clear old warning and schedule new one
      state.clearExpiryWarning()
      get().scheduleExpiryWarning()
      
      logger.log('Token refreshed successfully')
    } catch (error) {
      set({ isRefreshing: false })
      logger.error('Token refresh failed:', error)
      // Don't logout on refresh failure - the interceptor will handle 401s
    }
  },

  scheduleExpiryWarning: () => {
    const state = get()
    
    // Clear any existing warning timeout
    state.clearExpiryWarning()
    
    if (!state.tokenExpiresAt) return
    
    const now = new Date()
    const expiryTime = new Date(state.tokenExpiresAt)
    const warningTime = new Date(expiryTime.getTime() - CONFIGURED_WARNING_MINUTES * 60 * 1000)
    const timeUntilWarning = warningTime.getTime() - now.getTime()
    
    // Only schedule if warning is in the future
    if (timeUntilWarning > 0) {
      logger.log(`Scheduling token expiry warning in ${Math.round(timeUntilWarning / 1000)}s`)
      
      const timeout = setTimeout(() => {
        // Show warning toast with refresh action
        // Note: We'll need to access the toast context from outside the store
        // For now, we'll dispatch a custom event that can be caught by a component
        window.dispatchEvent(new CustomEvent('token-expiry-warning', {
          detail: {
            expiresAt: state.tokenExpiresAt,
            onRefresh: () => get().refreshToken()
          }
        }))
      }, timeUntilWarning)
      
      set({ expiryWarningTimeout: timeout })
    }
  },

  clearExpiryWarning: () => {
    const state = get()
    
    if (state.expiryWarningTimeout) {
      clearTimeout(state.expiryWarningTimeout)
      set({ expiryWarningTimeout: null })
    }
  },

  // Permission helpers
  hasPermission: (resource: Resource, level: PermissionLevel) => {
    const state = get()
    return hasPermission(state.user, resource, level)
  },

  canView: (resource: Resource) => {
    const state = get()
    return canView(state.user, resource)
  },

  canManage: (resource: Resource) => {
    const state = get()
    return canManage(state.user, resource)
  },

  canAccess: (resource: Resource, action: 'view' | 'create' | 'edit' | 'delete') => {
    const state = get()
    return canAccessResource(state.user, resource, action)
  },

  isAdmin: () => {
    const state = get()
    return checkIsAdmin(state.user)
  },

  hasAnyPermission: (level?: PermissionLevel) => {
    const state = get()
    return hasAnyPermission(state.user, level)
  },

  getVisibleResources: () => {
    const state = get()
    return getVisibleResources(state.user)
  },

  shouldFilterByUser: () => {
    const state = get()
    return shouldFilterByUser(state.user)
  }
}))