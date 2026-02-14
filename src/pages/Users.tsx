import React, { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Container,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  PersonOutline as UserIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Email as EmailIcon,
  Shield as ShieldIcon,
  ToggleOn as StatusIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { usersApi, User } from '../api/users'
import { useAuthStore } from '../stores/authStore'
import { useResponsive } from '../hooks/useResponsive'
import { useEntityCrud } from '../hooks/useEntityCrud'
import UserDrawer from '../components/users/UserDrawer'
import ConfirmDialog from '../components/ConfirmDialog'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import { Filter, BulkAction } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { STORAGE_KEYS } from '../constants/storage'
import { LAYOUT } from '../constants/layout'

const Users = () => {
  const { user: currentUser, pushCurrentToStack } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const { isMobileTable } = useResponsive()
  const isAdmin = currentUser?.roles?.includes('admin')

  // Standard CRUD via shared hook (drawerOnly: Users has no separate view/edit URL distinction)
  const {
    items: users,
    loading,
    error,
    drawerOpen,
    editingItem,
    handleEdit,
    handleAdd,
    closeDrawer,
    loadItems,
  } = useEntityCrud<User>({
    api: usersApi,
    expand: ['permissions'],
    basePath: '/users',
    entityType: 'user',
    getDisplayName: (user) => user.name || user.email,
    entityLabel: 'user',
    drawerOnly: true,
  })

  // User-specific state: bulk-capable delete workflow
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [usersToDelete, setUsersToDelete] = useState<User[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const handleDeleteUser = useCallback((user: User) => {
    setUsersToDelete([user])
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (usersToDelete.length === 0) return

    setBulkProcessing(true)
    let successCount = 0

    for (const user of usersToDelete) {
      try {
        await usersApi.delete(user.id)
        successCount++
      } catch (err: unknown) {
        showError('user', 'delete', err instanceof Error ? err.message : 'Unknown error', user.name || user.email, user.id)
      }
    }

    if (successCount > 0) {
      showSuccess('user', 'deleted', `${successCount} user${successCount > 1 ? 's' : ''}`)
      await loadItems()
    }

    setBulkProcessing(false)
    setDeleteDialogOpen(false)
    setUsersToDelete([])
  }, [usersToDelete, showError, showSuccess, loadItems])

  const handleBulkDisable = useCallback(async (selectedUsers: User[]) => {
    const eligibleUsers = selectedUsers.filter(u => !u.is_disabled && u.id !== currentUser?.id)
    if (eligibleUsers.length === 0) return

    let successCount = 0

    for (const user of eligibleUsers) {
      try {
        await usersApi.update(user.id, { is_disabled: true })
        successCount++
      } catch (err: unknown) {
        showError('user', 'disable', err instanceof Error ? err.message : 'Unknown error', user.name || user.email, user.id)
      }
    }

    if (successCount > 0) {
      showSuccess('user', 'disabled', `${successCount} user${successCount > 1 ? 's' : ''}`)
      await loadItems()
    }
  }, [currentUser?.id, showError, showSuccess, loadItems])

  const handleBulkEnable = useCallback(async (selectedUsers: User[]) => {
    const eligibleUsers = selectedUsers.filter(u => u.is_disabled && u.id !== currentUser?.id)
    if (eligibleUsers.length === 0) return

    let successCount = 0

    for (const user of eligibleUsers) {
      try {
        await usersApi.update(user.id, { is_disabled: false })
        successCount++
      } catch (err: unknown) {
        showError('user', 'enable', err instanceof Error ? err.message : 'Unknown error', user.name || user.email, user.id)
      }
    }

    if (successCount > 0) {
      showSuccess('user', 'enabled', `${successCount} user${successCount > 1 ? 's' : ''}`)
      await loadItems()
    }
  }, [currentUser?.id, showError, showSuccess, loadItems])

  const handleLoginAs = useCallback(async (user: User) => {
    if (currentUser?.id === user.id) return

    try {
      // Push current account to stack before switching
      pushCurrentToStack()

      const response = await usersApi.loginAs(user.id)
      // Store the new token and reload
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user))
      window.location.href = '/'
    } catch (err: unknown) {
      showError('user', 'login-as', err instanceof Error ? err.message : 'Unknown error', user.name || user.email, user.id)
    }
  }, [currentUser?.id, pushCurrentToStack, showError])

  const getRoleDisplay = (roles: string[]) => {
    if (!roles || roles.length === 0) {
      return 'User'
    }
    return roles.map(role =>
      role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1)
    ).join(', ')
  }

  // Table column definitions with responsive priorities
  const columns: ResponsiveTableColumn<User>[] = useMemo(() => [
    {
      id: 'avatar',
      label: '',
      width: 60,
      accessor: (user) => user.avatar,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_, user) => (
        <Box
          sx={{
            position: "relative",
            display: "inline-block"
          }}>
          <Avatar
            src={user.avatar || '/images/default-avatar.jpg'}
            alt={user.name}
          >
            <PersonIcon />
          </Avatar>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: user.is_disabled ? 'error.main' : 'success.main',
              border: "2px solid",
              borderColor: "background.paper"
            }} />
        </Box>
      ),
    },
    {
      id: 'name',
      label: 'User',
      icon: <PersonIcon />,
      accessor: (user) => user.name,
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_, user) => (
        <Box>
          <Typography variant="body2" sx={{
            fontWeight: "medium"
          }}>
            {user.name}
          </Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            {user.nickname || user.email}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      icon: <EmailIcon />,
      accessor: (user) => user.email,
      sortable: true,
      priority: 'P2' as ColumnPriority, // Important - hidden on mobile
      showInCard: true,
    },
    {
      id: 'roles',
      label: 'Role',
      icon: <ShieldIcon />,
      accessor: (user) => user.roles,
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible (important for permissions)
      showInCard: true,
      render: (value) => {
        const roles = value as string[]
        return (
          <Chip
            size="small"
            label={getRoleDisplay(roles)}
            color={roles.includes('admin') ? 'primary' : 'default'}
            icon={roles.includes('admin') ? <AdminIcon /> : <UserIcon />}
          />
        )
      },
    },
    {
      id: 'status',
      label: 'Status',
      icon: <StatusIcon />,
      accessor: (user) => user.is_disabled,
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_, user) => (
        <Chip
          size="small"
          label={user.is_disabled ? 'Disabled' : 'Active'}
          color={user.is_disabled ? 'error' : 'success'}
          icon={user.is_disabled ? <BlockIcon /> : <CheckIcon />}
        />
      ),
    },
    {
      id: 'created_on',
      label: 'Created',
      icon: <CalendarIcon />,
      accessor: (user) => user.created_on,
      sortable: true,
      priority: 'P3' as ColumnPriority, // Optional - hidden on tablet and mobile
      showInCard: false,
      render: (date) => new Date(date as string).toLocaleDateString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <SettingsIcon />,
      align: 'right',
      accessor: () => null,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_, user) => (
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            display: "flex",
            gap: 0.5,
            justifyContent: "flex-end"
          }}>
          <IconButton
            size="small"
            onClick={() => handleEdit(user)}
            title="Edit User"
          >
            <EditIcon />
          </IconButton>
          {currentUser?.id !== user.id && !user.is_disabled && (
            <IconButton
              size="small"
              onClick={() => handleLoginAs(user)}
              title="Sign in as User"
            >
              <LoginIcon />
            </IconButton>
          )}
          {currentUser?.id !== user.id && (
            <IconButton
              size="small"
              onClick={() => handleDeleteUser(user)}
              color="error"
              title="Delete User"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ),
    },
  ], [currentUser, handleEdit, handleLoginAs, handleDeleteUser])

  // Filter definitions
  const filters: Filter[] = useMemo(() => [
    {
      id: 'roles',
      label: 'Role',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'admin', label: 'Administrator', icon: <AdminIcon fontSize="small" /> },
        { value: 'user', label: 'User', icon: <UserIcon fontSize="small" /> },
      ],
    },
    {
      id: 'is_disabled',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'false', label: 'Active', icon: <CheckIcon fontSize="small" color="success" /> },
        { value: 'true', label: 'Disabled', icon: <BlockIcon fontSize="small" color="error" /> },
      ],
    },
  ], [])

  // Bulk action definitions
  const bulkActions: BulkAction<User>[] = useMemo(() => [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckIcon />,
      color: 'success',
      action: async (selectedUsers) => {
        await handleBulkEnable(selectedUsers)
      },
      disabled: (selectedUsers) => selectedUsers.every(u => !u.is_disabled || u.id === currentUser?.id),
      confirmMessage: 'Enable {count} users?',
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <BlockIcon />,
      color: 'warning',
      action: async (selectedUsers) => {
        await handleBulkDisable(selectedUsers)
      },
      disabled: (selectedUsers) => selectedUsers.every(u => u.is_disabled || u.id === currentUser?.id),
      confirmMessage: 'Disable {count} users?',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      action: async (selectedUsers) => {
        setUsersToDelete(selectedUsers.filter(u => u.id !== currentUser?.id))
        setDeleteDialogOpen(true)
      },
      disabled: (selectedUsers) => selectedUsers.every(u => u.id === currentUser?.id),
      confirmMessage: 'Delete {count} users? This action cannot be undone.',
    },
  ], [currentUser, handleBulkDisable, handleBulkEnable])

  return (
    <Container maxWidth={false}>
      <title>Users - NPMDeck</title>
      <Box sx={{
        py: 3
      }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
          <PageHeader
            icon={React.createElement(NAVIGATION_CONFIG.users.icon, { sx: { color: NAVIGATION_CONFIG.users.color } })}
            title={NAVIGATION_CONFIG.users.text}
            description="Manage user accounts and permissions"
          />
          {isAdmin && !isMobileTable && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add User
            </Button>
          )}
        </Box>

        <DataTable
          data={users}
          columns={columns}
          keyExtractor={(user) => user.id}
          onRowClick={handleEdit}
          bulkActions={isAdmin ? bulkActions : []}
          filters={filters}
          searchPlaceholder="Search by name, nickname, or email..."
          loading={loading}
          error={error}
          emptyMessage="No users configured yet."
          selectable={isAdmin}
          defaultSortField="name"
          defaultSortDirection="asc"
          defaultRowsPerPage={100}
          rowsPerPageOptions={[10, 25, 50, 100]}
          responsive={true}
          cardBreakpoint={900}
          compactBreakpoint={LAYOUT.COMPACT_BREAKPOINT}
        />

        {/* Mobile Add Button - shown at bottom */}
        {isAdmin && isMobileTable && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "center"
            }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              fullWidth
              sx={{ maxWidth: 400 }}
            >
              Add User
            </Button>
          </Box>
        )}

      <UserDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        user={editingItem}
        onSave={() => {
          loadItems()
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={usersToDelete.length === 1 ? "Delete User?" : `Delete ${usersToDelete.length} Users?`}
        titleIcon={React.createElement(NAVIGATION_CONFIG.users.icon, { sx: { color: NAVIGATION_CONFIG.users.color } })}
        message={
          usersToDelete.length === 1
            ? `Are you sure you want to delete ${usersToDelete[0]?.name}? This action cannot be undone.`
            : `Are you sure you want to delete ${usersToDelete.length} users? This action cannot be undone.`
        }
        confirmText="Delete"
        confirmColor="error"
        loading={bulkProcessing}
      />
      </Box>
    </Container>
  );
}

export default Users
