import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectionIcon,
  Stream as StreamIcon,
  Block as DeadHostIcon,
  Security as AccessListIcon,
  VpnKey as CertificateIcon,
  Description as AuditIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as EnabledIcon,
  Cancel as DisabledIcon,
  Refresh as RenewedIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { auditLogApi, AuditLogEntry } from '../api/auditLog'
import PageHeader from '../components/PageHeader'

const AuditLog = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [metaDialogOpen, setMetaDialogOpen] = useState(false)
  
  // Sorting state
  const [orderBy, setOrderBy] = useState<keyof AuditLogEntry>('created_on')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  
  // Date filter state
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)

  const fetchAuditLogs = useCallback(async (query?: string, isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true)
      } else {
        setSearchLoading(true)
      }
      setError(null)
      const data = await auditLogApi.getAll({ 
        expand: ['user'],
        query: query || undefined
      })
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      if (isInitial) {
        setInitialLoading(false)
      } else {
        setSearchLoading(false)
      }
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchAuditLogs('', true)
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== '' || searchQuery === '') {
      fetchAuditLogs(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, fetchAuditLogs])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    // Form submission immediately triggers search without debounce
    fetchAuditLogs(searchQuery)
  }

  const handleViewMeta = (entry: AuditLogEntry) => {
    setSelectedEntry(entry)
    setMetaDialogOpen(true)
  }

  const handleCloseMetaDialog = () => {
    setMetaDialogOpen(false)
    setSelectedEntry(null)
  }

  const handleRequestSort = (property: keyof AuditLogEntry) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  // Client-side sorting and filtering
  const processedLogs = useMemo(() => {
    let filteredLogs = [...logs]

    // Apply date filter
    if (dateFrom || dateTo) {
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.created_on)
        if (dateFrom && logDate < dateFrom) return false
        if (dateTo) {
          // Set time to end of day for dateTo
          const endOfDay = new Date(dateTo)
          endOfDay.setHours(23, 59, 59, 999)
          if (logDate > endOfDay) return false
        }
        return true
      })
    }

    // Apply sorting
    filteredLogs.sort((a, b) => {
      let aValue: any = a[orderBy]
      let bValue: any = b[orderBy]

      // Special handling for nested properties
      if (orderBy === 'user') {
        aValue = a.user.name.toLowerCase()
        bValue = b.user.name.toLowerCase()
      } else if (orderBy === 'object_type') {
        aValue = a.object_type.toLowerCase()
        bValue = b.object_type.toLowerCase()
      } else if (orderBy === 'action') {
        aValue = a.action.toLowerCase()
        bValue = b.action.toLowerCase()
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1
      }
      return 0
    })

    return filteredLogs
  }, [logs, dateFrom, dateTo, orderBy, order])

  const getObjectIcon = (objectType: string) => {
    switch (objectType) {
      case 'proxy-host':
        return <ProxyIcon fontSize="small" sx={{ color: '#5eba00' }} />
      case 'redirection-host':
        return <RedirectionIcon fontSize="small" sx={{ color: '#f1c40f' }} />
      case 'stream':
      case 'stream-host':
        return <StreamIcon fontSize="small" sx={{ color: '#467fcf' }} />
      case 'dead-host':
        return <DeadHostIcon fontSize="small" sx={{ color: '#cd201f' }} />
      case 'access-list':
        return <AccessListIcon fontSize="small" sx={{ color: '#2bcbba' }} />
      case 'user':
        return <PersonIcon fontSize="small" />
      case 'certificate':
        return <CertificateIcon fontSize="small" sx={{ color: '#467fcf' }} />
      default:
        return null
    }
  }

  const getObjectColor = (objectType: string) => {
    switch (objectType) {
      case 'proxy-host':
        return '#5eba00'
      case 'redirection-host':
        return '#f1c40f'
      case 'stream':
      case 'stream-host':
        return '#467fcf'
      case 'dead-host':
        return '#cd201f'
      case 'access-list':
        return '#2bcbba'
      case 'user':
        return 'primary'
      case 'certificate':
        return '#467fcf'
      default:
        return 'default'
    }
  }

  const getActionColor = (action: string): 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default' => {
    switch (action) {
      case 'created':
        return 'success'
      case 'updated':
        return 'info'
      case 'deleted':
        return 'error'
      case 'enabled':
        return 'success'
      case 'disabled':
        return 'warning'
      case 'renewed':
        return 'info'
      default:
        return 'default'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <AddIcon fontSize="small" />
      case 'updated':
        return <EditIcon fontSize="small" />
      case 'deleted':
        return <DeleteIcon fontSize="small" />
      case 'enabled':
        return <EnabledIcon fontSize="small" />
      case 'disabled':
        return <DisabledIcon fontSize="small" />
      case 'renewed':
        return <RenewedIcon fontSize="small" />
      default:
        return null
    }
  }

  const getObjectLink = (entry: AuditLogEntry): string => {
    switch (entry.object_type) {
      case 'proxy-host':
        return `/hosts/proxy/${entry.object_id}/view`
      case 'redirection-host':
        return `/hosts/redirection/${entry.object_id}/view`
      case 'dead-host':
        return `/hosts/404/${entry.object_id}/view`
      case 'stream':
      case 'stream-host':
        return `/hosts/streams/${entry.object_id}/view`
      case 'access-list':
        return `/security/access-lists/${entry.object_id}/view`
      case 'certificate':
        return `/security/certificates/${entry.object_id}/view`
      case 'user':
        return `/users/${entry.object_id}`
      default:
        return '#'
    }
  }

  const handleChipClick = (entry: AuditLogEntry) => {
    const link = getObjectLink(entry)
    if (link !== '#') {
      navigate(link)
    }
  }

  const getObjectDisplayName = (entry: AuditLogEntry) => {
    const items: string[] = []
    
    switch (entry.object_type) {
      case 'proxy-host':
      case 'redirection-host':
      case 'dead-host':
        if (entry.meta.domain_names && entry.meta.domain_names.length > 0) {
          items.push(...entry.meta.domain_names)
        }
        break
      case 'stream':
      case 'stream-host':
        if (entry.meta.incoming_port) {
          items.push(`Port ${entry.meta.incoming_port}`)
        }
        break
      case 'access-list':
      case 'user':
        if (entry.meta.name) {
          items.push(entry.meta.name)
        }
        break
      case 'certificate':
        if (entry.meta.provider === 'letsencrypt' && entry.meta.domain_names) {
          items.push(...entry.meta.domain_names)
        } else if (entry.meta.nice_name) {
          items.push(entry.meta.nice_name)
        }
        break
    }
    
    if (items.length === 0) {
      return (
        <Chip 
          label={`#${entry.object_id || '?'}`}
          size="small" 
          sx={{ 
            mx: 0.5, 
            my: 0.25, 
            cursor: 'pointer',
            '& .MuiChip-label': {
              px: 1.5,
              py: 0.5
            }
          }}
          onClick={() => handleChipClick(entry)}
        />
      )
    }
    
    return items.map((item, index) => (
      <Chip 
        key={index} 
        label={item} 
        size="small" 
        sx={{ 
          mx: 0.5, 
          my: 0.25, 
          cursor: 'pointer',
          '& .MuiChip-label': {
            px: 1.5,
            py: 0.5
          }
        }}
        onClick={() => handleChipClick(entry)}
      />
    ))
  }

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={3}>
        <PageHeader
          icon={<AuditIcon sx={{ color: '#495c68' }} />}
          title="Audit Log"
          description="View all system activities and changes"
        />
      </Box>

      {error && (
        <Box mb={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <form onSubmit={handleSearch}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              size="medium"
              variant="outlined"
              placeholder="Search by user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
                sx: { height: 56 }
              }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={dateFrom}
                onChange={(newValue) => setDateFrom(newValue)}
                slotProps={{
                  textField: {
                    size: 'medium',
                    sx: { width: 180 }
                  },
                  field: {
                    clearable: true,
                    onClear: () => setDateFrom(null)
                  }
                }}
              />
              <DatePicker
                label="To Date"
                value={dateTo}
                onChange={(newValue) => setDateTo(newValue)}
                slotProps={{
                  textField: {
                    size: 'medium',
                    sx: { width: 180 }
                  },
                  field: {
                    clearable: true,
                    onClear: () => setDateTo(null)
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        </form>
      </Paper>

      {searchLoading && logs.length > 0 ? (
        <Paper sx={{ position: 'relative', overflow: 'hidden' }}>
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: 3,
              zIndex: 1
            }}
          >
            <CircularProgress 
              variant="indeterminate" 
              sx={{ 
                width: '100%',
                height: 3,
                '& .MuiCircularProgress-svg': {
                  height: 3
                }
              }} 
            />
          </Box>
          <TableContainer>
            <Table sx={{ opacity: 0.6 }}>
              <TableHead>
                <TableRow>
                  <TableCell width="60">User</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'user'}
                      direction={orderBy === 'user' ? order : 'asc'}
                      onClick={() => handleRequestSort('user')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell width="150">
                    <TableSortLabel
                      active={orderBy === 'object_type'}
                      direction={orderBy === 'object_type' ? order : 'asc'}
                      onClick={() => handleRequestSort('object_type')}
                    >
                      Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell width="120">
                    <TableSortLabel
                      active={orderBy === 'action'}
                      direction={orderBy === 'action' ? order : 'asc'}
                      onClick={() => handleRequestSort('action')}
                    >
                      Action
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'created_on'}
                      direction={orderBy === 'created_on' ? order : 'asc'}
                      onClick={() => handleRequestSort('created_on')}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell width="100" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedLogs.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Avatar
                        src={entry.user.avatar || '/images/default-avatar.jpg'}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          border: entry.user.is_disabled ? '2px solid red' : '2px solid green'
                        }}
                      >
                        {entry.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: entry.user.is_deleted ? 'line-through' : 'none'
                        }}
                      >
                        {entry.user.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getObjectIcon(entry.object_type)}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {entry.object_type.replace('-', ' ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box 
                          color={`${getActionColor(entry.action)}.main`}
                          display="flex"
                          alignItems="center"
                        >
                          {getActionIcon(entry.action)}
                        </Box>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {entry.action}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {getObjectDisplayName(entry)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(entry.created_on), 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(entry.created_on), 'h:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View metadata">
                        <IconButton
                          size="small"
                          onClick={() => handleViewMeta(entry)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : logs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No audit logs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? 'Try a different search term' : 'System activity will appear here'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="60">User</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'user'}
                    direction={orderBy === 'user' ? order : 'asc'}
                    onClick={() => handleRequestSort('user')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell width="150">
                  <TableSortLabel
                    active={orderBy === 'object_type'}
                    direction={orderBy === 'object_type' ? order : 'asc'}
                    onClick={() => handleRequestSort('object_type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell width="120">
                  <TableSortLabel
                    active={orderBy === 'action'}
                    direction={orderBy === 'action' ? order : 'asc'}
                    onClick={() => handleRequestSort('action')}
                  >
                    Action
                  </TableSortLabel>
                </TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'created_on'}
                    direction={orderBy === 'created_on' ? order : 'asc'}
                    onClick={() => handleRequestSort('created_on')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell width="100" align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processedLogs.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Avatar
                      src={entry.user.avatar || '/images/default-avatar.jpg'}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        border: entry.user.is_disabled ? '2px solid red' : '2px solid green'
                      }}
                    >
                      {entry.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: entry.user.is_deleted ? 'line-through' : 'none'
                      }}
                    >
                      {entry.user.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getObjectIcon(entry.object_type)}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {entry.object_type.replace('-', ' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        color={`${getActionColor(entry.action)}.main`}
                        display="flex"
                        alignItems="center"
                      >
                        {getActionIcon(entry.action)}
                      </Box>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {entry.action}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {getObjectDisplayName(entry)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(entry.created_on), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(entry.created_on), 'h:mm a')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View metadata">
                      <IconButton
                        size="small"
                        onClick={() => handleViewMeta(entry)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={metaDialogOpen}
        onClose={handleCloseMetaDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Log Metadata
        </DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Action Details
              </Typography>
              <Box mb={2}>
                <Typography variant="body2">
                  <strong>User:</strong> {selectedEntry.user.name} ({selectedEntry.user.email})
                </Typography>
                <Typography variant="body2">
                  <strong>Action:</strong> {selectedEntry.action}
                </Typography>
                <Typography variant="body2">
                  <strong>Object Type:</strong> {selectedEntry.object_type}
                </Typography>
                <Typography variant="body2">
                  <strong>Object ID:</strong> {selectedEntry.object_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {format(new Date(selectedEntry.created_on), 'PPpp')}
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Metadata
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto' }}>
                  {JSON.stringify(selectedEntry.meta, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMetaDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AuditLog