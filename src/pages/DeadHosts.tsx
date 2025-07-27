import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PowerSettingsNew as PowerIcon,
  Language as LanguageIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { deadHostsApi, DeadHost } from '../api/deadHosts'
import { useAuthStore } from '../stores/authStore'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData, useFilteredInfo } from '../hooks/useFilteredData'
import DeadHostDrawer from '../components/DeadHostDrawer'
import DeadHostDetailsDialog from '../components/DeadHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'

type Order = 'asc' | 'desc'
type OrderBy = 'status' | 'domain_names' | 'ssl' | 'created_on'

const DeadHosts = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [hosts, setHosts] = useState<DeadHost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<DeadHost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hostToDelete, setHostToDelete] = useState<DeadHost | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingHost, setViewingHost] = useState<DeadHost | null>(null)
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderBy>('domain_names')
  
  const { user, shouldFilterByUser } = useAuthStore()
  const { canView, canManage: canManageDeadHosts, isAdmin } = usePermissions()

  useEffect(() => {
    loadHosts()
  }, [])

  // Handle URL parameter for editing or viewing
  useEffect(() => {
    // Handle new host creation
    if (location.pathname.includes('/new') && canManageDeadHosts('dead_hosts')) {
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
        if (location.pathname.includes('/edit') && canManageDeadHosts('dead_hosts')) {
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
        console.error(`404 host with id ${id} not found`)
        navigate('/hosts/404')
      }
      // If hosts.length === 0, we'll wait for hosts to load
    } else {
      // No ID in URL, close dialogs
      setDrawerOpen(false)
      setEditingHost(null)
      setDetailsDialogOpen(false)
      setViewingHost(null)
    }
  }, [id, hosts, location.pathname, navigate, loading, canManageDeadHosts])

  const loadHosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await deadHostsApi.getAll(['owner', 'certificate'])
      setHosts(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load 404 hosts')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (host: DeadHost) => {
    try {
      if (host.enabled) {
        await deadHostsApi.disable(host.id)
      } else {
        await deadHostsApi.enable(host.id)
      }
      // Reload to get updated status
      await loadHosts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle host status')
    }
  }

  const handleEdit = (host: DeadHost) => {
    navigate(`/hosts/404/${host.id}/edit`)
  }

  const handleView = (host: DeadHost) => {
    navigate(`/hosts/404/${host.id}/view`)
  }

  const handleAdd = () => {
    setEditingHost(null)
    navigate('/hosts/404/new')
  }

  const handleDelete = (host: DeadHost) => {
    setHostToDelete(host)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!hostToDelete) return
    
    try {
      await deadHostsApi.delete(hostToDelete.id)
      await loadHosts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete 404 host')
    }
  }

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const getComparator = (order: Order, orderBy: OrderBy): (a: DeadHost, b: DeadHost) => number => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy)
  }

  const descendingComparator = (a: DeadHost, b: DeadHost, orderBy: OrderBy) => {
    let aValue: any
    let bValue: any

    switch (orderBy) {
      case 'status':
        aValue = !a.enabled ? 0 : (a.meta.nginx_online === false ? 1 : 2)
        bValue = !b.enabled ? 0 : (b.meta.nginx_online === false ? 1 : 2)
        break
      case 'domain_names':
        aValue = a.domain_names[0] || ''
        bValue = b.domain_names[0] || ''
        break
      case 'ssl':
        aValue = !a.certificate_id ? 0 : (a.ssl_forced ? 2 : 1)
        bValue = !b.certificate_id ? 0 : (b.ssl_forced ? 2 : 1)
        break
      case 'created_on':
        aValue = new Date(a.created_on).getTime()
        bValue = new Date(b.created_on).getTime()
        break
      default:
        return 0
    }

    if (bValue < aValue) return -1
    if (bValue > aValue) return 1
    return 0
  }

  // Apply visibility filtering first
  const visibleHosts = useFilteredData(hosts, 'dead_hosts')
  const filterInfo = useFilteredInfo(hosts, visibleHosts)
  
  // Then apply search filtering
  const filteredHosts = visibleHosts.filter(host => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return host.domain_names.some(domain => domain.toLowerCase().includes(query))
  })

  const sortedHosts = [...filteredHosts].sort(getComparator(order, orderBy))

  const getStatusIcon = (host: DeadHost) => {
    if (!host.enabled) {
      return <Tooltip title="Disabled"><CancelIcon color="disabled" /></Tooltip>
    }
    if (host.meta.nginx_online === false) {
      return <Tooltip title={host.meta.nginx_err || 'Offline'}><CancelIcon color="error" /></Tooltip>
    }
    return <Tooltip title="Online"><CheckCircleIcon color="success" /></Tooltip>
  }

  const getSSLIcon = (host: DeadHost) => {
    if (!host.certificate_id) {
      return <Tooltip title="No SSL"><LockOpenIcon color="disabled" /></Tooltip>
    }
    if (host.ssl_forced) {
      return <Tooltip title="SSL Forced"><LockIcon color="primary" /></Tooltip>
    }
    return <Tooltip title="SSL Optional"><LockIcon color="action" /></Tooltip>
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <PageHeader
          icon={<BlockIcon sx={{ color: '#cd201f' }} />}
          title="404 Hosts"
          description="Configure custom 404 error pages for unmatched domains"
        />
        <PermissionButton
          resource="dead_hosts"
          action="create"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add 404 Host
        </PermissionButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filterInfo.isFiltered && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing {filterInfo.visibleCount} of {filterInfo.totalCount} 404 hosts 
          (only your own entries are displayed)
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box p={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by domain name..."
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
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Status</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'domain_names'}
                  direction={orderBy === 'domain_names' ? order : 'asc'}
                  onClick={() => handleRequestSort('domain_names')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Domain Names</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">Response</Typography>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'ssl'}
                  direction={orderBy === 'ssl' ? order : 'asc'}
                  onClick={() => handleRequestSort('ssl')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">SSL</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'created_on'}
                  direction={orderBy === 'created_on' ? order : 'asc'}
                  onClick={() => handleRequestSort('created_on')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Created</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedHosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  {searchQuery ? 'No 404 hosts found matching your search.' : 'No 404 hosts configured yet.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedHosts.map((host) => (
                <TableRow 
                  key={host.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleView(host)}
                >
                  <TableCell>{getStatusIcon(host)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LanguageIcon fontSize="small" color="action" />
                      <Box>
                        {host.domain_names.map((domain, index) => (
                          <div key={index}>
                            <Typography 
                              variant="body2"
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { 
                                  textDecoration: 'underline',
                                  color: 'primary.main'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`https://${domain}`, '_blank')
                              }}
                            >
                              {domain}
                            </Typography>
                          </div>
                        ))}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <BlockIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        404 Not Found
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{getSSLIcon(host)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(host.created_on).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleView(host)
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <PermissionIconButton
                        resource="dead_hosts"
                        action="edit"
                        size="small"
                        tooltipTitle={host.enabled ? 'Disable' : 'Enable'}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleEnabled(host)
                        }}
                        color={host.enabled ? 'default' : 'success'}
                      >
                        <PowerIcon />
                      </PermissionIconButton>
                      <PermissionIconButton
                        resource="dead_hosts"
                        action="edit"
                        size="small"
                        tooltipTitle="Edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(host)
                        }}
                        color="primary"
                      >
                        <EditIcon />
                      </PermissionIconButton>
                      <PermissionIconButton
                        resource="dead_hosts"
                        action="delete"
                        size="small"
                        tooltipTitle="Delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(host)
                        }}
                        color="error"
                      >
                        <DeleteIcon />
                      </PermissionIconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {canManageDeadHosts('dead_hosts') && (
        <DeadHostDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            navigate('/hosts/404')
          }}
          host={editingHost}
          onSave={() => {
            loadHosts()
            navigate('/hosts/404')
          }}
        />
      )}

      <DeadHostDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          if (id) {
            navigate('/hosts/404')
          }
        }}
        host={viewingHost}
        onEdit={canManageDeadHosts('dead_hosts') ? handleEdit : undefined}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete 404 Host?"
        message={`Are you sure you want to delete the 404 host for ${hostToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  )
}

export default DeadHosts