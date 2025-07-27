import api from './config'

export interface LoginCredentials {
  identity: string
  secret: string
}

export interface TokenResponse {
  token: string
  expires: string
}

export interface User {
  id: number
  email: string
  name: string
  nickname: string
  is_disabled: boolean
  roles: string[]
  permissions?: Record<string, string[]>
}

export const authApi = {
  // Login with email and password
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await api.post('/tokens', {
      ...credentials,
      scope: 'user'
    })
    return response.data
  },

  // Get fresh token
  refreshToken: async (): Promise<TokenResponse> => {
    const response = await api.get('/tokens')
    return response.data
  },

  // Get current user info
  getMe: async (): Promise<User> => {
    const response = await api.get('/users/me', {
      params: { expand: 'permissions' }
    })
    return response.data
  },

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('npm_token')
    localStorage.removeItem('npm_user')
  }
}