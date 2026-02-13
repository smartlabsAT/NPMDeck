import { getErrorMessage } from '../types/common'
import React, { useState, useEffect, useOptimistic, startTransition, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
} from '@mui/material'
import {
  Add as AddIcon,
} from '@mui/icons-material'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData } from '../hooks/useFilteredData'
import { useResponsive } from '../hooks/useResponsive'
import useProxyHostColumns from '../hooks/useProxyHostColumns'
import useProxyHostFilters from '../hooks/useProxyHostFilters'
import useProxyHostBulkActions from '../hooks/useProxyHostBulkActions'
import useDomainGroupConfig from '../hooks/useDomainGroupConfig'
import ProxyHostDrawer from '../components/features/proxy-hosts/ProxyHostDrawer'
import ProxyHostDetailsDialog from '../components/ProxyHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import logger from '../utils/logger'

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
        logger.error(`Proxy host with id ${id} not found`)
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

  const handleToggleEnabled = useCallback((host: ProxyHost) => {
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
  }, [showSuccess, showError])

  const handleEdit = useCallback((host: ProxyHost) => {
    navigate(`/hosts/proxy/${host.id}/edit`)
  }, [navigate])

  const handleView = useCallback((host: ProxyHost) => {
    navigate(`/hosts/proxy/${host.id}/view`)
  }, [navigate])

  const handleAdd = useCallback(() => {
    setEditingHost(null)
    navigate('/hosts/proxy/new')
  }, [navigate])

  const handleDelete = useCallback((host: ProxyHost) => {
    setHostToDelete(host)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!hostToDelete) return

    try {
      await proxyHostsApi.delete(hostToDelete.id)
      showSuccess('proxy-host', 'deleted', hostToDelete.domain_names[0] || `#${hostToDelete.id}`, hostToDelete.id)
      await loadHosts()
      setDeleteDialogOpen(false)
      setHostToDelete(null)
    } catch (err: unknown) {
      showError('proxy-host', 'delete', err instanceof Error ? err.message : 'Unknown error', hostToDelete.domain_names[0], hostToDelete.id)
      logger.error('Failed to delete host:', err)
    }
  }, [hostToDelete, showSuccess, showError, loadHosts])


  // Apply visibility filtering
  const visibleHosts = useFilteredData(optimisticHosts)

  // Column definitions for DataTable with responsive priorities
  const columns = useProxyHostColumns({
    redirectionsByTarget,
    onToggleEnabled: handleToggleEnabled,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onViewConnections: (host) => {
      setViewingHost(host)
      setDetailsDialogOpen(true)
      navigate(`/hosts/proxy/${host.id}/view/connections`)
    },
    onViewAccess: (host) => {
      setViewingHost(host)
      setDetailsDialogOpen(true)
      navigate(`/hosts/proxy/${host.id}/view/access`)
    },
    navigate,
  })

  // Filter definitions and filter function
  const { filters, filterFunction } = useProxyHostFilters()

  // Bulk actions
  const bulkActions = useProxyHostBulkActions({ showSuccess, showError, loadHosts })

  // Group configuration for domain grouping
  const groupConfig = useDomainGroupConfig<ProxyHost>()

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