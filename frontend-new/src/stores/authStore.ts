import { create } from 'zustand'
import { authApi, User, LoginCredentials } from '../api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ token: string; user: User } | void>
  logout: () => void
  loadUser: () => Promise<void>
  clearError: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('npm_token'),
  isAuthenticated: !!localStorage.getItem('npm_token'),
  isLoading: false,
  error: null,

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
    authApi.logout()
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
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
  }
}))