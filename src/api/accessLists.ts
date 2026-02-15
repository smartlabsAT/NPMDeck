import api from './config'
import { buildExpandParams } from './utils'
import type { OwnedEntity, BaseEntity } from '../types/base'

export interface AccessList extends OwnedEntity {
  name: string
  meta: Record<string, unknown>
  satisfy_any: boolean
  pass_auth: boolean
  // Relations
  items?: AccessListItem[]
  clients?: AccessListClient[]
}

export interface AccessListItem extends BaseEntity {
  username: string
  password: string
}

export interface AccessListClient extends BaseEntity {
  address: string
  directive: 'allow' | 'deny'
}

export interface CreateAccessList {
  name: string
  satisfy_any?: boolean
  pass_auth?: boolean
  items?: Array<{
    username: string
    password: string
  }>
  clients?: Array<{
    address: string
    directive: 'allow' | 'deny'
  }>
}

export type UpdateAccessList = CreateAccessList

export const accessListsApi = {
  async getAll(expand?: string[]): Promise<AccessList[]> {
    const params = buildExpandParams(expand)
    const response = await api.get<AccessList[]>('/nginx/access-lists', { params })
    return response.data
  },

  async getById(id: number, expand?: string[]): Promise<AccessList> {
    const params = buildExpandParams(expand)
    const response = await api.get<AccessList>(`/nginx/access-lists/${id}`, { params })
    return response.data
  },

  async create(data: CreateAccessList): Promise<AccessList> {
    const response = await api.post<AccessList>('/nginx/access-lists', data)
    return response.data
  },

  async update(id: number, data: UpdateAccessList): Promise<AccessList> {
    const response = await api.put<AccessList>(`/nginx/access-lists/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete<void>(`/nginx/access-lists/${id}`)
  },
}