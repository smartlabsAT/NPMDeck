import api from './config'
import type { HostEntity } from '../types/base'
import { buildExpandParams } from './utils'
import type { Certificate } from './certificates'
import type { AccessList } from './accessLists'

export interface ProxyHost extends HostEntity {
  forward_host: string
  forward_port: number
  access_list_id: number
  caching_enabled: boolean
  block_exploits: boolean
  allow_websocket_upgrade: boolean
  forward_scheme: 'http' | 'https'
  locations: ProxyHostLocation[] | null
  // Expanded relations
  certificate?: Certificate
  access_list?: AccessList
}

export interface ProxyHostLocation {
  id?: number | null
  path: string
  forward_scheme: 'http' | 'https'
  forward_host: string
  forward_port: number
  forward_path?: string
  advanced_config?: string
}

export interface CreateProxyHost {
  domain_names: string[]
  forward_host: string
  forward_port: number
  forward_scheme: 'http' | 'https'
  access_list_id?: number
  certificate_id?: number
  ssl_forced?: boolean
  caching_enabled?: boolean
  block_exploits?: boolean
  advanced_config?: string
  allow_websocket_upgrade?: boolean
  http2_support?: boolean
  hsts_enabled?: boolean
  hsts_subdomains?: boolean
  locations?: ProxyHostLocation[]
}

export interface UpdateProxyHost extends CreateProxyHost {
  enabled?: boolean
}

export const proxyHostsApi = {
  async getAll(expand?: string[]): Promise<ProxyHost[]> {
    const params = buildExpandParams(expand)
    const response = await api.get<ProxyHost[]>('/nginx/proxy-hosts', { params })
    return response.data
  },

  async getById(id: number, expand?: string[]): Promise<ProxyHost> {
    const params = buildExpandParams(expand)
    const response = await api.get<ProxyHost>(`/nginx/proxy-hosts/${id}`, { params })
    return response.data
  },

  async create(data: CreateProxyHost): Promise<ProxyHost> {
    const response = await api.post<ProxyHost>('/nginx/proxy-hosts', data)
    return response.data
  },

  async update(id: number, data: UpdateProxyHost): Promise<ProxyHost> {
    const response = await api.put<ProxyHost>(`/nginx/proxy-hosts/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete<void>(`/nginx/proxy-hosts/${id}`)
  },

  async enable(id: number): Promise<void> {
    await api.post<void>(`/nginx/proxy-hosts/${id}/enable`)
  },

  async disable(id: number): Promise<void> {
    await api.post<void>(`/nginx/proxy-hosts/${id}/disable`)
  },
}