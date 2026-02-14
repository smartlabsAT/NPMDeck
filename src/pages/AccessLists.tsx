import React, { useState } from 'react'
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
import { useFilteredInfo } from '../hooks/useFilteredData'
import { useResponsive } from '../hooks/useResponsive'
import { useEntityCrud } from '../hooks/useEntityCrud'
import { AccessList, accessListsApi } from '../api/accessLists'
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
import { LAYOUT } from '../constants/layout'

export default function AccessLists() {
  const { isAdmin } = usePermissions()
  const { showSuccess, showError, showWarning } = useToast()
  const { isMobileTable } = useResponsive()

  // Standard CRUD via shared hook
  const {
    items,
    visibleItems,
    loading,
    error,
    drawerOpen,
    editingItem,
    deleteDialogOpen,
    itemToDelete,
    detailsDialogOpen,
    viewingItem,
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
  } = useEntityCrud<AccessList>({
    api: accessListsApi,
    expand: ['owner', 'items', 'clients'],
    basePath: '/security/access-lists',
    entityType: 'access-list',
    resource: 'access_lists',
    getDisplayName: (item) => item.name,
    entityLabel: 'access list',
  })

  // AccessList-specific state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const filterInfo = useFilteredInfo(items, visibleItems)

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
                handleView(item)
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
              handleEdit(item)
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
              handleDelete(item)
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
      action: async (selectedItems) => {
        const results = await Promise.allSettled(selectedItems.map(item => accessListsApi.delete(item.id)))
        const succeeded = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed === 0) {
          showSuccess('access-list', 'deleted', `${succeeded} access lists`)
        } else if (succeeded === 0) {
          showError('access-list', 'delete', `All ${failed} operations failed`)
        } else {
          showWarning(`${succeeded} access lists deleted successfully, ${failed} failed`, 'access-list')
        }
        await loadItems()
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
              onClick={handleAdd}
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
          data={visibleItems}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          onRowClick={handleView}
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
              resource="access_lists"
              permissionAction="create"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              fullWidth
              sx={{ maxWidth: 400 }}
            >
              Add Access List
            </PermissionButton>
          </Box>
        )}
      </Box>
      {/* Drawer for create/edit */}
      {canManage && (
        <AccessListDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          accessList={editingItem}
          onSave={() => {
            closeDrawer()
            loadItems()
          }}
        />
      )}
      {/* Details dialog */}
      <AccessListDetailsDialog
        open={detailsDialogOpen}
        onClose={closeDetailsDialog}
        accessList={viewingItem}
        onEdit={canManage ? handleEdit : undefined}
      />
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Access List"
        titleIcon={React.createElement(NAVIGATION_CONFIG.accessLists.icon, { sx: { color: NAVIGATION_CONFIG.accessLists.color } })}
        message={`Are you sure you want to delete the access list "${itemToDelete?.name}"?`}
        confirmText="Delete"
        confirmColor="error"
      />
      {/* Export dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        items={items}
        type="access_list"
        itemName="Access Lists"
      />
    </Container>
  );
}
