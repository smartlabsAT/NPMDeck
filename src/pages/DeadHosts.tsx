import React, { useState, useEffect, useOptimistic, startTransition } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Tooltip,
  // Chip,
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
  Block as BlockIcon,
  // Visibility as ViewIcon,
  // CalendarToday as CreatedIcon,
  MoreVert as ActionsIcon,
  Settings as ResponseIcon,
  ToggleOn as StatusIcon,
} from '@mui/icons-material'
import { deadHostsApi, DeadHost } from '../api/deadHosts'
import { getErrorMessage } from '../types/common'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData } from '../hooks/useFilteredData'
import { useResponsive } from '../hooks/useResponsive'
import { DeadHostDrawer } from '../components/features'
import DeadHostDetailsDialog from '../components/DeadHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import { Filter, FilterValue, BulkAction } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { getStatusIcon } from '../utils/statusUtils'
import logger from '../utils/logger'

export default function DeadHosts() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { canManage: canManageDeadHosts } = usePermissions()
  const { showSuccess, showError } = useToast()
  const { isMobileTable } = useResponsive()
  
  // State
  const [hosts, setHosts] = useState<DeadHost[]>([])
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
  const [editingHost, setEditingHost] = useState<DeadHost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hostToDelete, setHostToDelete] = useState<DeadHost | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingHost, setViewingHost] = useState<DeadHost | null>(null)

  useEffect(() => {
    loadHosts()
  }, [])

  // Handle URL parameter for editing or viewing
  useEffect(() => {
    // Handle new host creation
    if (location.pathname.includes('/new') && canManageDeadHosts('dead_hosts')) {
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
        if (location.pathname.includes('/edit') && canManageDeadHosts('dead_hosts')) {
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
        logger.error(`404 host with id ${id} not found`)
        navigate('/hosts/404')
      }
      // If hosts.length === 0, we'll wait for hosts to load
    } else {
      // No ID in URL, close dialogs
      setDrawerOpen(false)
      setEditingHost(null)
      setDetailsDialogOpen(false)
      setViewingHost(null)
    }
  }, [id, hosts, location.pathname, navigate, loading, canManageDeadHosts])

  const loadHosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await deadHostsApi.getAll(['owner', 'certificate'])
      setHosts(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = (host: DeadHost) => {
    startTransition(async () => {
      // Optimistic update - UI changes instantly
      setOptimisticHost({ id: host.id, enabled: !host.enabled })

      try {
        const hostName = host.domain_names[0] || `#${host.id}`

        if (host.enabled) {
          await deadHostsApi.disable(host.id)
          showSuccess('dead-host', 'disabled', hostName, host.id)
        } else {
          await deadHostsApi.enable(host.id)
          showSuccess('dead-host', 'enabled', hostName, host.id)
        }
        await loadHosts()
      } catch (err: unknown) {
        const hostName = host.domain_names[0] || `#${host.id}`
        showError('dead-host', host.enabled ? 'disable' : 'enable', err instanceof Error ? err.message : 'Unknown error', hostName, host.id)
        setError(getErrorMessage(err))
        await loadHosts()
      }
    })
  }

  const handleEdit = (host: DeadHost) => {
    navigate(`/hosts/404/${host.id}/edit`)
  }

  const handleView = (host: DeadHost) => {
    navigate(`/hosts/404/${host.id}/view`)
  }

  const handleAdd = () => {
    setEditingHost(null)
    navigate('/hosts/404/new')
  }

  const handleDelete = (host: DeadHost) => {
    setHostToDelete(host)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!hostToDelete) return
    
    try {
      await deadHostsApi.delete(hostToDelete.id)
      showSuccess('dead-host', 'deleted', hostToDelete.domain_names[0] || `#${hostToDelete.id}`, hostToDelete.id)
      await loadHosts()
      setDeleteDialogOpen(false)
      setHostToDelete(null)
    } catch (err: unknown) {
      showError('dead-host', 'delete', err instanceof Error ? err.message : 'Unknown error', hostToDelete.domain_names[0], hostToDelete.id)
      logger.error('Failed to delete 404 host:', err)
    }
  }

  // Apply visibility filtering
  const visibleHosts = useFilteredData(optimisticHosts)

  // Column definitions for DataTable with responsive priorities
  const columns: ResponsiveTableColumn<DeadHost>[] = [
    {
      id: 'status',
      label: 'Status',
      icon: <StatusIcon fontSize="small" />,
      accessor: (item) => !item.enabled ? 0 : (item.meta.nginx_online === false ? 1 : 2),
      sortable: true,
      align: 'center',
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (value, item) => getStatusIcon(item)
    },
    {
      id: 'domain_names',
      label: 'Domain Names',
      icon: <LanguageIcon fontSize="small" />,
      accessor: (item) => item.domain_names[0] || '',
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      mobileLabel: 'Domains',
      render: (value, item) => (
        <Box>
          {item.domain_names.map((domain, index) => (
            <Typography 
              key={index}
              variant="body2"
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  textDecoration: 'underline',
                  color: 'primary.main'
                }
              }}
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://${domain}`, '_blank')
              }}
            >
              {domain}
            </Typography>
          ))}
        </Box>
      )
    },
    {
      id: 'response',
      label: 'Response',
      icon: <ResponseIcon fontSize="small" />,
      accessor: () => '404',
      sortable: false,
      priority: 'P2' as ColumnPriority, // Important - hidden on mobile
      showInCard: true,
      mobileLabel: '', // Empty string to hide label - "404 Not Found" is self-explanatory
      render: () => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5
          }}>
          <BlockIcon fontSize="small" color="action" />
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            404 Not Found
          </Typography>
        </Box>
      )
    },
    {
      id: 'ssl',
      label: 'SSL',
      icon: <LockIcon fontSize="small" />,
      accessor: (item) => !item.certificate_id ? 0 : (item.ssl_forced ? 2 : 1),
      sortable: true,
      align: 'center',
      priority: 'P3' as ColumnPriority, // Optional - hidden on tablet and mobile
      showInCard: true,
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
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (value, item) => (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            justifyContent: "flex-end"
          }}>
          <PermissionIconButton
            resource="dead_hosts"
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
            resource="dead_hosts"
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
            resource="dead_hosts"
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
  const filterFunction = (item: DeadHost, activeFilters: Record<string, FilterValue>) => {
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
  const bulkActions: BulkAction<DeadHost>[] = [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckCircleIcon />,
      confirmMessage: 'Are you sure you want to enable the selected 404 hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => !item.enabled).map(item => deadHostsApi.enable(item.id)))
          showSuccess('dead-host', 'enabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('dead-host', 'enable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <CancelIcon />,
      confirmMessage: 'Are you sure you want to disable the selected 404 hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => item.enabled).map(item => deadHostsApi.disable(item.id)))
          showSuccess('dead-host', 'disabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('dead-host', 'disable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: 'Are you sure you want to delete the selected 404 hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.map(item => deadHostsApi.delete(item.id)))
          showSuccess('dead-host', 'deleted', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('dead-host', 'delete', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  ]

  return (
    <Container maxWidth={false}>
      <title>404 Hosts - NPMDeck</title>
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
            icon={React.createElement(NAVIGATION_CONFIG.deadHosts.icon, { sx: { color: NAVIGATION_CONFIG.deadHosts.color } })}
            title={NAVIGATION_CONFIG.deadHosts.text}
            description="Configure custom 404 error pages for unmatched domains"
          />
          {!isMobileTable && (
            <PermissionButton
              resource="dead_hosts"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add 404 Host
            </PermissionButton>
          )}
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
          searchPlaceholder="Search by domain name..."
          searchFields={['domain_names']}
          loading={loading}
          error={error}
          emptyMessage="No 404 hosts configured"
          defaultSortField="domain_names"
          defaultSortDirection="asc"
          searchable={true}
          selectable={true}
          showPagination={true}
          defaultRowsPerPage={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
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
              resource="dead_hosts"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              fullWidth
              sx={{ maxWidth: 400 }}
            >
              Add 404 Host
            </PermissionButton>
          </Box>
        )}
      </Box>
      {canManageDeadHosts('dead_hosts') && (
        <DeadHostDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            navigate('/hosts/404')
          }}
          host={editingHost}
          onSave={() => {
            loadHosts()
            navigate('/hosts/404')
          }}
        />
      )}
      <DeadHostDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          if (id) {
            navigate('/hosts/404')
          }
        }}
        host={viewingHost}
        onEdit={canManageDeadHosts('dead_hosts') ? handleEdit : undefined}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete 404 Host?"
        titleIcon={React.createElement(NAVIGATION_CONFIG.deadHosts.icon, { sx: { color: NAVIGATION_CONFIG.deadHosts.color } })}
        message={`Are you sure you want to delete the 404 host for ${hostToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
}