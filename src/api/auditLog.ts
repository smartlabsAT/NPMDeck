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
  [key: string]: unknown
  domain_names?: string[]
  name?: string
  nice_name?: string
  provider?: string
  incoming_port?: number
}

export interface AuditLogEntry {
  id: number
  user_id: number
  object_type: 'proxy-host' | 'redirection-host' | 'stream' | 'stream-host' | 'dead-host' | 'access-list' | 'user' | 'certificate'
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
    const queryParams: Record<string, string> = {}
    if (params.expand?.length) {
      queryParams.expand = params.expand.join(',')
    }
    if (params.query) {
      queryParams.query = params.query
    }
    const response = await api.get<AuditLogEntry[]>('/audit-log', { params: queryParams })
    return response.data
  },
}