import React, { useMemo, useCallback } from 'react'
import {
  Box,
  Container,
  Typography,
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
  MoreVert as ActionsIcon,
  Settings as ResponseIcon,
  ToggleOn as StatusIcon,
} from '@mui/icons-material'
import { deadHostsApi, DeadHost } from '../api/deadHosts'
import { useEntityCrud } from '../hooks/useEntityCrud'
import { useResponsive } from '../hooks/useResponsive'
import { useToast } from '../contexts/ToastContext'
import { createStandardBulkActions } from '../utils/bulkActionFactory'
import { DeadHostDrawer } from '../components/features'
import DeadHostDetailsDialog from '../components/DeadHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import { Filter, FilterValue } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { getStatusIcon } from '../utils/statusUtils'
import { renderSslStatus } from '../utils/columnRenderers'
import { filterBySsl, filterByStatus } from '../utils/filterUtils'
import { LAYOUT } from '../constants/layout'
import { ROWS_PER_PAGE_OPTIONS } from '../constants/table'

export default function DeadHosts() {
  const { showSuccess, showError, showWarning } = useToast()
  const { isMobileTable } = useResponsive()

  const {
    visibleItems,
    loading,
    error,
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
  } = useEntityCrud<DeadHost>({
    api: deadHostsApi,
    expand: ['owner', 'certificate'],
    basePath: '/hosts/404',
    entityType: 'dead-host',
    resource: 'dead_hosts',
    getDisplayName: (host) => host.domain_names[0] || `#${host.id}`,
    entityLabel: '404 hosts',
  })

  // Column definitions for DataTable with responsive priorities
  const columns = useMemo<ResponsiveTableColumn<DeadHost>[]>(() => [
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
              role="link"
              aria-label={`Open ${domain} in new tab`}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main'
                }
              }}
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://${domain}`, '_blank', 'noopener,noreferrer')
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
      render: (_value, item) => renderSslStatus(item)
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
  ], [handleToggleEnabled, handleEdit, handleDelete])

  // Filter definitions
  const filters = useMemo<Filter[]>(() => [
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
  ], [])

  // Custom filter function for DataTable
  const filterFunction = useCallback((item: DeadHost, activeFilters: Record<string, FilterValue>) => {
    if (!filterBySsl(item, activeFilters.ssl)) return false
    if (!filterByStatus(item, activeFilters.status)) return false
    return true
  }, [])

  // Bulk actions via factory
  const bulkActions = useMemo(() => createStandardBulkActions<DeadHost>({
    api: deadHostsApi,
    entityType: 'dead-host',
    entityLabel: '404 hosts',
    showSuccess,
    showError,
    showWarning,
    loadItems,
  }), [showSuccess, showError, showWarning, loadItems])

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
          data={visibleItems}
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
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
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
              resource="dead_hosts"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              fullWidth
              sx={{ maxWidth: LAYOUT.MOBILE_BUTTON_MAX_WIDTH }}
            >
              Add 404 Host
            </PermissionButton>
          </Box>
        )}
      </Box>
      {canManage && (
        <DeadHostDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          host={editingItem}
          onSave={() => {
            loadItems()
            closeDrawer()
          }}
        />
      )}
      <DeadHostDetailsDialog
        open={detailsDialogOpen}
        onClose={closeDetailsDialog}
        host={viewingItem}
        onEdit={canManage ? handleEdit : undefined}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete 404 Host?"
        titleIcon={React.createElement(NAVIGATION_CONFIG.deadHosts.icon, { sx: { color: NAVIGATION_CONFIG.deadHosts.color } })}
        message={`Are you sure you want to delete the 404 host for ${itemToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
}