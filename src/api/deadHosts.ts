import api from './config'
import type { HostEntity, NginxMeta, LetsEncryptMeta } from '../types/base'
import { buildExpandParams } from './utils'
import type { Certificate } from './certificates'

export interface DeadHost extends HostEntity {
  meta: NginxMeta & LetsEncryptMeta
  // Expanded relations
  certificate?: Certificate
}

export interface CreateDeadHost {
  domain_names: string[]
  certificate_id?: number
  ssl_forced?: boolean
  hsts_enabled?: boolean
  hsts_subdomains?: boolean
  http2_support?: boolean
  advanced_config?: string
  meta?: {
    letsencrypt_agree?: boolean
    dns_challenge?: boolean
    dns_provider?: string
    dns_provider_credentials?: string
    propagation_seconds?: number
  }
}

export interface UpdateDeadHost extends CreateDeadHost {
  enabled?: boolean
}

export const deadHostsApi = {
  async getAll(expand?: string[]): Promise<DeadHost[]> {
    const params = buildExpandParams(expand)
    const response = await api.get('/nginx/dead-hosts', { params })
    return response.data
  },

  async getById(id: number, expand?: string[]): Promise<DeadHost> {
    const params = buildExpandParams(expand)
    const response = await api.get(`/nginx/dead-hosts/${id}`, { params })
    return response.data
  },

  async create(data: CreateDeadHost): Promise<DeadHost> {
    const response = await api.post('/nginx/dead-hosts', data)
    return response.data
  },

  async update(id: number, data: UpdateDeadHost): Promise<DeadHost> {
    const response = await api.put(`/nginx/dead-hosts/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/nginx/dead-hosts/${id}`)
  },

  async enable(id: number): Promise<void> {
    await api.post(`/nginx/dead-hosts/${id}/enable`)
  },

  async disable(id: number): Promise<void> {
    await api.post(`/nginx/dead-hosts/${id}/disable`)
  },

  async setCertificates(id: number, formData: FormData): Promise<DeadHost> {
    const response = await api.post(`/nginx/dead-hosts/${id}/certificates`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}