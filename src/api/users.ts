import api from './config'
import { buildExpandParams } from './utils'
import type { BaseEntity } from '../types/base'

export interface User extends BaseEntity {
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
  last_login?: string
}

export interface CreateUserPayload {
  name: string
  nickname: string
  email: string
  is_disabled?: boolean
  roles?: string[]
}

export type UpdateUserPayload = Partial<CreateUserPayload>

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
  async getAll(expand?: string[], query?: string): Promise<User[]> {
    const params: Record<string, string> = { ...buildExpandParams(expand) }
    if (query) {
      params.query = query
    }
    const response = await api.get('/users', { params })
    return response.data
  },

  // Get a single user
  async getById(id: number, expand?: string[]): Promise<User> {
    const response = await api.get(`/users/${id}`, { params: buildExpandParams(expand) })
    return response.data
  },

  // Create a new user
  async create(data: CreateUserPayload): Promise<User> {
    const response = await api.post('/users', data)
    return response.data
  },

  // Update a user
  async update(id: number, data: UpdateUserPayload): Promise<User> {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  // Delete a user
  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  // Update user password
  async updatePassword(id: number, data: UserPasswordPayload): Promise<void> {
    await api.put(`/users/${id}/auth`, data)
  },

  // Update user permissions
  async updatePermissions(id: number, permissions: User['permissions']): Promise<void> {
    await api.put(`/users/${id}/permissions`, permissions)
  },

  // Login as another user (admin only)
  async loginAs(id: number): Promise<LoginAsResponse> {
    const response = await api.post(`/users/${id}/login`)
    return response.data
  },
}