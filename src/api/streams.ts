import api from './config'
import type { ToggleableEntity, NginxMeta, LetsEncryptMeta } from '../types/base'
import { buildExpandParams } from './utils'
import type { Certificate } from './certificates'

export interface Stream extends ToggleableEntity {
  incoming_port: number
  forwarding_host: string
  forwarding_port: number
  tcp_forwarding: boolean
  udp_forwarding: boolean
  certificate_id: number
  meta: NginxMeta & LetsEncryptMeta
  // Expanded relations
  certificate?: Certificate
}

export interface CreateStream {
  incoming_port: number
  forwarding_host: string
  forwarding_port: number
  tcp_forwarding?: boolean
  udp_forwarding?: boolean
  certificate_id?: number
  meta?: {
    letsencrypt_email?: string
    letsencrypt_agree?: boolean
    dns_challenge?: boolean
    dns_provider?: string
    dns_provider_credentials?: string
    propagation_seconds?: number
  }
}

export interface UpdateStream extends Partial<CreateStream> {
  enabled?: boolean
}

export const streamsApi = {
  async getAll(expand?: string[]): Promise<Stream[]> {
    const params = buildExpandParams(expand)
    const response = await api.get('/nginx/streams', { params })
    return response.data
  },

  async getById(id: number, expand?: string[]): Promise<Stream> {
    const params = buildExpandParams(expand)
    const response = await api.get(`/nginx/streams/${id}`, { params })
    return response.data
  },

  async create(data: CreateStream): Promise<Stream> {
    const response = await api.post('/nginx/streams', data)
    return response.data
  },

  async update(id: number, data: UpdateStream): Promise<Stream> {
    const response = await api.put(`/nginx/streams/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/nginx/streams/${id}`)
  },

  async enable(id: number): Promise<void> {
    await api.post(`/nginx/streams/${id}/enable`)
  },

  async disable(id: number): Promise<void> {
    await api.post(`/nginx/streams/${id}/disable`)
  },
}