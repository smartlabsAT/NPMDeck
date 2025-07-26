import api from './config'

export interface ProxyHost {
  id: number
  created_on: string
  modified_on: string
  owner_user_id: number
  domain_names: string[]
  forward_host: string
  forward_port: number
  access_list_id: number
  certificate_id: number
  ssl_forced: boolean
  caching_enabled: boolean
  block_exploits: boolean
  advanced_config: string
  meta: {
    nginx_online?: boolean
    nginx_err?: string | null
  }
  allow_websocket_upgrade: boolean
  http2_support: boolean
  forward_scheme: 'http' | 'https'
  enabled: boolean
  locations: ProxyHostLocation[] | null
  hsts_enabled: boolean
  hsts_subdomains: boolean
  // Expanded relations
  certificate?: any
  owner?: any
  access_list?: any
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

class ProxyHostsApi {
  async getAll(expand?: string[]): Promise<ProxyHost[]> {
    const params = expand?.length ? { expand: expand.join(',') } : undefined
    const response = await api.get('/nginx/proxy-hosts', { params })
    return response.data
  }

  async getById(id: number, expand?: string[]): Promise<ProxyHost> {
    const params = expand?.length ? { expand: expand.join(',') } : undefined
    const response = await api.get(`/nginx/proxy-hosts/${id}`, { params })
    return response.data
  }

  async create(data: CreateProxyHost): Promise<ProxyHost> {
    const response = await api.post('/nginx/proxy-hosts', data)
    return response.data
  }

  async update(id: number, data: UpdateProxyHost): Promise<ProxyHost> {
    const response = await api.put(`/nginx/proxy-hosts/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<boolean> {
    await api.delete(`/nginx/proxy-hosts/${id}`)
    return true
  }

  async enable(id: number): Promise<boolean> {
    await api.post(`/nginx/proxy-hosts/${id}/enable`)
    return true
  }

  async disable(id: number): Promise<boolean> {
    await api.post(`/nginx/proxy-hosts/${id}/disable`)
    return true
  }
}

export const proxyHostsApi = new ProxyHostsApi()