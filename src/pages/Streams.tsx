import React, { useMemo, useCallback } from 'react'
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
  Visibility as ViewIcon,
  Power as PowerIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Sync as ProtocolIcon,
  PlayArrow as IncomingIcon,
  TrendingFlat as ForwardIcon,
  VpnKey as SslIcon,
  MoreVert as ActionsIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { useResponsive } from '../hooks/useResponsive'
import { useEntityCrud } from '../hooks/useEntityCrud'
import { Stream, streamsApi } from '../api/streams'
import StreamDrawer from '../components/features/streams/StreamDrawer'
import StreamDetailsDialog from '../components/StreamDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import { Filter, FilterValue } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { getStatusIcon } from '../utils/statusUtils'
import { createStandardBulkActions } from '../utils/bulkActionFactory'

/** Build a display name for a stream (e.g. "8080/TCP" or "53/TCPUDP"). */
const getStreamDisplayName = (stream: Stream): string =>
  `${stream.incoming_port}/${stream.tcp_forwarding ? 'TCP' : ''}${stream.udp_forwarding ? 'UDP' : ''}`

export default function Streams() {
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
  } = useEntityCrud<Stream>({
    api: streamsApi,
    expand: ['owner', 'certificate'],
    basePath: '/hosts/streams',
    entityType: 'stream',
    resource: 'streams',
    getDisplayName: getStreamDisplayName,
    entityLabel: 'streams',
  })

  const getProtocolChips = (stream: Stream) => {
    const chips = []
    if (stream.tcp_forwarding) {
      chips.push(<Chip key="tcp" label="TCP" size="small" color="primary" />)
    }
    if (stream.udp_forwarding) {
      chips.push(<Chip key="udp" label="UDP" size="small" color="secondary" />)
    }
    return chips
  }

  // Column definitions for DataTable with responsive priorities
  const columns = useMemo<ResponsiveTableColumn<Stream>[]>(() => [
    {
      id: 'status',
      label: 'Status',
      accessor: (item) => !item.enabled ? 0 : (item.meta.nginx_online === false ? 1 : 2),
      sortable: true,
      align: 'center',
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (value, item) => getStatusIcon(item)
    },
    {
      id: 'incoming_port',
      label: 'Incoming Port',
      icon: <IncomingIcon fontSize="small" />,
      accessor: (item) => item.incoming_port,
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      mobileLabel: 'Port',
      render: (value, item) => (
        <Typography variant="body2" sx={{
          fontWeight: "bold"
        }}>
          {item.incoming_port}
        </Typography>
      )
    },
    {
      id: 'destination',
      label: 'Destination',
      icon: <ForwardIcon fontSize="small" />,
      accessor: (item) => `${item.forwarding_host}:${item.forwarding_port}`,
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      mobileLabel: '',
      render: (value, item) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5
          }}>
          <Typography variant="body2">
            {item.forwarding_host}:{item.forwarding_port}
          </Typography>
          <Tooltip title="Open in new tab">
            <IconButton
              size="small"
              aria-label="Open stream endpoint in new tab"
              onClick={(e) => {
                e.stopPropagation()
                // Determine the protocol - use http by default
                const protocol = item.certificate_id ? 'https' : 'http'
                const url = `${protocol}://${item.forwarding_host}:${item.forwarding_port}`
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
              sx={{ padding: 0.5 }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    },
    {
      id: 'protocols',
      label: 'Protocols',
      icon: <ProtocolIcon fontSize="small" />,
      accessor: (item) => (item.tcp_forwarding ? 2 : 0) + (item.udp_forwarding ? 1 : 0),
      sortable: true,
      priority: 'P2' as ColumnPriority, // Important - hidden on mobile
      showInCard: true,
      mobileLabel: '', // Empty string to hide label - TCP/UDP chips are self-explanatory
      render: (value, item) => (
        <Box
          sx={{
            display: "flex",
            gap: 0.5
          }}>
          {getProtocolChips(item)}
        </Box>
      )
    },
    {
      id: 'ssl',
      label: 'SSL',
      icon: <SslIcon fontSize="small" />,
      accessor: (item) => item.certificate_id || 0,
      sortable: true,
      align: 'center',
      priority: 'P3' as ColumnPriority, // Optional - hidden on tablet and mobile
      showInCard: true,
      render: (value, item) => (
        item.certificate_id ? (
          <Tooltip title="SSL enabled">
            <CheckIcon color="success" fontSize="small" />
          </Tooltip>
        ) : (
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            -
          </Typography>
        )
      )
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
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleView(item)
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <PermissionIconButton
            resource="streams"
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
            resource="streams"
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
            resource="streams"
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
  ], [handleView, handleToggleEnabled, handleEdit, handleDelete])

  // Filter definitions
  const filters = useMemo<Filter[]>(() => [
    {
      id: 'protocols',
      label: 'Protocols',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'tcp', label: 'TCP Only' },
        { value: 'udp', label: 'UDP Only' },
        { value: 'both', label: 'TCP & UDP' }
      ]
    },
    {
      id: 'ssl',
      label: 'SSL',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'enabled', label: 'SSL Enabled', icon: <CheckIcon fontSize="small" /> },
        { value: 'disabled', label: 'No SSL' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'enabled', label: 'Enabled', icon: <CheckIcon fontSize="small" /> },
        { value: 'disabled', label: 'Disabled', icon: <CancelIcon fontSize="small" /> }
      ]
    }
  ], [])

  // Custom filter function for DataTable
  const filterFunction = useCallback((item: Stream, activeFilters: Record<string, FilterValue>) => {
    // Protocol filter
    if (activeFilters.protocols && activeFilters.protocols !== 'all') {
      if (activeFilters.protocols === 'tcp') {
        // TCP only means TCP is enabled AND UDP is disabled
        if (!item.tcp_forwarding || item.udp_forwarding) return false
      }
      if (activeFilters.protocols === 'udp') {
        // UDP only means UDP is enabled AND TCP is disabled
        if (!item.udp_forwarding || item.tcp_forwarding) return false
      }
      if (activeFilters.protocols === 'both') {
        // Both means TCP AND UDP are enabled
        if (!item.tcp_forwarding || !item.udp_forwarding) return false
      }
    }

    // SSL filter
    if (activeFilters.ssl && activeFilters.ssl !== 'all') {
      if (activeFilters.ssl === 'enabled' && !item.certificate_id) return false
      if (activeFilters.ssl === 'disabled' && item.certificate_id) return false
    }

    // Status filter
    if (activeFilters.status && activeFilters.status !== 'all') {
      if (activeFilters.status === 'enabled' && !item.enabled) return false
      if (activeFilters.status === 'disabled' && item.enabled) return false
    }

    return true
  }, [])

  // Bulk actions via factory
  const bulkActions = useMemo(() => createStandardBulkActions<Stream>({
    api: streamsApi,
    entityType: 'stream',
    entityLabel: 'streams',
    showSuccess,
    showError,
    showWarning,
    loadItems,
  }), [showSuccess, showError, showWarning, loadItems])

  return (
    <Container maxWidth={false}>
      <title>Streams - NPMDeck</title>
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
            icon={React.createElement(NAVIGATION_CONFIG.streams.icon, { sx: { color: NAVIGATION_CONFIG.streams.color } })}
            title={NAVIGATION_CONFIG.streams.text}
            description="Manage TCP/UDP port forwarding"
          />
          {!isMobileTable && (
            <PermissionButton
              resource="streams"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add Stream
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
          searchPlaceholder="Search by port or host..."
          searchFields={['incoming_port', 'forwarding_host', 'forwarding_port']}
          loading={loading}
          error={error}
          emptyMessage="No streams configured"
          defaultSortField="incoming_port"
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
              resource="streams"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              fullWidth
              sx={{ maxWidth: 400 }}
            >
              Add Stream
            </PermissionButton>
          </Box>
        )}
      </Box>
      {/* Drawer for create/edit */}
      {canManage && (
        <StreamDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          stream={editingItem}
          onSave={() => {
            closeDrawer()
            loadItems()
          }}
        />
      )}
      {/* Details dialog */}
      <StreamDetailsDialog
        open={detailsDialogOpen}
        onClose={closeDetailsDialog}
        stream={viewingItem}
        onEdit={canManage ? handleEdit : undefined}
      />
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Stream"
        titleIcon={React.createElement(NAVIGATION_CONFIG.streams.icon, { sx: { color: NAVIGATION_CONFIG.streams.color } })}
        message={`Are you sure you want to delete the stream on port ${itemToDelete?.incoming_port}?`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
}