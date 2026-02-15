import React, { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
} from '@mui/material'
import {
  Add as AddIcon,
} from '@mui/icons-material'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import { useEntityCrud } from '../hooks/useEntityCrud'
import { createStandardBulkActions } from '../utils/bulkActionFactory'
import { useResponsive } from '../hooks/useResponsive'
import useRedirectionHostColumns from '../hooks/useRedirectionHostColumns'
import useRedirectionHostFilters from '../hooks/useRedirectionHostFilters'
import useDomainGroupConfig from '../hooks/useDomainGroupConfig'
import RedirectionHostDrawer from '../components/RedirectionHostDrawer'
import RedirectionHostDetailsDialog from '../components/RedirectionHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { LAYOUT } from '../constants/layout'
import { ROWS_PER_PAGE_OPTIONS } from '../constants/table'

/** Stable empty map reference to avoid re-creating on every render */
const EMPTY_MAP = new Map() as Map<string, ProxyHost>

/** Builds a domain-to-ProxyHost lookup map from proxy hosts data */
const buildProxyHostDomainMap = async (): Promise<Map<string, ProxyHost>> => {
  const proxyData = await proxyHostsApi.getAll()
  const domainMap = new Map<string, ProxyHost>()
  proxyData.forEach(host => {
    host.domain_names.forEach(domain => {
      domainMap.set(domain.toLowerCase(), host)
    })
  })
  return domainMap
}

export default function RedirectionHosts() {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()
  const { isMobileTable } = useResponsive()

  const {
    visibleItems,
    loading,
    error,
    additionalData: proxyHostsByDomain,
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
  } = useEntityCrud<RedirectionHost, Map<string, ProxyHost>>({
    api: redirectionHostsApi,
    expand: ['owner', 'certificate'],
    basePath: '/hosts/redirection',
    entityType: 'redirection-host',
    resource: 'redirection_hosts',
    getDisplayName: (host) => host.domain_names[0] || `#${host.id}`,
    entityLabel: 'redirection hosts',
    additionalLoader: { load: buildProxyHostDomainMap },
  })

  const handleViewProxyHost = useCallback((proxyHost: ProxyHost, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation()
    // Navigate to proxy host overview
    navigate(`/hosts/proxy/${proxyHost.id}/view/overview`)
  }, [navigate])

  // Column definitions for DataTable with responsive priorities
  const columns = useRedirectionHostColumns({
    proxyHostsByDomain: proxyHostsByDomain ?? EMPTY_MAP,
    onToggleEnabled: handleToggleEnabled,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onViewProxyHost: handleViewProxyHost,
    navigate,
  })

  // Filter definitions and filter function
  const { filters, filterFunction } = useRedirectionHostFilters()

  // Bulk actions via factory
  const bulkActions = useMemo(
    () => createStandardBulkActions<RedirectionHost>({
      api: redirectionHostsApi,
      entityType: 'redirection-host',
      entityLabel: 'redirection hosts',
      showSuccess,
      showError,
      showWarning,
      loadItems,
    }),
    [showSuccess, showError, showWarning, loadItems]
  )

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
          data={visibleItems}
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
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          groupConfig={groupConfig}
          showGroupToggle={true}
          responsive={true}
          cardBreakpoint={LAYOUT.CARD_BREAKPOINT}
          compactBreakpoint={LAYOUT.COMPACT_BREAKPOINT}
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
              sx={{ maxWidth: LAYOUT.MOBILE_BUTTON_MAX_WIDTH }}
            >
              Add Redirection Host
            </PermissionButton>
          </Box>
        )}
      </Box>
      {canManage && (
        <RedirectionHostDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          host={editingItem}
          onSave={() => {
            loadItems()
            navigate('/hosts/redirection')
          }}
        />
      )}
      <RedirectionHostDetailsDialog
        open={detailsDialogOpen}
        onClose={closeDetailsDialog}
        host={viewingItem}
        onEdit={canManage ? handleEdit : () => {}}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Redirection Host?"
        titleIcon={React.createElement(NAVIGATION_CONFIG.redirectionHosts.icon, { sx: { color: NAVIGATION_CONFIG.redirectionHosts.color } })}
        message={`Are you sure you want to delete the redirection host for ${itemToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
}
