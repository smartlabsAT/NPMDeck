import { create } from 'zustand'
import { authApi, User, LoginCredentials, TokenResponse } from '../api/auth'

interface TokenInfo {
  token: string
  user: User
  expires: string
  addedAt: Date
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tokenStack: TokenInfo[]
  refreshInterval: NodeJS.Timeout | null
  
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
}

// Helper to load token stack from localStorage
const loadTokenStack = (): TokenInfo[] => {
  try {
    const stack = localStorage.getItem('npm_token_stack')
    return stack ? JSON.parse(stack) : []
  } catch {
    return []
  }
}

// Helper to save token stack to localStorage
const saveTokenStack = (stack: TokenInfo[]) => {
  localStorage.setItem('npm_token_stack', JSON.stringify(stack))
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('npm_token'),
  isAuthenticated: !!localStorage.getItem('npm_token'),
  isLoading: false,
  error: null,
  tokenStack: loadTokenStack(),
  refreshInterval: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null })
    
    try {
      // Get token
      const tokenResponse = await authApi.login(credentials)
      localStorage.setItem('npm_token', tokenResponse.token)
      
      // Get user info
      const user = await authApi.getMe()
      localStorage.setItem('npm_user', JSON.stringify(user))
      
      set({
        user,
        token: tokenResponse.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      
      // Start token refresh timer
      get().startTokenRefresh()
      
      // Return the login data for checking default admin
      return { token: tokenResponse.token, user }
    } catch (error) {
      let errorMessage = 'Login failed'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        if (axiosError.response?.data?.error?.message) {
          errorMessage = axiosError.response.data.error.message
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
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
    
    // Clear auth data
    authApi.logout()
    
    // Clear token stack
    localStorage.removeItem('npm_token_stack')
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      tokenStack: []
    })
  },

  loadUser: async () => {
    const token = get().token
    if (!token) return

    set({ isLoading: true })
    
    try {
      // Try to get user from localStorage first
      const storedUser = localStorage.getItem('npm_user')
      if (storedUser) {
        set({ user: JSON.parse(storedUser), isLoading: false })
      }
      
      // Then fetch fresh user data
      const user = await authApi.getMe()
      localStorage.setItem('npm_user', JSON.stringify(user))
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      })
      
      // Start token refresh if not already running
      const state = get()
      if (!state.refreshInterval) {
        state.startTokenRefresh()
      }
    } catch (error) {
      // If loading user fails, clear auth state
      authApi.logout()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  },

  clearError: () => set({ error: null }),
  
  setUser: (user: User) => {
    localStorage.setItem('npm_user', JSON.stringify(user))
    set({ user })
  },

  switchAccount: async (tokenInfo: TokenInfo) => {
    const state = get()
    
    // Stop current refresh timer
    state.stopTokenRefresh()
    
    // Set new active token
    localStorage.setItem('npm_token', tokenInfo.token)
    localStorage.setItem('npm_user', JSON.stringify(tokenInfo.user))
    
    set({
      token: tokenInfo.token,
      user: tokenInfo.user,
      isAuthenticated: true,
      error: null
    })
    
    // Remove this token from stack
    const newStack = state.tokenStack.filter(t => t.token !== tokenInfo.token)
    set({ tokenStack: newStack })
    saveTokenStack(newStack)
    
    // Start refresh timer for new token
    state.startTokenRefresh()
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
    
    // Refresh token every 15 minutes
    const interval = setInterval(() => {
      state.refreshToken()
    }, 15 * 60 * 1000) // 15 minutes
    
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
    try {
      const response = await authApi.refreshToken()
      localStorage.setItem('npm_token', response.token)
      set({ token: response.token })
      
      console.log('Token refreshed successfully')
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Don't logout on refresh failure - the interceptor will handle 401s
    }
  }
}))