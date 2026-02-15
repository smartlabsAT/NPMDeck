import api from './config'
import type { User } from './users'
import { STORAGE_KEYS } from '../constants/storage'

export interface LoginCredentials {
  identity: string
  secret: string
}

export interface TokenResponse {
  token: string
  expires: string
}

export const authApi = {
  // Login with email and password
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/tokens', {
      ...credentials,
      scope: 'user'
    })
    return response.data
  },

  // Get fresh token
  refreshToken: async (): Promise<TokenResponse> => {
    const response = await api.get<TokenResponse>('/tokens')
    return response.data
  },

  // Get current user info
  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/users/me', {
      params: { expand: 'permissions' }
    })
    return response.data
  },

  // Logout (client-side only)
  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }
}