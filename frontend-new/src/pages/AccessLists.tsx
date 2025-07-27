import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
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
  Refresh as RefreshIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  NetworkCheck as NetworkIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData, useFilteredInfo } from '../hooks/useFilteredData'
import { AccessList, accessListsApi } from '../api/accessLists'
import AccessListDrawer from '../components/AccessListDrawer'
import AccessListDetailsDialog from '../components/AccessListDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import ExportDialog from '../components/ExportDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'

type OrderDirection = 'asc' | 'desc'
type OrderBy = 'name' | 'users' | 'rules' | 'created_on'

export default function AccessLists() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const { user, shouldFilterByUser } = useAuthStore()
  const { canView, canManage: canManageAccessLists, isAdmin } = usePermissions()

  // State
  const [accessLists, setAccessLists] = useState<AccessList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState<OrderBy>('name')
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('asc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Dialogs
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAccessList, setSelectedAccessList] = useState<AccessList | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accessListToDelete, setAccessListToDelete] = useState<AccessList | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Load access lists
  useEffect(() => {
    loadAccessLists()
  }, [])

  // Handle URL-based navigation
  useEffect(() => {
    if (location.pathname.includes('/new') && canManageAccessLists('access_lists')) {
      setSelectedAccessList(null)
      setDrawerOpen(true)
    } else if (location.pathname.includes('/edit') && id && canManageAccessLists('access_lists')) {
      const accessList = accessLists.find(al => al.id === parseInt(id))
      if (accessList) {
        setSelectedAccessList(accessList)
        setDrawerOpen(true)
      }
    } else if (location.pathname.includes('/view') && id) {
      const accessList = accessLists.find(al => al.id === parseInt(id))
      if (accessList) {
        setSelectedAccessList(accessList)
        setDetailsOpen(true)
      }
    }
  }, [location.pathname, id, accessLists, canManageAccessLists])

  const loadAccessLists = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await accessListsApi.getAll(['owner', 'items', 'clients'])
      setAccessLists(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load access lists')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccessList = () => {
    navigate('/security/access-lists/new')
  }

  const handleEditAccessList = (accessList: AccessList) => {
    navigate(`/security/access-lists/${accessList.id}/edit`)
  }

  const handleViewAccessList = (accessList: AccessList) => {
    navigate(`/security/access-lists/${accessList.id}/view`)
  }

  const handleDeleteAccessList = async () => {
    if (!accessListToDelete) return

    try {
      await accessListsApi.delete(accessListToDelete.id)
      await loadAccessLists()
      setDeleteDialogOpen(false)
      setAccessListToDelete(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete access list')
    }
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedAccessList(null)
    navigate('/security/access-lists')
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedAccessList(null)
    navigate('/security/access-lists')
  }

  const handleExportAll = () => {
    setExportDialogOpen(true)
  }

  // Sorting and filtering
  const handleSort = (property: OrderBy) => {
    const isAsc = orderBy === property && orderDirection === 'asc'
    setOrderDirection(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  // Apply visibility filtering
  const visibleAccessLists = useFilteredData(accessLists, 'access_lists')
  const filterInfo = useFilteredInfo(accessLists, visibleAccessLists)

  const filteredAndSortedAccessLists = useMemo(() => {
    let filtered = visibleAccessLists

    // Apply search filter
    if (searchTerm) {
      filtered = visibleAccessLists.filter(accessList => 
        accessList.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accessList.items?.some(item => item.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        accessList.clients?.some(client => client.address.includes(searchTerm))
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (orderBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'users':
          aValue = a.items?.length || 0
          bValue = b.items?.length || 0
          break
        case 'rules':
          aValue = a.clients?.length || 0
          bValue = b.clients?.length || 0
          break
        case 'created_on':
          aValue = new Date(a.created_on).getTime()
          bValue = new Date(b.created_on).getTime()
          break
        default:
          return 0
      }

      if (orderDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return sorted
  }, [visibleAccessLists, searchTerm, orderBy, orderDirection])

  // Pagination
  const paginatedAccessLists = useMemo(() => {
    const start = page * rowsPerPage
    const end = start + rowsPerPage
    return filteredAndSortedAccessLists.slice(start, end)
  }, [filteredAndSortedAccessLists, page, rowsPerPage])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getUsersChip = (accessList: AccessList) => {
    const count = accessList.items?.length || 0
    if (count === 0) return null
    return (
      <Chip
        icon={<PersonIcon />}
        label={`${count} user${count !== 1 ? 's' : ''}`}
        size="small"
        variant="outlined"
      />
    )
  }

  const getRulesChip = (accessList: AccessList) => {
    const count = accessList.clients?.length || 0
    if (count === 0) return null
    return (
      <Chip
        icon={<NetworkIcon />}
        label={`${count} rule${count !== 1 ? 's' : ''}`}
        size="small"
        variant="outlined"
      />
    )
  }

  if (loading && accessLists.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth={false}>
      <Box py={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <PageHeader
            icon={<SecurityIcon sx={{ color: '#2bcbba' }} />}
            title="Access Lists"
            description="Control access to your services with authentication and IP restrictions"
          />
          <PermissionButton
            resource="access_lists"
            action="create"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAccessList}
          >
            Add Access List
          </PermissionButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {filterInfo.isFiltered && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing {filterInfo.visibleCount} of {filterInfo.totalCount} access lists 
            (only your own entries are displayed)
          </Alert>
        )}

        {/* Search */}
        <Box mb={2}>
          <TextField
            fullWidth
            placeholder="Search by name, username, or IP address..."
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
        </Box>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? orderDirection : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'users'}
                    direction={orderBy === 'users' ? orderDirection : 'asc'}
                    onClick={() => handleSort('users')}
                  >
                    Authorization
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'rules'}
                    direction={orderBy === 'rules' ? orderDirection : 'asc'}
                    onClick={() => handleSort('rules')}
                  >
                    Access Rules
                  </TableSortLabel>
                </TableCell>
                <TableCell>Options</TableCell>
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
              {paginatedAccessLists.map((accessList) => (
                <TableRow
                  key={accessList.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewAccessList(accessList)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LockIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {accessList.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getUsersChip(accessList) || (
                      <Typography variant="body2" color="text.secondary">
                        No users
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {getRulesChip(accessList) || (
                      <Typography variant="body2" color="text.secondary">
                        No rules
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      {accessList.satisfy_any && (
                        <Chip label="Satisfy Any" size="small" color="primary" />
                      )}
                      {accessList.pass_auth && (
                        <Chip label="Pass Auth" size="small" color="secondary" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(accessList.created_on).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewAccessList(accessList)
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <PermissionIconButton
                        resource="access_lists"
                        action="edit"
                        size="small"
                        tooltipTitle="Edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditAccessList(accessList)
                        }}
                      >
                        <EditIcon />
                      </PermissionIconButton>
                      <PermissionIconButton
                        resource="access_lists"
                        action="delete"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          setAccessListToDelete(accessList)
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
              {paginatedAccessLists.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      {searchTerm ? 'No access lists found matching your search' : 'No access lists configured yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredAndSortedAccessLists.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Box>

      {/* Drawer for create/edit */}
      {canManageAccessLists('access_lists') && (
        <AccessListDrawer
          open={drawerOpen}
          onClose={handleCloseDrawer}
          accessList={selectedAccessList}
          onSave={() => {
            handleCloseDrawer()
            loadAccessLists()
          }}
        />
      )}

      {/* Details dialog */}
      <AccessListDetailsDialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        accessList={selectedAccessList}
        onEdit={canManageAccessLists('access_lists') ? handleEditAccessList : undefined}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setAccessListToDelete(null)
        }}
        onConfirm={handleDeleteAccessList}
        title="Delete Access List"
        message={`Are you sure you want to delete the access list "${accessListToDelete?.name}"?`}
        confirmText="Delete"
        confirmColor="error"
      />

      {/* Export dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        items={accessLists}
        type="access_list"
        itemName="Access Lists"
      />
    </Container>
  )
}
