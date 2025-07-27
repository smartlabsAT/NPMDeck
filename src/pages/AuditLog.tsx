import React, { useState, useEffect, useCallback } from 'react'
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
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  ElectricBolt as ProxyIcon,
  Shuffle as RedirectionIcon,
  Radio as StreamIcon,
  PowerOff as DeadHostIcon,
  Lock as AccessListIcon,
  Shield as CertificateIcon,
  Description as AuditIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { auditLogApi, AuditLogEntry } from '../api/auditLog'
import PageHeader from '../components/PageHeader'

const AuditLog = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [metaDialogOpen, setMetaDialogOpen] = useState(false)

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await auditLogApi.getAll({ 
        expand: ['user'],
        query: searchQuery || undefined
      })
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    fetchAuditLogs()
  }

  const handleViewMeta = (entry: AuditLogEntry) => {
    setSelectedEntry(entry)
    setMetaDialogOpen(true)
  }

  const handleCloseMetaDialog = () => {
    setMetaDialogOpen(false)
    setSelectedEntry(null)
  }

  const getObjectIcon = (objectType: string) => {
    switch (objectType) {
      case 'proxy-host':
        return <ProxyIcon fontSize="small" />
      case 'redirection-host':
        return <RedirectionIcon fontSize="small" />
      case 'stream':
        return <StreamIcon fontSize="small" />
      case 'dead-host':
        return <DeadHostIcon fontSize="small" />
      case 'access-list':
        return <AccessListIcon fontSize="small" />
      case 'user':
        return <PersonIcon fontSize="small" />
      case 'certificate':
        return <CertificateIcon fontSize="small" />
      default:
        return null
    }
  }

  const getObjectColor = (objectType: string) => {
    switch (objectType) {
      case 'proxy-host':
        return 'success'
      case 'redirection-host':
        return 'warning'
      case 'stream':
        return 'info'
      case 'dead-host':
        return 'error'
      case 'access-list':
      case 'user':
        return 'primary'
      case 'certificate':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getActionColor = (action: string) => {
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

  const getObjectLink = (entry: AuditLogEntry): string => {
    switch (entry.object_type) {
      case 'proxy-host':
        return `/hosts/proxy/${entry.object_id}/view`
      case 'redirection-host':
        return `/hosts/redirection/${entry.object_id}/view`
      case 'dead-host':
        return `/hosts/404/${entry.object_id}/view`
      case 'stream':
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
          sx={{ mx: 0.5, my: 0.25, cursor: 'pointer' }}
          onClick={() => handleChipClick(entry)}
        />
      )
    }
    
    return items.map((item, index) => (
      <Chip 
        key={index} 
        label={item} 
        size="small" 
        sx={{ mx: 0.5, my: 0.25, cursor: 'pointer' }}
        onClick={() => handleChipClick(entry)}
      />
    ))
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
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

      <Paper sx={{ mb: 2, p: 2 }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
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
            }}
          />
        </form>
      </Paper>

      {logs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No audit logs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            System activity will appear here
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="60">User</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Date</TableCell>
                <TableCell width="100" align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((entry) => (
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
                    <Box>
                      <Box display="flex" alignItems="center" flexWrap="wrap">
                        <Box 
                          color={`${getObjectColor(entry.object_type)}.main`}
                          display="flex"
                          alignItems="center"
                          mr={1}
                        >
                          {getObjectIcon(entry.object_type)}
                        </Box>
                        <Chip 
                          label={entry.action} 
                          size="small" 
                          color={getActionColor(entry.action) as any}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" component="span">
                          {entry.object_type.replace('-', ' ')}
                        </Typography>
                      </Box>
                      <Box mt={0.5} display="flex" flexWrap="wrap">
                        {getObjectDisplayName(entry)}
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        {format(new Date(entry.created_on), 'MMM d, yyyy h:mm a')}
                      </Typography>
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