import { getErrorMessage } from '../types/common'
import React, { useState, useEffect, useOptimistic, startTransition } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  IconButton,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PowerSettingsNew as PowerIcon,
  Language as LanguageIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  TrendingFlat as RedirectIcon,
  ToggleOn as StatusIcon,
  MoreVert as ActionsIcon,
  CallMade as ForwardIcon,
  Security as AccessIcon,
  OpenInNew as LinkIcon,
} from '@mui/icons-material'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData } from '../hooks/useFilteredData'
import { useResponsive } from '../hooks/useResponsive'
import ProxyHostDrawer from '../components/features/proxy-hosts/ProxyHostDrawer'
import ProxyHostDetailsDialog from '../components/ProxyHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PageHeader from '../components/PageHeader'
import PermissionIconButton from '../components/PermissionIconButton'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import { Filter, FilterValue, BulkAction, GroupConfig } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { extractBaseDomain } from '../utils/domainUtils'
import { getStatusIcon } from '../utils/statusUtils'

export default function ProxyHosts() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { canManage: canManageProxyHosts } = usePermissions()
  const { showSuccess, showError } = useToast()
  const { isMobileTable } = useResponsive()
  
  // State
  const [hosts, setHosts] = useState<ProxyHost[]>([])
  const [redirectionsByTarget, setRedirectionsByTarget] = useState<Map<string, RedirectionHost[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [optimisticHosts, setOptimisticHost] = useOptimistic(
    hosts,
    (state, toggledItem: { id: number; enabled: boolean }) =>
      state.map(item =>
        item.id === toggledItem.id ? { ...item, enabled: toggledItem.enabled } : item
      )
  )
  
  // Dialogs
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<ProxyHost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hostToDelete, setHostToDelete] = useState<ProxyHost | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingHost, setViewingHost] = useState<ProxyHost | null>(null)

  useEffect(() => {
    loadHosts()
  }, [])

  // Handle URL parameter for editing or viewing
  useEffect(() => {
    if (location.pathname.includes('/new') && canManageProxyHosts('proxy_hosts')) {
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
        if (location.pathname.includes('/edit') && canManageProxyHosts('proxy_hosts')) {
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
        console.error(`Proxy host with id ${id} not found`)
        navigate('/hosts/proxy')
      }
      // If hosts.length === 0, we'll wait for hosts to load
    } else {
      // No ID in URL, close dialogs
      setDrawerOpen(false)
      setEditingHost(null)
      setDetailsDialogOpen(false)
      setViewingHost(null)
    }
  }, [id, hosts, location.pathname, navigate, loading, canManageProxyHosts])

  const loadHosts = async () => {
    try {
      setLoading(true)
      setError(null)
      // Load both proxy hosts and redirection hosts
      const [proxyData, redirectionData] = await Promise.all([
        proxyHostsApi.getAll(['owner', 'access_list', 'certificate']),
        redirectionHostsApi.getAll()
      ])
      
      setHosts(proxyData)
      
      // Create lookup map for redirections by target domain
      const targetMap = new Map<string, RedirectionHost[]>()
      redirectionData.forEach(redirect => {
        const target = redirect.forward_domain_name.toLowerCase()
        if (!targetMap.has(target)) {
          targetMap.set(target, [])
        }
        targetMap.get(target)!.push(redirect)
      })
      setRedirectionsByTarget(targetMap)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = (host: ProxyHost) => {
    startTransition(async () => {
      // Optimistic update - UI changes instantly
      setOptimisticHost({ id: host.id, enabled: !host.enabled })

      try {
        const hostName = host.domain_names[0] || `#${host.id}`

        if (host.enabled) {
          await proxyHostsApi.disable(host.id)
          showSuccess('proxy-host', 'disabled', hostName, host.id)
        } else {
          await proxyHostsApi.enable(host.id)
          showSuccess('proxy-host', 'enabled', hostName, host.id)
        }
        await loadHosts()
      } catch (err: unknown) {
        const hostName = host.domain_names[0] || `#${host.id}`
        showError('proxy-host', host.enabled ? 'disable' : 'enable', err instanceof Error ? err.message : 'Unknown error', hostName, host.id)
        setError(getErrorMessage(err))
        await loadHosts()
      }
    })
  }

  const handleEdit = (host: ProxyHost) => {
    navigate(`/hosts/proxy/${host.id}/edit`)
  }

  const handleView = (host: ProxyHost) => {
    navigate(`/hosts/proxy/${host.id}/view`)
  }

  const handleAdd = () => {
    setEditingHost(null)
    navigate('/hosts/proxy/new')
  }

  const handleDelete = (host: ProxyHost) => {
    setHostToDelete(host)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!hostToDelete) return
    
    try {
      await proxyHostsApi.delete(hostToDelete.id)
      showSuccess('proxy-host', 'deleted', hostToDelete.domain_names[0] || `#${hostToDelete.id}`, hostToDelete.id)
      await loadHosts()
      setDeleteDialogOpen(false)
      setHostToDelete(null)
    } catch (err: unknown) {
      showError('proxy-host', 'delete', err instanceof Error ? err.message : 'Unknown error', hostToDelete.domain_names[0], hostToDelete.id)
      console.error('Failed to delete host:', err)
    }
  }


  // Apply visibility filtering
  const visibleHosts = useFilteredData(optimisticHosts)

  const getLinkedRedirections = (host: ProxyHost): RedirectionHost[] => {
    const redirections: RedirectionHost[] = []
    host.domain_names.forEach(domain => {
      const domainRedirections = redirectionsByTarget.get(domain.toLowerCase()) || []
      redirections.push(...domainRedirections)
    })
    // Remove duplicates
    return Array.from(new Set(redirections.map(r => r.id))).map(id => 
      redirections.find(r => r.id === id)!
    )
  }

  // Column definitions for DataTable with responsive priorities
  const columns: ResponsiveTableColumn<ProxyHost>[] = [
    {
      id: 'status',
      label: 'Status',
      icon: <StatusIcon fontSize="small" />,
      accessor: (item: ProxyHost) => !item.enabled ? 0 : (item.meta.nginx_online === false ? 1 : 2),
      sortable: true,
      align: 'center',
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_value: unknown, item: ProxyHost) => getStatusIcon(item)
    },
    {
      id: 'domain_names',
      label: 'Domain Names',
      icon: <LanguageIcon fontSize="small" />,
      accessor: (item: ProxyHost) => item.domain_names[0] || '',
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      mobileLabel: 'Domains',
      render: (_value: unknown, item: ProxyHost) => {
        const linkedRedirections = getLinkedRedirections(item)
        return (
          <Box>
            {item.domain_names.map((domain: string, index: number) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5
                }}>
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
            {linkedRedirections.length > 0 && (
              <Tooltip 
                title={
                  <Box>
                    {linkedRedirections.map((redirect, idx) => (
                      <div key={idx}>
                        {redirect.domain_names.join(', ')} → {redirect.forward_domain_name}
                      </div>
                    ))}
                  </Box>
                }
              >
                <Box
                  onClick={(e) => {
                    e.stopPropagation()
                    if (linkedRedirections.length === 1) {
                      navigate(`/hosts/redirection/${linkedRedirections[0].id}/view`)
                    } else {
                      setViewingHost(item)
                      setDetailsDialogOpen(true)
                      navigate(`/hosts/proxy/${item.id}/view/connections`)
                    }
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    ml: 3,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}>
                  <Typography variant="caption" sx={{
                    color: "text.secondary"
                  }}>↳</Typography>
                  <RedirectIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="action" />
                  <Typography variant="caption" color="primary">
                    {linkedRedirections.length} Redirection{linkedRedirections.length > 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    {
      id: 'forward_host',
      label: 'Forward Host',
      icon: <ForwardIcon fontSize="small" />,
      accessor: (item: ProxyHost) => `${item.forward_scheme}://${item.forward_host}:${item.forward_port}`,
      sortable: true,
      priority: 'P2' as ColumnPriority, // Important - hidden on mobile
      showInCard: true,
      mobileLabel: '', // Empty string to hide label - the URL is self-explanatory
      render: (_value: unknown, item: ProxyHost) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5
          }}>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {item.forward_scheme}://{item.forward_host}:{item.forward_port}
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
              window.open(`${item.forward_scheme}://${item.forward_host}:${item.forward_port}`, '_blank')
            }}
          >
            <LinkIcon sx={{ fontSize: '0.875rem' }} />
          </IconButton>
        </Box>
      )
    },
    {
      id: 'ssl',
      label: 'SSL',
      icon: <LockIcon fontSize="small" />,
      accessor: (item: ProxyHost) => !item.certificate_id ? 0 : (item.ssl_forced ? 2 : 1),
      sortable: true,
      align: 'center',
      priority: 'P3' as ColumnPriority, // Optional - hidden on tablet and mobile
      showInCard: true,
      render: (_value: unknown, item: ProxyHost) => {
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
      id: 'access',
      label: 'Access',
      icon: <AccessIcon fontSize="small" />,
      accessor: (item: ProxyHost) => item.access_list?.name || '',
      sortable: true,
      priority: 'P3' as ColumnPriority, // Optional - hidden on tablet and mobile
      showInCard: false,
      render: (_value: unknown, item: ProxyHost) => {
        if (item.access_list) {
          return (
            <Chip 
              label={item.access_list.name} 
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setViewingHost(item)
                setDetailsDialogOpen(true)
                navigate(`/hosts/proxy/${item.id}/view/access`)
              }}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            />
          )
        }
        return (
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>Public
                      </Typography>
        );
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <ActionsIcon fontSize="small" />,
      accessor: (item: ProxyHost) => item.id,
      sortable: false,
      align: 'right',
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_value: unknown, item: ProxyHost) => (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            justifyContent: "flex-end"
          }}>
          <PermissionIconButton
            resource="proxy_hosts"
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
          <PermissionIconButton
            resource="proxy_hosts"
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
            resource="proxy_hosts"
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
      id: 'access',
      label: 'Access',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'public', label: 'Public' },
        { value: 'restricted', label: 'Restricted', icon: <LockIcon fontSize="small" /> }
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
  const filterFunction = (item: ProxyHost, activeFilters: Record<string, FilterValue>) => {
    // SSL filter
    if (activeFilters.ssl && activeFilters.ssl !== 'all') {
      if (activeFilters.ssl === 'forced' && (!item.certificate_id || !item.ssl_forced)) return false
      if (activeFilters.ssl === 'optional' && (!item.certificate_id || item.ssl_forced)) return false
      if (activeFilters.ssl === 'disabled' && item.certificate_id) return false
    }

    // Access filter
    if (activeFilters.access && activeFilters.access !== 'all') {
      if (activeFilters.access === 'public' && item.access_list) return false
      if (activeFilters.access === 'restricted' && !item.access_list) return false
    }

    // Status filter
    if (activeFilters.status && activeFilters.status !== 'all') {
      if (activeFilters.status === 'enabled' && !item.enabled) return false
      if (activeFilters.status === 'disabled' && item.enabled) return false
    }

    return true
  }

  // Bulk actions
  const bulkActions: BulkAction<ProxyHost>[] = [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckCircleIcon />,
      confirmMessage: 'Are you sure you want to enable the selected proxy hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => !item.enabled).map(item => proxyHostsApi.enable(item.id)))
          showSuccess('proxy-host', 'enabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('proxy-host', 'enable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <CancelIcon />,
      confirmMessage: 'Are you sure you want to disable the selected proxy hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => item.enabled).map(item => proxyHostsApi.disable(item.id)))
          showSuccess('proxy-host', 'disabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('proxy-host', 'disable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: 'Are you sure you want to delete the selected proxy hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.map(item => proxyHostsApi.delete(item.id)))
          showSuccess('proxy-host', 'deleted', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('proxy-host', 'delete', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  ]

  // Group configuration for domain grouping
  const groupConfig: GroupConfig<ProxyHost> = {
    groupBy: (item) => {
      const mainDomain = item.domain_names[0] || ''
      return extractBaseDomain(mainDomain)
    },
    groupLabel: (_groupId, _items) => `domain`,
    defaultEnabled: false,
    groupHeaderRender: (groupId, items, _isExpanded) => (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1
        }}>
        <LanguageIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{
          fontWeight: "bold"
        }}>
          {groupId}
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          ({items.length})
        </Typography>
      </Box>
    )
  }

  return (
    <Container maxWidth={false}>
      <title>Proxy Hosts - NPMDeck</title>
      <Box sx={{
        py: 3
      }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3
          }}>
          <PageHeader
            icon={React.createElement(NAVIGATION_CONFIG.proxyHosts.icon, { sx: { color: NAVIGATION_CONFIG.proxyHosts.color } })}
            title={NAVIGATION_CONFIG.proxyHosts.text}
            description="Manage reverse proxy configurations for your web services"
          />
          {!isMobileTable && (
            <PermissionButton
              resource="proxy_hosts"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add Proxy Host
            </PermissionButton>
          )}
        </Box>

        {/* DataTable */}
        <DataTable
          data={visibleHosts}
          columns={columns}
          keyExtractor={(item: ProxyHost) => item.id.toString()}
          onRowClick={handleView}
          bulkActions={bulkActions}
          filters={filters}
          filterFunction={filterFunction}
          searchPlaceholder="Search by domain name, forward host, or port..."
          searchFields={['domain_names', 'forward_host', 'forward_port']}
          loading={loading}
          error={error}
          emptyMessage="No proxy hosts configured"
          defaultSortField="domain_names"
          defaultSortDirection="asc"
          searchable={true}
          selectable={true}
          showPagination={true}
          defaultRowsPerPage={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          groupConfig={groupConfig}
          showGroupToggle={true}
          responsive={true}
          cardBreakpoint={900}
          compactBreakpoint={1250}
        />
        
        {/* Mobile Add Button - shown at bottom */}
        {isMobileTable && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "center"
            }}>
            <PermissionButton
              resource="proxy_hosts"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              fullWidth
              sx={{ maxWidth: 400 }}
            >
              Add Proxy Host
            </PermissionButton>
          </Box>
        )}
      </Box>
      {canManageProxyHosts('proxy_hosts') && (
        <ProxyHostDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            navigate('/hosts/proxy')
          }}
          host={editingHost}
          onSave={() => {
            loadHosts()
            navigate('/hosts/proxy')
          }}
        />
      )}
      <ProxyHostDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          if (id) {
            navigate('/hosts/proxy')
          }
        }}
        host={viewingHost}
        onEdit={canManageProxyHosts('proxy_hosts') ? handleEdit : undefined}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Proxy Host?"
        titleIcon={React.createElement(NAVIGATION_CONFIG.proxyHosts.icon, { sx: { color: NAVIGATION_CONFIG.proxyHosts.color } })}
        message={`Are you sure you want to delete the proxy host for ${hostToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
}