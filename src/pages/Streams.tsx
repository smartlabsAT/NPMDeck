import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
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
  Visibility as ViewIcon,
  Power as PowerIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  Sync as ProtocolIcon,
  PlayArrow as IncomingIcon,
  TrendingFlat as ForwardIcon,
  VpnKey as SslIcon,
  MoreVert as ActionsIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData } from '../hooks/useFilteredData'
import { useResponsive } from '../hooks/useResponsive'
import { Stream, streamsApi } from '../api/streams'
import { getErrorMessage } from '../types/common'
import StreamDrawer from '../components/features/streams/StreamDrawer'
import StreamDetailsDialog from '../components/StreamDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import { Filter, BulkAction } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'

export default function Streams() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  
  const { canManage: canManageStreams } = usePermissions()
  const { showSuccess, showError } = useToast()
  const { isMobileTable } = useResponsive()

  // State
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingStreams, setTogglingStreams] = useState<Set<number>>(new Set())
  
  // Dialogs
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [streamToDelete, setStreamToDelete] = useState<Stream | null>(null)

  // Load streams
  useEffect(() => {
    loadStreams()
  }, [])

  // Handle URL-based navigation
  useEffect(() => {
    if (location.pathname.includes('/new') && canManageStreams('streams')) {
      setSelectedStream(null)
      setDrawerOpen(true)
    } else if (location.pathname.includes('/edit') && id && canManageStreams('streams')) {
      const stream = streams.find(s => s.id === parseInt(id))
      if (stream) {
        setSelectedStream(stream)
        setDrawerOpen(true)
      }
    } else if (location.pathname.includes('/view') && id) {
      const stream = streams.find(s => s.id === parseInt(id))
      if (stream) {
        setSelectedStream(stream)
        setDetailsOpen(true)
      }
    }
  }, [location.pathname, id, streams, canManageStreams])

  const loadStreams = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await streamsApi.getAll(['owner', 'certificate'])
      setStreams(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStream = () => {
    navigate('/hosts/streams/new')
  }

  const handleEditStream = (stream: Stream) => {
    navigate(`/hosts/streams/${stream.id}/edit`)
  }

  const handleViewStream = (stream: Stream) => {
    navigate(`/hosts/streams/${stream.id}/view`)
  }

  const handleDeleteStream = async () => {
    if (!streamToDelete) return

    try {
      await streamsApi.delete(streamToDelete.id)
      const streamName = `${streamToDelete.incoming_port}/${streamToDelete.tcp_forwarding ? 'TCP' : ''}${streamToDelete.udp_forwarding ? 'UDP' : ''}`
      showSuccess('stream', 'deleted', streamName, streamToDelete.id)
      await loadStreams()
      setDeleteDialogOpen(false)
      setStreamToDelete(null)
    } catch (err: unknown) {
      const streamName = streamToDelete ? `${streamToDelete.incoming_port}/${streamToDelete.tcp_forwarding ? 'TCP' : ''}${streamToDelete.udp_forwarding ? 'UDP' : ''}` : undefined
      showError('stream', 'delete', err instanceof Error ? err.message : 'Unknown error', streamName, streamToDelete?.id)
      console.error('Failed to delete stream:', err)
    }
  }

  const handleToggleEnabled = async (stream: Stream) => {
    // Add stream ID to toggling set
    setTogglingStreams(prev => new Set(prev).add(stream.id))
    
    try {
      const streamName = `${stream.incoming_port}/${stream.tcp_forwarding ? 'TCP' : ''}${stream.udp_forwarding ? 'UDP' : ''}`
      
      if (stream.enabled) {
        await streamsApi.disable(stream.id)
        showSuccess('stream', 'disabled', streamName, stream.id)
      } else {
        await streamsApi.enable(stream.id)
        showSuccess('stream', 'enabled', streamName, stream.id)
      }
      await loadStreams()
    } catch (err: unknown) {
      const streamName = `${stream.incoming_port}/${stream.tcp_forwarding ? 'TCP' : ''}${stream.udp_forwarding ? 'UDP' : ''}`
      showError('stream', stream.enabled ? 'disable' : 'enable', err instanceof Error ? err.message : 'Unknown error', streamName, stream.id)
      setError(getErrorMessage(err))
    } finally {
      // Remove stream ID from toggling set
      setTogglingStreams(prev => {
        const newSet = new Set(prev)
        newSet.delete(stream.id)
        return newSet
      })
    }
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedStream(null)
    navigate('/hosts/streams')
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedStream(null)
    navigate('/hosts/streams')
  }

  // Apply visibility filtering
  const visibleStreams = useFilteredData(streams)

  const getStatusIcon = (stream: Stream) => {
    if (!stream.enabled) {
      return <Tooltip title="Disabled"><CancelIcon color="disabled" /></Tooltip>
    }
    if (stream.meta.nginx_online === false) {
      return <Tooltip title="Offline"><ErrorIcon color="error" /></Tooltip>
    }
    return <Tooltip title="Online"><CheckIcon color="success" /></Tooltip>
  }

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
  const columns: ResponsiveTableColumn<Stream>[] = [
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
        <Typography variant="body2" fontWeight="bold">
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
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="body2">
            {item.forwarding_host}:{item.forwarding_port}
          </Typography>
          <Tooltip title="Open in new tab">
            <IconButton
              size="small"
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
        <Box display="flex" gap={0.5}>
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
          <Typography variant="body2" color="text.secondary">
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
        <Box display="flex" gap={0.5} justifyContent="flex-end">
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleViewStream(item)
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          {togglingStreams.has(item.id) ? (
            <IconButton size="small" disabled>
              <CircularProgress size={18} />
            </IconButton>
          ) : (
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
          )}
          <PermissionIconButton
            resource="streams"
            permissionAction="edit"
            size="small"
            tooltipTitle="Edit"
            onClick={(e) => {
              e.stopPropagation()
              handleEditStream(item)
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
              setStreamToDelete(item)
              setDeleteDialogOpen(true)
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
  ]

  // Custom filter function for DataTable
  const filterFunction = (item: Stream, activeFilters: Record<string, any>) => {
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
  }

  // Bulk actions
  const bulkActions: BulkAction<Stream>[] = [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckIcon />,
      confirmMessage: 'Are you sure you want to enable the selected streams?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => !item.enabled).map(item => streamsApi.enable(item.id)))
          showSuccess('stream', 'enabled', `${items.length} streams`)
          await loadStreams()
        } catch (err) {
          showError('stream', 'enable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <CancelIcon />,
      confirmMessage: 'Are you sure you want to disable the selected streams?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => item.enabled).map(item => streamsApi.disable(item.id)))
          showSuccess('stream', 'disabled', `${items.length} streams`)
          await loadStreams()
        } catch (err) {
          showError('stream', 'disable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: 'Are you sure you want to delete the selected streams?',
      action: async (items) => {
        try {
          await Promise.all(items.map(item => streamsApi.delete(item.id)))
          showSuccess('stream', 'deleted', `${items.length} streams`)
          await loadStreams()
        } catch (err) {
          showError('stream', 'delete', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  ]

  return (
    <Container maxWidth={false}>
      <Box py={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
              onClick={handleCreateStream}
            >
              Add Stream
            </PermissionButton>
          )}
        </Box>

        {/* DataTable */}
        <DataTable
          data={visibleStreams}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          onRowClick={handleViewStream}
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
          <Box mt={2} display="flex" justifyContent="center">
            <PermissionButton
              resource="streams"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateStream}
              fullWidth
              sx={{ maxWidth: 400 }}
            >
              Add Stream
            </PermissionButton>
          </Box>
        )}
      </Box>

      {/* Drawer for create/edit */}
      {canManageStreams('streams') && (
        <StreamDrawer
          open={drawerOpen}
          onClose={handleCloseDrawer}
          stream={selectedStream}
          onSave={() => {
            handleCloseDrawer()
            loadStreams()
          }}
        />
      )}

      {/* Details dialog */}
      <StreamDetailsDialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        stream={selectedStream}
        onEdit={canManageStreams('streams') ? handleEditStream : undefined}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setStreamToDelete(null)
        }}
        onConfirm={handleDeleteStream}
        title="Delete Stream"
        titleIcon={React.createElement(NAVIGATION_CONFIG.streams.icon, { sx: { color: NAVIGATION_CONFIG.streams.color } })}
        message={`Are you sure you want to delete the stream on port ${streamToDelete?.incoming_port}?`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  )
}