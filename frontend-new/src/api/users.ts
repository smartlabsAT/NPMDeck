import api from './config'

export interface User {
  id: number
  email: string
  name: string
  nickname: string
  avatar?: string
  is_disabled: boolean
  roles: string[]
  permissions?: {
    visibility?: 'all' | 'user'
    proxy_hosts?: 'hidden' | 'view' | 'manage'
    redirection_hosts?: 'hidden' | 'view' | 'manage'
    dead_hosts?: 'hidden' | 'view' | 'manage'
    streams?: 'hidden' | 'view' | 'manage'
    access_lists?: 'hidden' | 'view' | 'manage'
    certificates?: 'hidden' | 'view' | 'manage'
  }
  created_on: string
  modified_on: string
}

export interface CreateUserPayload {
  name: string
  nickname: string
  email: string
  is_disabled?: boolean
  permissions?: User['permissions']
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {}

export interface UserPasswordPayload {
  type: 'password'
  current?: string
  secret: string
}

export interface LoginAsResponse {
  token: string
  user: User
}

export const usersApi = {
  // Get all users
  getAll: async (expand?: string[], query?: string): Promise<User[]> => {
    const params: any = {}
    if (expand && expand.length > 0) {
      params.expand = expand.join(',')
    }
    if (query) {
      params.query = query
    }
    
    const response = await api.get('/users', { params })
    return response.data
  },

  // Get a single user
  getOne: async (id: number, expand?: string[]): Promise<User> => {
    const params: any = {}
    if (expand && expand.length > 0) {
      params.expand = expand.join(',')
    }
    
    const response = await api.get(`/users/${id}`, { params })
    return response.data
  },

  // Create a new user
  create: async (data: CreateUserPayload): Promise<User> => {
    const response = await api.post('/users', data)
    return response.data
  },

  // Update a user
  update: async (id: number, data: UpdateUserPayload): Promise<User> => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  // Delete a user
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  // Update user password
  updatePassword: async (id: number, data: UserPasswordPayload): Promise<void> => {
    await api.put(`/users/${id}/auth`, data)
  },

  // Update user permissions
  updatePermissions: async (id: number, permissions: User['permissions']): Promise<void> => {
    await api.put(`/users/${id}/permissions`, permissions)
  },

  // Login as another user (admin only)
  loginAs: async (id: number): Promise<LoginAsResponse> => {
    const response = await api.post(`/users/${id}/login`)
    return response.data
  }
}