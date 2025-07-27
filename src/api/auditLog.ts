import api from './config'

export interface AuditLogUser {
  id: number
  name: string
  nickname: string
  email: string
  avatar: string
  is_disabled: boolean
  is_deleted: boolean
}

export interface AuditLogMeta {
  [key: string]: any
  domain_names?: string[]
  name?: string
  nice_name?: string
  provider?: string
  incoming_port?: number
}

export interface AuditLogEntry {
  id: number
  user_id: number
  object_type: 'proxy-host' | 'redirection-host' | 'stream' | 'dead-host' | 'access-list' | 'user' | 'certificate'
  object_id: number
  action: 'created' | 'updated' | 'deleted' | 'enabled' | 'disabled' | 'renewed'
  meta: AuditLogMeta
  created_on: string
  modified_on: string
  user: AuditLogUser
}

export interface AuditLogSearchParams {
  expand?: string[]
  query?: string
}

export const auditLogApi = {
  async getAll(params: AuditLogSearchParams = {}): Promise<AuditLogEntry[]> {
    const queryParams = new URLSearchParams()
    
    if (params.expand && params.expand.length > 0) {
      queryParams.append('expand', params.expand.join(','))
    }
    
    if (params.query) {
      queryParams.append('query', params.query)
    }
    
    const queryString = queryParams.toString()
    const url = `/audit-log${queryString ? `?${queryString}` : ''}`
    
    const response = await api.get<AuditLogEntry[]>(url)
    return response.data
  },
}