import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  PowerSettingsNew as PowerIcon,
  Language as LanguageIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  TrendingFlat as RedirectIcon,
  SwapHoriz as ProxyIcon,
  CallMade as ForwardIcon,
  Code as CodeIcon,
  ToggleOn as StatusIcon,
  MoreVert as ActionsIcon,
  OpenInNew as LinkIcon,
} from '@mui/icons-material'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { getErrorMessage } from '../types/common'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData } from '../hooks/useFilteredData'
import RedirectionHostDrawer from '../components/RedirectionHostDrawer'
import RedirectionHostDetailsDialog from '../components/RedirectionHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { TableColumn, Filter, BulkAction, GroupConfig } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'

// Helper to extract base domain from a full domain
const extractBaseDomain = (domain: string): string => {
  const parts = domain.split('.')
  if (parts.length > 2) {
    const secondLevel = parts[parts.length - 2]
    if (['co', 'com', 'net', 'org', 'gov', 'edu'].includes(secondLevel) && parts.length > 3) {
      return parts.slice(-3).join('.')
    }
    return parts.slice(-2).join('.')
  }
  return domain
}

const getHttpStatusLabel = (code: number): string => {
  const statusMap: { [key: number]: string } = {
    300: '300 Multiple Choices',
    301: '301 Moved Permanently',
    302: '302 Found',
    303: '303 See Other',
    307: '307 Temporary Redirect',
    308: '308 Permanent Redirect',
  }
  return statusMap[code] || code.toString()
}

export default function RedirectionHosts() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { canManage: canManageRedirectionHosts } = usePermissions()
  const { showSuccess, showError } = useToast()
  
  // State
  const [hosts, setHosts] = useState<RedirectionHost[]>([])
  const [proxyHostsByDomain, setProxyHostsByDomain] = useState<Map<string, ProxyHost>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingHosts, setTogglingHosts] = useState<Set<number>>(new Set())
  
  // Dialogs
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<RedirectionHost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hostToDelete, setHostToDelete] = useState<RedirectionHost | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingHost, setViewingHost] = useState<RedirectionHost | null>(null)

  useEffect(() => {
    loadHosts()
  }, [])

  // Handle URL parameter for editing or viewing
  useEffect(() => {
    if (location.pathname.includes('/new') && canManageRedirectionHosts('redirection_hosts')) {
      setEditingHost(null)
      setDrawerOpen(true)
      setDetailsDialogOpen(false)
      setViewingHost(null)
    } else if (id) {
      // Wait for hosts to load
      if (loading) {
        return
      }
      
      const host = hosts.find(h => h.id === parseInt(id))
      if (host) {
        if (location.pathname.includes('/edit') && canManageRedirectionHosts('redirection_hosts')) {
          setEditingHost(host)
          setDrawerOpen(true)
          setDetailsDialogOpen(false)
          setViewingHost(null)
        } else if (location.pathname.includes('/view')) {
          setViewingHost(host)
          setDetailsDialogOpen(true)
          setDrawerOpen(false)
          setEditingHost(null)
        }
      } else if (hosts.length > 0) {
        // Host not found after loading (but other hosts exist)
        console.error(`Redirection host with id ${id} not found`)
        navigate('/hosts/redirection')
      }
      // If hosts.length === 0, we'll wait for hosts to load
    } else {
      // No ID in URL, close dialogs
      setDrawerOpen(false)
      setEditingHost(null)
      setDetailsDialogOpen(false)
      setViewingHost(null)
    }
  }, [id, hosts, location.pathname, navigate, loading, canManageRedirectionHosts])

  const loadHosts = async () => {
    try {
      setLoading(true)
      setError(null)
      // Load both redirection hosts and proxy hosts
      const [redirectionData, proxyData] = await Promise.all([
        redirectionHostsApi.getAll(['owner', 'certificate']),
        proxyHostsApi.getAll()
      ])
      
      setHosts(redirectionData)
      
      // Create lookup map for proxy hosts by domain
      const domainMap = new Map<string, ProxyHost>()
      proxyData.forEach(host => {
        host.domain_names.forEach(domain => {
          domainMap.set(domain.toLowerCase(), host)
        })
      })
      setProxyHostsByDomain(domainMap)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (host: RedirectionHost) => {
    // Add host ID to toggling set
    setTogglingHosts(prev => new Set(prev).add(host.id))
    
    try {
      const hostName = host.domain_names[0] || `#${host.id}`
      
      if (host.enabled) {
        await redirectionHostsApi.disable(host.id)
        showSuccess('redirection-host', 'disabled', hostName, host.id)
      } else {
        await redirectionHostsApi.enable(host.id)
        showSuccess('redirection-host', 'enabled', hostName, host.id)
      }
      await loadHosts()
    } catch (err: unknown) {
      const hostName = host.domain_names[0] || `#${host.id}`
      showError('redirection-host', host.enabled ? 'disable' : 'enable', err instanceof Error ? err.message : 'Unknown error', hostName, host.id)
      setError(getErrorMessage(err))
    } finally {
      // Remove host ID from toggling set
      setTogglingHosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(host.id)
        return newSet
      })
    }
  }

  const handleEdit = (host: RedirectionHost) => {
    navigate(`/hosts/redirection/${host.id}/edit`)
  }

  const handleView = (host: RedirectionHost) => {
    navigate(`/hosts/redirection/${host.id}/view`)
  }

  const handleAdd = () => {
    setEditingHost(null)
    navigate('/hosts/redirection/new')
  }

  const handleDelete = (host: RedirectionHost) => {
    setHostToDelete(host)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!hostToDelete) return
    
    try {
      await redirectionHostsApi.delete(hostToDelete.id)
      showSuccess('redirection-host', 'deleted', hostToDelete.domain_names[0] || `#${hostToDelete.id}`, hostToDelete.id)
      await loadHosts()
      setDeleteDialogOpen(false)
      setHostToDelete(null)
    } catch (err: unknown) {
      showError('redirection-host', 'delete', err instanceof Error ? err.message : 'Unknown error', hostToDelete.domain_names[0], hostToDelete.id)
      console.error('Failed to delete redirection host:', err)
    }
  }

  // Apply visibility filtering
  const visibleHosts = useFilteredData(hosts)

  const getStatusIcon = (host: RedirectionHost) => {
    if (!host.enabled) {
      return <Tooltip title="Disabled"><CancelIcon color="disabled" /></Tooltip>
    }
    if (host.meta.nginx_online === false) {
      return <Tooltip title={host.meta.nginx_err || 'Offline'}><ErrorIcon color="error" /></Tooltip>
    }
    return <Tooltip title="Online"><CheckCircleIcon color="success" /></Tooltip>
  }

  const getLinkedProxyHost = (forwardDomain: string): ProxyHost | undefined => {
    return proxyHostsByDomain.get(forwardDomain.toLowerCase())
  }

  const handleViewProxyHost = (proxyHost: ProxyHost, event: React.MouseEvent) => {
    event.stopPropagation()
    // Navigate to proxy host overview
    navigate(`/hosts/proxy/${proxyHost.id}/view/overview`)
  }

  // Column definitions for DataTable
  const columns: TableColumn<RedirectionHost>[] = [
    {
      id: 'status',
      label: 'Status',
      icon: <StatusIcon fontSize="small" />,
      accessor: (item) => !item.enabled ? 0 : (item.meta.nginx_online === false ? 1 : 2),
      sortable: true,
      align: 'center',
      render: (value, item) => getStatusIcon(item)
    },
    {
      id: 'domain_names',
      label: 'Source Domains',
      icon: <LanguageIcon fontSize="small" />,
      accessor: (item) => item.domain_names[0] || '',
      sortable: true,
      render: (value, item) => (
        <Box>
          {item.domain_names.map((domain, index) => (
            <Box key={index} display="flex" alignItems="center" gap={0.5}>
              <Typography variant="body2">
                {domain}
              </Typography>
              <IconButton
                size="small"
                sx={{ 
                  p: 0.25,
                  '&:hover': { 
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://${domain}`, '_blank')
                }}
              >
                <LinkIcon sx={{ fontSize: '0.875rem' }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )
    },
    {
      id: 'forward_domain',
      label: 'Destination',
      icon: <ForwardIcon fontSize="small" />,
      accessor: (item) => `${item.forward_scheme}://${item.forward_domain_name}`,
      sortable: true,
      render: (value, item) => {
        const linkedProxy = getLinkedProxyHost(item.forward_domain_name)
        return (
          <Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <RedirectIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {item.forward_scheme}://{item.forward_domain_name}
              </Typography>
              <IconButton
                size="small"
                sx={{ 
                  p: 0.25,
                  '&:hover': { 
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`${item.forward_scheme}://${item.forward_domain_name}`, '_blank')
                }}
              >
                <LinkIcon sx={{ fontSize: '0.875rem' }} />
              </IconButton>
            </Box>
            {linkedProxy && (
              <Box 
                display="flex" 
                alignItems="center" 
                gap={0.5} 
                ml={3}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={(e) => handleViewProxyHost(linkedProxy, e)}
              >
                <Typography variant="caption" color="text.secondary">↳</Typography>
                <ProxyIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="action" />
                <Typography variant="caption" color="primary">
                  Proxy Host
                </Typography>
              </Box>
            )}
          </Box>
        )
      }
    },
    {
      id: 'http_code',
      label: 'HTTP Code',
      icon: <CodeIcon fontSize="small" />,
      accessor: (item) => item.forward_http_code,
      sortable: true,
      render: (value, item) => (
        <Chip 
          label={getHttpStatusLabel(item.forward_http_code)} 
          size="small"
          color={item.forward_http_code >= 300 && item.forward_http_code < 400 ? 'primary' : 'default'}
        />
      )
    },
    {
      id: 'ssl',
      label: 'SSL',
      icon: <LockIcon fontSize="small" />,
      accessor: (item) => !item.certificate_id ? 0 : (item.ssl_forced ? 2 : 1),
      sortable: true,
      align: 'center',
      render: (value, item) => {
        if (!item.certificate_id) {
          return <Tooltip title="No SSL"><LockOpenIcon color="disabled" /></Tooltip>
        }
        if (item.ssl_forced) {
          return <Tooltip title="SSL Forced"><LockIcon color="primary" /></Tooltip>
        }
        return <Tooltip title="SSL Optional"><LockIcon color="action" /></Tooltip>
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <ActionsIcon fontSize="small" />,
      accessor: (item) => item.id,
      sortable: false,
      align: 'right',
      render: (value, item) => (
        <Box display="flex" gap={0.5} justifyContent="flex-end">
          {togglingHosts.has(item.id) ? (
            <IconButton size="small" disabled>
              <CircularProgress size={18} />
            </IconButton>
          ) : (
            <PermissionIconButton
              resource="redirection_hosts"
              permissionAction="edit"
              size="small"
              tooltipTitle={item.enabled ? 'Disable' : 'Enable'}
              onClick={(e) => {
                e.stopPropagation()
                handleToggleEnabled(item)
              }}
              color={item.enabled ? 'default' : 'success'}
            >
              <PowerIcon />
            </PermissionIconButton>
          )}
          <PermissionIconButton
            resource="redirection_hosts"
            permissionAction="edit"
            size="small"
            tooltipTitle="Edit"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(item)
            }}
          >
            <EditIcon />
          </PermissionIconButton>
          <PermissionIconButton
            resource="redirection_hosts"
            permissionAction="delete"
            size="small"
            tooltipTitle="Delete"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(item)
            }}
            color="error"
          >
            <DeleteIcon />
          </PermissionIconButton>
        </Box>
      )
    }
  ]

  // Filter definitions
  const filters: Filter[] = [
    {
      id: 'http_code',
      label: 'HTTP Code',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: '301', label: '301 Moved Permanently' },
        { value: '302', label: '302 Found' },
        { value: '307', label: '307 Temporary Redirect' },
        { value: '308', label: '308 Permanent Redirect' }
      ]
    },
    {
      id: 'ssl',
      label: 'SSL',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'forced', label: 'SSL Forced', icon: <LockIcon fontSize="small" /> },
        { value: 'optional', label: 'SSL Optional', icon: <LockIcon fontSize="small" /> },
        { value: 'disabled', label: 'No SSL', icon: <LockOpenIcon fontSize="small" /> }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'enabled', label: 'Enabled', icon: <CheckCircleIcon fontSize="small" /> },
        { value: 'disabled', label: 'Disabled', icon: <CancelIcon fontSize="small" /> }
      ]
    }
  ]

  // Custom filter function for DataTable
  const filterFunction = (item: RedirectionHost, activeFilters: Record<string, any>) => {
    // HTTP Code filter
    if (activeFilters.http_code && activeFilters.http_code !== 'all') {
      if (item.forward_http_code.toString() !== activeFilters.http_code) return false
    }

    // SSL filter
    if (activeFilters.ssl && activeFilters.ssl !== 'all') {
      if (activeFilters.ssl === 'forced' && (!item.certificate_id || !item.ssl_forced)) return false
      if (activeFilters.ssl === 'optional' && (!item.certificate_id || item.ssl_forced)) return false
      if (activeFilters.ssl === 'disabled' && item.certificate_id) return false
    }

    // Status filter
    if (activeFilters.status && activeFilters.status !== 'all') {
      if (activeFilters.status === 'enabled' && !item.enabled) return false
      if (activeFilters.status === 'disabled' && item.enabled) return false
    }

    return true
  }

  // Bulk actions
  const bulkActions: BulkAction<RedirectionHost>[] = [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckCircleIcon />,
      confirmMessage: 'Are you sure you want to enable the selected redirection hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => !item.enabled).map(item => redirectionHostsApi.enable(item.id)))
          showSuccess('redirection-host', 'enabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('redirection-host', 'enable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <CancelIcon />,
      confirmMessage: 'Are you sure you want to disable the selected redirection hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => item.enabled).map(item => redirectionHostsApi.disable(item.id)))
          showSuccess('redirection-host', 'disabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('redirection-host', 'disable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: 'Are you sure you want to delete the selected redirection hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.map(item => redirectionHostsApi.delete(item.id)))
          showSuccess('redirection-host', 'deleted', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('redirection-host', 'delete', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  ]

  // Group configuration for domain grouping
  const groupConfig: GroupConfig<RedirectionHost> = {
    groupBy: (item) => {
      const mainDomain = item.domain_names[0] || ''
      return extractBaseDomain(mainDomain)
    },
    groupLabel: (_groupId, _items) => `domain`,
    defaultEnabled: false,
    groupHeaderRender: (_groupId, _items, _isExpanded) => (
      <Box display="flex" alignItems="center" gap={1}>
        <LanguageIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight="bold">
          {_groupId}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ({_items.length})
        </Typography>
      </Box>
    )
  }

  return (
    <Container maxWidth={false}>
      <Box py={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <PageHeader
            icon={React.createElement(NAVIGATION_CONFIG.redirectionHosts.icon, { sx: { color: NAVIGATION_CONFIG.redirectionHosts.color } })}
            title={NAVIGATION_CONFIG.redirectionHosts.text}
            description="Configure permanent redirects from one domain to another"
          />
          <PermissionButton
            resource="redirection_hosts"
            permissionAction="create"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Redirection Host
          </PermissionButton>
        </Box>

        {/* DataTable */}
        <DataTable
          data={visibleHosts}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          onRowClick={handleView}
          bulkActions={bulkActions}
          filters={filters}
          filterFunction={filterFunction}
          searchPlaceholder="Search by domain name or forward domain..."
          searchFields={['domain_names', 'forward_domain_name']}
          loading={loading}
          error={error}
          emptyMessage="No redirection hosts configured"
          defaultSortField="domain_names"
          defaultSortDirection="asc"
          searchable={true}
          selectable={true}
          showPagination={true}
          defaultRowsPerPage={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          groupConfig={groupConfig}
          showGroupToggle={true}
        />
      </Box>

      {canManageRedirectionHosts('redirection_hosts') && (
        <RedirectionHostDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            navigate('/hosts/redirection')
          }}
          host={editingHost}
          onSave={() => {
            loadHosts()
            navigate('/hosts/redirection')
          }}
        />
      )}

      <RedirectionHostDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          if (id) {
            navigate('/hosts/redirection')
          }
        }}
        host={viewingHost}
        onEdit={canManageRedirectionHosts('redirection_hosts') ? handleEdit : () => {}}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Redirection Host?"
        titleIcon={<RedirectIcon sx={{ color: '#f1c40f' }} />}
        message={`Are you sure you want to delete the redirection host for ${hostToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  )
}
