import api from './config'
import type { HostEntity, NginxMeta, LetsEncryptMeta } from '../types/base'
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

class DeadHostsApi {
  async getAll(expand?: string[]): Promise<DeadHost[]> {
    const params = expand?.length ? { expand: expand.join(',') } : undefined
    const response = await api.get('/nginx/dead-hosts', { params })
    return response.data
  }

  async getById(id: number, expand?: string[]): Promise<DeadHost> {
    const params = expand?.length ? { expand: expand.join(',') } : undefined
    const response = await api.get(`/nginx/dead-hosts/${id}`, { params })
    return response.data
  }

  async create(data: CreateDeadHost): Promise<DeadHost> {
    const response = await api.post('/nginx/dead-hosts', data)
    return response.data
  }

  async update(id: number, data: UpdateDeadHost): Promise<DeadHost> {
    const response = await api.put(`/nginx/dead-hosts/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<boolean> {
    await api.delete(`/nginx/dead-hosts/${id}`)
    return true
  }

  async enable(id: number): Promise<boolean> {
    await api.post(`/nginx/dead-hosts/${id}/enable`)
    return true
  }

  async disable(id: number): Promise<boolean> {
    await api.post(`/nginx/dead-hosts/${id}/disable`)
    return true
  }

  async setCertificates(id: number, formData: FormData): Promise<DeadHost> {
    const response = await api.post(`/nginx/dead-hosts/${id}/certificates`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

export const deadHostsApi = new DeadHostsApi()