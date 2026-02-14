import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  NetworkCheck as NetworkIcon,
  Settings as OptionsIcon,
  CalendarToday as CreatedIcon,
  MoreVert as ActionsIcon,
} from '@mui/icons-material'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData, useFilteredInfo } from '../hooks/useFilteredData'
import { useResponsive } from '../hooks/useResponsive'
import { AccessList, accessListsApi } from '../api/accessLists'
import { getErrorMessage } from '../types/common'
import AccessListDrawer from '../components/features/access-lists/AccessListDrawer'
import AccessListDetailsDialog from '../components/AccessListDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import ExportDialog from '../components/ExportDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import { Filter, BulkAction } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'

export default function AccessLists() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const { canManage: canManageAccessLists, isAdmin } = usePermissions()
  const { showSuccess, showError, showWarning } = useToast()
  const { isMobileTable } = useResponsive()

  // State
  const [accessLists, setAccessLists] = useState<AccessList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialogs
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAccessList, setSelectedAccessList] = useState<AccessList | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accessListToDelete, setAccessListToDelete] = useState<AccessList | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const loadAccessLists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await accessListsApi.getAll(['owner', 'items', 'clients'])
      setAccessLists(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Load access lists
  useEffect(() => {
    loadAccessLists()
  }, [loadAccessLists])

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
      showSuccess('access-list', 'deleted', accessListToDelete.name, accessListToDelete.id)
      await loadAccessLists()
      setDeleteDialogOpen(false)
      setAccessListToDelete(null)
    } catch (err: unknown) {
      showError('access-list', 'delete', err instanceof Error ? err.message : 'Unknown error', accessListToDelete.name, accessListToDelete.id)
      setError(getErrorMessage(err))
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

  // Apply visibility filtering
  const visibleAccessLists = useFilteredData(accessLists)
  const filterInfo = useFilteredInfo(accessLists, visibleAccessLists)

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

  // Column definitions for DataTable with responsive priorities
  const columns: ResponsiveTableColumn<AccessList>[] = [
    {
      id: 'name',
      label: 'Name',
      icon: <LockIcon fontSize="small" />,
      accessor: (item) => item.name,
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (value, _item) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1
          }}>
          <LockIcon fontSize="small" color="action" />
          <Typography variant="body2">{value as React.ReactNode}</Typography>
        </Box>
      )
    },
    {
      id: 'users',
      label: 'Authorization',
      icon: <PersonIcon fontSize="small" />,
      accessor: (item) => item.items?.length || 0,
      sortable: true,
      align: 'left',
      priority: 'P2' as ColumnPriority, // Important - hidden on mobile
      showInCard: true,
      render: (value, item) => getUsersChip(item) || (
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          No users
        </Typography>
      )
    },
    {
      id: 'rules',
      label: 'Access Rules',
      icon: <NetworkIcon fontSize="small" />,
      accessor: (item) => item.clients?.length || 0,
      sortable: true,
      align: 'left',
      priority: 'P2' as ColumnPriority, // Important - hidden on mobile
      showInCard: true,
      mobileLabel: '', // Empty string to hide label - rule chips are self-explanatory
      render: (value, item) => getRulesChip(item) || (
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          No rules
        </Typography>
      )
    },
    {
      id: 'options',
      label: 'Options',
      icon: <ActionsIcon fontSize="small" />,
      accessor: (item) => ({ satisfy_any: item.satisfy_any, pass_auth: item.pass_auth }),
      sortable: false,
      align: 'left',
      priority: 'P3' as ColumnPriority, // Optional - hidden on tablet and mobile
      showInCard: false,
      render: (value, item) => (
        <Box
          sx={{
            display: "flex",
            gap: 0.5
          }}>
          {item.satisfy_any && (
            <Chip label="Satisfy Any" size="small" color="primary" />
          )}
          {item.pass_auth && (
            <Chip label="Pass Auth" size="small" color="secondary" />
          )}
        </Box>
      )
    },
    {
      id: 'created_on',
      label: 'Created',
      icon: <CreatedIcon fontSize="small" />,
      accessor: (item) => new Date(item.created_on).getTime(),
      sortable: true,
      align: 'left',
      priority: 'P3' as ColumnPriority, // Optional - hidden on tablet and mobile
      showInCard: false,
      render: (value, item) => (
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          {new Date(item.created_on).toLocaleDateString()}
        </Typography>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <OptionsIcon fontSize="small" />,
      accessor: (item) => item.id,
      sortable: false,
      align: 'right',
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (value, item) => (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1
          }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleViewAccessList(item)
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <PermissionIconButton
            resource="access_lists"
            permissionAction="edit"
            size="small"
            tooltipTitle="Edit"
            onClick={(e) => {
              e.stopPropagation()
              handleEditAccessList(item)
            }}
          >
            <EditIcon />
          </PermissionIconButton>
          <PermissionIconButton
            resource="access_lists"
            permissionAction="delete"
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              setAccessListToDelete(item)
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
      id: 'hasUsers',
      label: 'Authorization',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'with-users', label: 'With Users' },
        { value: 'no-users', label: 'No Users' }
      ]
    },
    {
      id: 'hasRules',
      label: 'Access Rules',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'with-rules', label: 'With Rules' },
        { value: 'no-rules', label: 'No Rules' }
      ]
    }
  ]

  // Bulk actions
  const bulkActions: BulkAction<AccessList>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: 'Are you sure you want to delete the selected access lists?',
      action: async (items) => {
        const results = await Promise.allSettled(items.map(item => accessListsApi.delete(item.id)))
        const succeeded = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed === 0) {
          showSuccess('access-list', 'deleted', `${succeeded} access lists`)
        } else if (succeeded === 0) {
          showError('access-list', 'delete', `All ${failed} operations failed`)
        } else {
          showWarning(`${succeeded} access lists deleted successfully, ${failed} failed`, 'access-list')
        }
        await loadAccessLists()
      }
    }
  ]


  return (
    <Container maxWidth={false}>
      <title>Access Lists - NPMDeck</title>
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
            icon={React.createElement(NAVIGATION_CONFIG.accessLists.icon, { sx: { color: NAVIGATION_CONFIG.accessLists.color } })}
            title={NAVIGATION_CONFIG.accessLists.text}
            description="Control access to your services with authentication and IP restrictions"
          />
          {!isMobileTable && (
            <PermissionButton
              resource="access_lists"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateAccessList}
            >
              Add Access List
            </PermissionButton>
          )}
        </Box>

        {filterInfo.isFiltered && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing {filterInfo.visibleCount} of {filterInfo.totalCount} access lists 
            (only your own entries are displayed)
          </Alert>
        )}

        {/* DataTable */}
        <DataTable
          data={visibleAccessLists}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          onRowClick={handleViewAccessList}
          bulkActions={isAdmin ? bulkActions : []}
          filters={filters}
          searchPlaceholder="Search by name, username, or IP address..."
          loading={loading}
          error={error}
          emptyMessage="No access lists configured yet"
          defaultSortField="name"
          defaultSortDirection="asc"
          searchable={true}
          selectable={isAdmin}
          showPagination={true}
          defaultRowsPerPage={100}
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
              resource="access_lists"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateAccessList}
              fullWidth
              sx={{ maxWidth: 400 }}
            >
              Add Access List
            </PermissionButton>
          </Box>
        )}
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
        titleIcon={React.createElement(NAVIGATION_CONFIG.accessLists.icon, { sx: { color: NAVIGATION_CONFIG.accessLists.color } })}
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
  );
}