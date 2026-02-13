import api from './config'
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

class AccessListsApi {
  async getAll(expand?: string[]): Promise<AccessList[]> {
    const params = expand?.length ? { expand: expand.join(',') } : undefined
    const response = await api.get('/nginx/access-lists', { params })
    return response.data
  }

  async getById(id: number, expand?: string[]): Promise<AccessList> {
    const params = expand?.length ? { expand: expand.join(',') } : undefined
    const response = await api.get(`/nginx/access-lists/${id}`, { params })
    return response.data
  }

  async create(data: CreateAccessList): Promise<AccessList> {
    const response = await api.post('/nginx/access-lists', data)
    return response.data
  }

  async update(id: number, data: UpdateAccessList): Promise<AccessList> {
    const response = await api.put(`/nginx/access-lists/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<boolean> {
    await api.delete(`/nginx/access-lists/${id}`)
    return true
  }
}

export const accessListsApi = new AccessListsApi()