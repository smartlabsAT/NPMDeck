import React, { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
} from '@mui/material'
import {
  Add as AddIcon,
} from '@mui/icons-material'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { useResponsive } from '../hooks/useResponsive'
import { useEntityCrud } from '../hooks/useEntityCrud'
import useProxyHostColumns from '../hooks/useProxyHostColumns'
import useProxyHostFilters from '../hooks/useProxyHostFilters'
import useDomainGroupConfig from '../hooks/useDomainGroupConfig'
import { createStandardBulkActions } from '../utils/bulkActionFactory'
import ProxyHostDrawer from '../components/features/proxy-hosts/ProxyHostDrawer'
import ProxyHostDetailsDialog from '../components/ProxyHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { NAVIGATION_CONFIG } from '../constants/navigation'

/** Type for the redirection lookup map loaded as additional data */
type RedirectionsByTarget = Map<string, RedirectionHost[]>

const PROXY_HOST_BASE_PATH = '/hosts/proxy'
const PROXY_HOST_EXPAND = ['owner', 'access_list', 'certificate']
const PROXY_HOST_ENTITY_LABEL = 'proxy hosts'

/** Build a lookup map from target domain to redirection hosts */
const buildRedirectionTargetMap = async (): Promise<RedirectionsByTarget> => {
  const redirectionData = await redirectionHostsApi.getAll()
  const targetMap = new Map<string, RedirectionHost[]>()
  redirectionData.forEach(redirect => {
    const target = redirect.forward_domain_name.toLowerCase()
    if (!targetMap.has(target)) {
      targetMap.set(target, [])
    }
    targetMap.get(target)!.push(redirect)
  })
  return targetMap
}

export default function ProxyHosts() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { isMobileTable } = useResponsive()

  // Entity CRUD hook handles all state, URL routing, dialogs, and data loading
  const {
    visibleItems,
    loading,
    error,
    additionalData: redirectionsByTarget,
    drawerOpen,
    editingItem,
    deleteDialogOpen,
    itemToDelete,
    detailsDialogOpen,
    viewingItem,
    handleToggleEnabled,
    handleEdit,
    handleView,
    handleAdd,
    handleDelete,
    handleConfirmDelete,
    closeDrawer,
    closeDetailsDialog,
    closeDeleteDialog,
    loadItems,
    canManage,
  } = useEntityCrud<ProxyHost, RedirectionsByTarget>({
    api: proxyHostsApi,
    expand: PROXY_HOST_EXPAND,
    basePath: PROXY_HOST_BASE_PATH,
    entityType: 'proxy-host',
    resource: 'proxy_hosts',
    getDisplayName: (host) => host.domain_names[0] || `#${host.id}`,
    entityLabel: PROXY_HOST_ENTITY_LABEL,
    additionalLoader: {
      load: buildRedirectionTargetMap,
    },
  })

  // Navigate-only callbacks for viewing connections/access tabs
  // The hook's URL routing effect detects /view in the path and opens the details dialog
  const onViewConnections = useCallback((host: ProxyHost) => {
    navigate(`${PROXY_HOST_BASE_PATH}/${host.id}/view/connections`)
  }, [navigate])

  const onViewAccess = useCallback((host: ProxyHost) => {
    navigate(`${PROXY_HOST_BASE_PATH}/${host.id}/view/access`)
  }, [navigate])

  // Column definitions for DataTable with responsive priorities
  const columns = useProxyHostColumns({
    redirectionsByTarget: redirectionsByTarget ?? new Map(),
    onToggleEnabled: handleToggleEnabled,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onViewConnections,
    onViewAccess,
    navigate,
  })

  // Filter definitions and filter function
  const { filters, filterFunction } = useProxyHostFilters()

  // Bulk actions via factory
  const bulkActions = useMemo(
    () => createStandardBulkActions<ProxyHost>({
      api: proxyHostsApi,
      entityType: 'proxy-host',
      entityLabel: PROXY_HOST_ENTITY_LABEL,
      showSuccess,
      showError,
      loadItems,
    }),
    [showSuccess, showError, loadItems]
  )

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
          data={visibleItems}
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
      {canManage && (
        <ProxyHostDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          host={editingItem}
          onSave={() => {
            loadItems()
            navigate(PROXY_HOST_BASE_PATH)
          }}
        />
      )}
      <ProxyHostDetailsDialog
        open={detailsDialogOpen}
        onClose={closeDetailsDialog}
        host={viewingItem}
        onEdit={canManage ? handleEdit : undefined}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Proxy Host?"
        titleIcon={React.createElement(NAVIGATION_CONFIG.proxyHosts.icon, { sx: { color: NAVIGATION_CONFIG.proxyHosts.color } })}
        message={`Are you sure you want to delete the proxy host for ${itemToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
}