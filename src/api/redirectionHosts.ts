import api from './config'
import type { HostEntity, NginxMeta, LetsEncryptMeta } from '../types/base'
import type { Certificate } from './certificates'
import type { AccessList } from './accessLists'

export interface RedirectionHost extends HostEntity {
  forward_http_code: number
  forward_scheme: string
  forward_domain_name: string
  preserve_path: boolean
  block_exploits: boolean
  meta: NginxMeta & LetsEncryptMeta
  // Expanded relations
  certificate?: Certificate
  access_list?: AccessList
}

export interface CreateRedirectionHost {
  domain_names: string[]
  forward_http_code: number
  forward_scheme: string
  forward_domain_name: string
  preserve_path?: boolean
  certificate_id?: number
  ssl_forced?: boolean
  hsts_enabled?: boolean
  hsts_subdomains?: boolean
  block_exploits?: boolean
  http2_support?: boolean
  advanced_config?: string
  meta?: {
    dns_challenge?: boolean
    dns_provider?: string
    dns_provider_credentials?: string
    propagation_seconds?: number
    letsencrypt_email?: string
    letsencrypt_agree?: boolean
  }
  access_list_id?: number
}

export interface UpdateRedirectionHost extends Partial<CreateRedirectionHost> {
  id: number
}

// API functions
export const redirectionHostsApi = {
  async getAll(expand?: string[]): Promise<RedirectionHost[]> {
    const params = expand?.length ? { expand: expand.join(',') } : {}
    const response = await api.get('/nginx/redirection-hosts', { params })
    return response.data
  },

  async getById(id: number, expand?: string[]): Promise<RedirectionHost> {
    const params = expand?.length ? { expand: expand.join(',') } : {}
    const response = await api.get(`/nginx/redirection-hosts/${id}`, { params })
    return response.data
  },

  async create(data: CreateRedirectionHost): Promise<RedirectionHost> {
    const response = await api.post('/nginx/redirection-hosts', data)
    return response.data
  },

  async update(data: UpdateRedirectionHost): Promise<RedirectionHost> {
    const { id, ...updateData } = data
    const response = await api.put(`/nginx/redirection-hosts/${id}`, updateData)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/nginx/redirection-hosts/${id}`)
  },

  async enable(id: number): Promise<RedirectionHost> {
    const response = await api.post(`/nginx/redirection-hosts/${id}/enable`)
    return response.data
  },

  async disable(id: number): Promise<RedirectionHost> {
    const response = await api.post(`/nginx/redirection-hosts/${id}/disable`)
    return response.data
  },
}