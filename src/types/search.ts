import { ProxyHost } from '../api/proxyHosts'
import { RedirectionHost } from '../api/redirectionHosts'
import { DeadHost } from '../api/deadHosts'
import { Stream } from '../api/streams'
import { AccessList } from '../api/accessLists'
import { Certificate } from '../api/certificates'
import { User } from '../api/users'
import type { SearchResourceType } from './entityTypes'

export type ResourceType = SearchResourceType

export interface SearchResult {
  id: string
  type: ResourceType
  title: string
  subtitle?: string
  metadata?: {
    status?: 'online' | 'offline' | 'disabled'
    ssl?: boolean
    port?: number
    owner?: string
    resourceType?: ResourceType
  }
  resource?: ProxyHost | RedirectionHost | DeadHost | Stream | AccessList | Certificate | User
  action?: () => void
}

export interface SearchAction {
  id: string
  type: 'action'
  title: string
  icon?: React.ReactNode
  metadata?: {
    resourceType?: ResourceType
  }
  action: () => void
}

export interface SearchState {
  isLoading: boolean
  loadingProgress: {
    proxy_hosts: boolean
    redirection_hosts: boolean
    dead_hosts: boolean
    streams: boolean
    access_lists: boolean
    certificates: boolean
    users: boolean
  }
  data: {
    proxy_hosts: ProxyHost[]
    redirection_hosts: RedirectionHost[]
    dead_hosts: DeadHost[]
    streams: Stream[]
    access_lists: AccessList[]
    certificates: Certificate[]
    users: User[]
  }
  lastFetch: number
  error?: string
}