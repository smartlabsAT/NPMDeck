import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import logger from '../utils/logger'
import { TIMING } from '../constants/timing'
import { usePermissions } from '../hooks/usePermissions'
import { proxyHostsApi } from '../api/proxyHosts'
import { redirectionHostsApi } from '../api/redirectionHosts'
import { deadHostsApi } from '../api/deadHosts'
import { streamsApi } from '../api/streams'
import { accessListsApi } from '../api/accessLists'
import { certificatesApi } from '../api/certificates'
import { usersApi } from '../api/users'
import { SearchState, SearchResult, SearchAction, ResourceType } from '../types/search'

const CACHE_TTL = TIMING.SEARCH_CACHE_TTL

interface GlobalSearchContextType {
  searchState: SearchState
  preloadData: () => Promise<void>
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: SearchResult[]
  quickActions: SearchAction[]
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined)

export const useGlobalSearch = () => {
  const context = useContext(GlobalSearchContext)
  if (!context) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider')
  }
  return context
}

interface GlobalSearchProviderProps {
  children: ReactNode
}

export const GlobalSearchProvider = ({ children }: GlobalSearchProviderProps) => {
  const navigate = useNavigate()
  const { canView, canManage, isAdmin } = usePermissions()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchState, setSearchState] = useState<SearchState>({
    isLoading: false,
    loadingProgress: {
      proxy_hosts: false,
      redirection_hosts: false,
      dead_hosts: false,
      streams: false,
      access_lists: false,
      certificates: false,
      users: false,
    },
    data: {
      proxy_hosts: [],
      redirection_hosts: [],
      dead_hosts: [],
      streams: [],
      access_lists: [],
      certificates: [],
      users: [],
    },
    lastFetch: 0,
  })

  const preloadData = useCallback(async () => {
    // Check if data is still fresh
    if (Date.now() - searchState.lastFetch < CACHE_TTL && !searchState.isLoading) {
      return
    }

    setSearchState(prev => ({ ...prev, isLoading: true }))

    const loadResource = async (
      type: ResourceType,
      loader: () => Promise<any>,
      canLoad: boolean
    ) => {
      if (!canLoad || type === 'action') return []
      
      setSearchState(prev => ({
        ...prev,
        loadingProgress: { ...prev.loadingProgress, [type]: true }
      }))

      try {
        const data = await loader()
        return data
      } catch (error) {
        logger.error(`Failed to load ${type}:`, error)
        return []
      } finally {
        setSearchState(prev => ({
          ...prev,
          loadingProgress: { ...prev.loadingProgress, [type]: false }
        }))
      }
    }

    const results = await Promise.allSettled([
      loadResource('proxy_hosts', () => proxyHostsApi.getAll(), canView('proxy_hosts')),
      loadResource('redirection_hosts', () => redirectionHostsApi.getAll(), canView('redirection_hosts')),
      loadResource('dead_hosts', () => deadHostsApi.getAll(), canView('dead_hosts')),
      loadResource('streams', () => streamsApi.getAll(), canView('streams')),
      loadResource('access_lists', () => accessListsApi.getAll(), canView('access_lists')),
      loadResource('certificates', () => certificatesApi.getAll(), canView('certificates')),
      loadResource('users', () => usersApi.getAll(), isAdmin),
    ])

    const [proxyHosts, redirectionHosts, deadHosts, streams, accessLists, certificates, users] = 
      results.map(r => r.status === 'fulfilled' ? r.value : [])

    setSearchState({
      isLoading: false,
      loadingProgress: {
        proxy_hosts: false,
        redirection_hosts: false,
        dead_hosts: false,
        streams: false,
        access_lists: false,
        certificates: false,
        users: false,
      },
      data: {
        proxy_hosts: proxyHosts,
        redirection_hosts: redirectionHosts,
        dead_hosts: deadHosts,
        streams: streams,
        access_lists: accessLists,
        certificates: certificates,
        users: users,
      },
      lastFetch: Date.now(),
    })
  }, [searchState.lastFetch, searchState.isLoading, canView, isAdmin])

  // Generate quick actions based on permissions
  const quickActions: SearchAction[] = [
    canManage('proxy_hosts') && {
      id: 'action-new-proxy',
      type: 'action' as const,
      title: 'Add Proxy Host',
      metadata: { resourceType: 'proxy_hosts' },
      action: () => navigate('/hosts/proxy/new'),
    },
    canManage('redirection_hosts') && {
      id: 'action-new-redirection',
      type: 'action' as const,
      title: 'Add Redirection Host',
      metadata: { resourceType: 'redirection_hosts' },
      action: () => navigate('/hosts/redirection/new'),
    },
    canManage('dead_hosts') && {
      id: 'action-new-404',
      type: 'action' as const,
      title: 'Add 404 Host',
      metadata: { resourceType: 'dead_hosts' },
      action: () => navigate('/hosts/404'),
    },
    canManage('streams') && {
      id: 'action-new-stream',
      type: 'action' as const,
      title: 'Add Stream',
      metadata: { resourceType: 'streams' },
      action: () => navigate('/hosts/streams/new'),
    },
    canManage('access_lists') && {
      id: 'action-new-access-list',
      type: 'action' as const,
      title: 'Add Access List',
      metadata: { resourceType: 'access_lists' },
      action: () => navigate('/security/access-lists/new'),
    },
    canManage('certificates') && {
      id: 'action-new-certificate',
      type: 'action' as const,
      title: 'Add SSL Certificate',
      metadata: { resourceType: 'certificates' },
      action: () => navigate('/security/certificates/new'),
    },
    isAdmin && {
      id: 'action-new-user',
      type: 'action' as const,
      title: 'Add User',
      metadata: { resourceType: 'users' },
      action: () => navigate('/admin/users/new'),
    },
  ].filter(Boolean) as SearchAction[]

  // Convert resources to search results
  const searchResults: SearchResult[] = []
  
  // Add proxy hosts
  searchState.data.proxy_hosts.forEach(host => {
    searchResults.push({
      id: `proxy-${host.id}`,
      type: 'proxy_hosts',
      title: host.domain_names.join(', '),
      subtitle: `${host.forward_scheme}://${host.forward_host}:${host.forward_port}`,
      metadata: {
        status: host.enabled ? (host.meta?.nginx_online ? 'online' : 'offline') : 'disabled',
        ssl: !!host.certificate_id,
        owner: host.owner?.name,
      },
      resource: host,
    })
  })

  // Add redirection hosts
  searchState.data.redirection_hosts.forEach(host => {
    searchResults.push({
      id: `redir-${host.id}`,
      type: 'redirection_hosts',
      title: host.domain_names.join(', '),
      subtitle: `→ ${host.forward_scheme}://${host.forward_domain_name}`,
      metadata: {
        status: host.enabled ? 'online' : 'disabled',
        ssl: !!host.certificate_id,
        owner: host.owner?.name,
      },
      resource: host,
    })
  })

  // Add dead hosts
  searchState.data.dead_hosts.forEach(host => {
    searchResults.push({
      id: `dead-${host.id}`,
      type: 'dead_hosts',
      title: host.domain_names.join(', '),
      subtitle: '404 Host',
      metadata: {
        status: host.enabled ? 'online' : 'disabled',
        ssl: !!host.certificate_id,
        owner: host.owner?.name,
      },
      resource: host,
    })
  })

  // Add streams
  searchState.data.streams.forEach(stream => {
    searchResults.push({
      id: `stream-${stream.id}`,
      type: 'streams',
      title: `Port ${stream.incoming_port}`,
      subtitle: `→ ${stream.forwarding_host}:${stream.forwarding_port}`,
      metadata: {
        status: stream.enabled ? (stream.meta?.nginx_online ? 'online' : 'offline') : 'disabled',
        port: stream.incoming_port,
        owner: stream.owner?.name,
      },
      resource: stream,
    })
  })

  // Add access lists
  searchState.data.access_lists.forEach(list => {
    searchResults.push({
      id: `access-${list.id}`,
      type: 'access_lists',
      title: list.name,
      subtitle: `${list.items?.length || 0} items`,
      metadata: {
        owner: list.owner?.name,
      },
      resource: list,
    })
  })

  // Add certificates
  searchState.data.certificates.forEach(cert => {
    searchResults.push({
      id: `cert-${cert.id}`,
      type: 'certificates',
      title: cert.nice_name || cert.domain_names.join(', '),
      subtitle: `Expires: ${new Date(cert.expires_on).toLocaleDateString()}`,
      metadata: {
        status: new Date(cert.expires_on) > new Date() ? 'online' : 'offline',
        owner: cert.owner?.name,
      },
      resource: cert,
    })
  })

  // Add users (admin only)
  searchState.data.users.forEach(user => {
    searchResults.push({
      id: `user-${user.id}`,
      type: 'users',
      title: user.name || user.email,
      subtitle: user.roles.join(', '),
      metadata: {
        status: user.is_disabled ? 'disabled' : 'online',
      },
      resource: user,
    })
  })

  return (
    <GlobalSearchContext.Provider
      value={{
        searchState,
        preloadData,
        searchQuery,
        setSearchQuery,
        searchResults,
        quickActions,
      }}
    >
      {children}
    </GlobalSearchContext.Provider>
  )
}