import React, { useState, useEffect, useOptimistic, startTransition, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
} from '@mui/material'
import {
  Add as AddIcon,
} from '@mui/icons-material'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { getErrorMessage } from '../types/common'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData } from '../hooks/useFilteredData'
import { useResponsive } from '../hooks/useResponsive'
import useRedirectionHostColumns from '../hooks/useRedirectionHostColumns'
import useRedirectionHostFilters from '../hooks/useRedirectionHostFilters'
import useRedirectionHostBulkActions from '../hooks/useRedirectionHostBulkActions'
import useDomainGroupConfig from '../hooks/useDomainGroupConfig'
import RedirectionHostDrawer from '../components/RedirectionHostDrawer'
import RedirectionHostDetailsDialog from '../components/RedirectionHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import logger from '../utils/logger'

export default function RedirectionHosts() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { canManage: canManageRedirectionHosts } = usePermissions()
  const { showSuccess, showError } = useToast()
  const { isMobileTable } = useResponsive()
  
  // State
  const [hosts, setHosts] = useState<RedirectionHost[]>([])
  const [proxyHostsByDomain, setProxyHostsByDomain] = useState<Map<string, ProxyHost>>(new Map())
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
        logger.error(`Redirection host with id ${id} not found`)
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

  const handleToggleEnabled = useCallback((host: RedirectionHost) => {
    startTransition(async () => {
      // Optimistic update - UI changes instantly
      setOptimisticHost({ id: host.id, enabled: !host.enabled })

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
        await loadHosts()
      }
    })
  }, [showSuccess, showError])

  const handleEdit = useCallback((host: RedirectionHost) => {
    navigate(`/hosts/redirection/${host.id}/edit`)
  }, [navigate])

  const handleView = useCallback((host: RedirectionHost) => {
    navigate(`/hosts/redirection/${host.id}/view`)
  }, [navigate])

  const handleAdd = useCallback(() => {
    setEditingHost(null)
    navigate('/hosts/redirection/new')
  }, [navigate])

  const handleDelete = useCallback((host: RedirectionHost) => {
    setHostToDelete(host)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!hostToDelete) return

    try {
      await redirectionHostsApi.delete(hostToDelete.id)
      showSuccess('redirection-host', 'deleted', hostToDelete.domain_names[0] || `#${hostToDelete.id}`, hostToDelete.id)
      await loadHosts()
      setDeleteDialogOpen(false)
      setHostToDelete(null)
    } catch (err: unknown) {
      showError('redirection-host', 'delete', err instanceof Error ? err.message : 'Unknown error', hostToDelete.domain_names[0], hostToDelete.id)
      logger.error('Failed to delete redirection host:', err)
    }
  }, [hostToDelete, showSuccess, showError, loadHosts])

  // Apply visibility filtering
  const visibleHosts = useFilteredData(optimisticHosts)

  const handleViewProxyHost = useCallback((proxyHost: ProxyHost, event: React.MouseEvent) => {
    event.stopPropagation()
    // Navigate to proxy host overview
    navigate(`/hosts/proxy/${proxyHost.id}/view/overview`)
  }, [navigate])

  // Column definitions for DataTable with responsive priorities
  const columns = useRedirectionHostColumns({
    proxyHostsByDomain,
    onToggleEnabled: handleToggleEnabled,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onViewProxyHost: handleViewProxyHost,
    navigate,
  })

  // Filter definitions and filter function
  const { filters, filterFunction } = useRedirectionHostFilters()

  // Bulk actions
  const bulkActions = useRedirectionHostBulkActions({ showSuccess, showError, loadHosts })

  // Group configuration for domain grouping
  const groupConfig = useDomainGroupConfig<RedirectionHost>()

  return (
    <Container maxWidth={false}>
      <title>Redirection Hosts - NPMDeck</title>
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
            icon={React.createElement(NAVIGATION_CONFIG.redirectionHosts.icon, { sx: { color: NAVIGATION_CONFIG.redirectionHosts.color } })}
            title={NAVIGATION_CONFIG.redirectionHosts.text}
            description="Configure permanent redirects from one domain to another"
          />
          {!isMobileTable && (
            <PermissionButton
              resource="redirection_hosts"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add Redirection Host
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
              resource="redirection_hosts"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              fullWidth
              sx={{ maxWidth: 400 }}
            >
              Add Redirection Host
            </PermissionButton>
          </Box>
        )}
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
        titleIcon={React.createElement(NAVIGATION_CONFIG.redirectionHosts.icon, { sx: { color: NAVIGATION_CONFIG.redirectionHosts.color } })}
        message={`Are you sure you want to delete the redirection host for ${hostToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
}
