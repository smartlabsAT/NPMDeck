import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  
  Stream as StreamIcon,
  Power as PowerIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  
} from '@mui/icons-material'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData, useFilteredInfo } from '../hooks/useFilteredData'
import { Stream, streamsApi } from '../api/streams'
import { getErrorMessage } from '../types/common'
import StreamDrawer from '../components/features/streams/StreamDrawer'
import StreamDetailsDialog from '../components/StreamDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import ExportDialog from '../components/ExportDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'

type OrderDirection = 'asc' | 'desc'
type OrderBy = 'incoming_port' | 'forwarding_host' | 'status' | 'protocols' | 'created_on'

export default function Streams() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  
  const { canManage: canManageStreams } = usePermissions()
  const { showSuccess, showError } = useToast()

  // State
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState<OrderBy>('incoming_port')
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('asc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [togglingStreams, setTogglingStreams] = useState<Set<number>>(new Set())
  
  // Dialogs
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [streamToDelete, setStreamToDelete] = useState<Stream | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

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


  // Sorting and filtering
  const handleSort = (property: OrderBy) => {
    const isAsc = orderBy === property && orderDirection === 'asc'
    setOrderDirection(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  // Apply visibility filtering
  const visibleStreams = useFilteredData(streams)
  const filterInfo = useFilteredInfo(streams, visibleStreams)

  const filteredAndSortedStreams = useMemo(() => {
    let filtered = visibleStreams

    // Apply search filter
    if (searchTerm) {
      filtered = visibleStreams.filter(stream => 
        stream.incoming_port.toString().includes(searchTerm) ||
        stream.forwarding_host.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.forwarding_port.toString().includes(searchTerm)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: unknown
      let bValue: unknown

      switch (orderBy) {
        case 'incoming_port':
          aValue = a.incoming_port
          bValue = b.incoming_port
          break
        case 'forwarding_host':
          aValue = `${a.forwarding_host}:${a.forwarding_port}`
          bValue = `${b.forwarding_host}:${b.forwarding_port}`
          break
        case 'status':
          aValue = !a.enabled ? 0 : (a.meta.nginx_online === false ? 1 : 2)
          bValue = !b.enabled ? 0 : (b.meta.nginx_online === false ? 1 : 2)
          break
        case 'protocols':
          aValue = (a.tcp_forwarding ? 2 : 0) + (a.udp_forwarding ? 1 : 0)
          bValue = (b.tcp_forwarding ? 2 : 0) + (b.udp_forwarding ? 1 : 0)
          break
        case 'created_on':
          aValue = new Date(a.created_on).getTime()
          bValue = new Date(b.created_on).getTime()
          break
        default:
          return 0
      }

      if (orderDirection === 'asc') {
        return (aValue as any) < (bValue as any) ? -1 : (aValue as any) > (bValue as any) ? 1 : 0
      } else {
        return (aValue as any) > (bValue as any) ? -1 : (aValue as any) < (bValue as any) ? 1 : 0
      }
    })

    return sorted
  }, [visibleStreams, searchTerm, orderBy, orderDirection])

  // Pagination
  const paginatedStreams = useMemo(() => {
    const start = page * rowsPerPage
    return filteredAndSortedStreams.slice(start, start + rowsPerPage)
  }, [filteredAndSortedStreams, page, rowsPerPage])

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

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth={false}>
      <Box py={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <PageHeader
            icon={<StreamIcon sx={{ color: '#467fcf' }} />}
            title="Streams"
            description="Manage TCP/UDP port forwarding"
          />
          <PermissionButton
            resource="streams"
            permissionAction="create"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateStream}
          >
            Add Stream
          </PermissionButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {filterInfo.isFiltered && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing {filterInfo.visibleCount} of {filterInfo.totalCount} streams 
            (only your own entries are displayed)
          </Alert>
        )}

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by port or host..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? orderDirection : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'incoming_port'}
                    direction={orderBy === 'incoming_port' ? orderDirection : 'asc'}
                    onClick={() => handleSort('incoming_port')}
                  >
                    Incoming Port
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'forwarding_host'}
                    direction={orderBy === 'forwarding_host' ? orderDirection : 'asc'}
                    onClick={() => handleSort('forwarding_host')}
                  >
                    Destination
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'protocols'}
                    direction={orderBy === 'protocols' ? orderDirection : 'asc'}
                    onClick={() => handleSort('protocols')}
                  >
                    Protocols
                  </TableSortLabel>
                </TableCell>
                <TableCell>SSL</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'created_on'}
                    direction={orderBy === 'created_on' ? orderDirection : 'asc'}
                    onClick={() => handleSort('created_on')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedStreams.map((stream) => (
                <TableRow 
                  key={stream.id}
                  hover
                  onClick={() => handleViewStream(stream)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {getStatusIcon(stream)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {stream.incoming_port}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {stream.forwarding_host}:{stream.forwarding_port}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      {getProtocolChips(stream)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {stream.certificate_id ? (
                      <Tooltip title="SSL enabled">
                        <CheckIcon color="success" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(stream.created_on).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box display="flex" gap={0.5} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewStream(stream)
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {togglingStreams.has(stream.id) ? (
                        <IconButton
                          size="small"
                          disabled
                        >
                          <CircularProgress size={18} />
                        </IconButton>
                      ) : (
                        <PermissionIconButton
                          resource="streams"
                          permissionAction="edit"
                          size="small"
                          tooltipTitle={stream.enabled ? 'Disable' : 'Enable'}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleEnabled(stream)
                          }}
                          color={stream.enabled ? 'default' : 'success'}
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
                          handleEditStream(stream)
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
                          setStreamToDelete(stream)
                          setDeleteDialogOpen(true)
                        }}
                        color="error"
                      >
                        <DeleteIcon />
                      </PermissionIconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedStreams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchTerm ? 'No streams found matching your search' : 'No streams configured'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredAndSortedStreams.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
          />
        </TableContainer>
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
        message={`Are you sure you want to delete the stream on port ${streamToDelete?.incoming_port}?`}
        confirmText="Delete"
        confirmColor="error"
      />

      {/* Export dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        items={streams}
        type="stream"
        itemName="Streams"
      />
    </Container>
  )
}