import React, { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  Container,
} from '@mui/material'
import {
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  PersonOutline as UserIcon,
  Block as BlockIcon,
  Check as CheckIcon,
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
import { Filter } from '../components/DataTable/types'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { STORAGE_KEYS } from '../constants/storage'
import { LAYOUT } from '../constants/layout'
import { ROWS_PER_PAGE_OPTIONS } from '../constants/table'
import { useUserTableColumns } from './Users/useUserTableColumns'
import { useUserBulkActions } from './Users/useUserBulkActions'

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

  const handleBulkDelete = useCallback((selectedUsers: User[]) => {
    setUsersToDelete(selectedUsers)
    setDeleteDialogOpen(true)
  }, [])

  // Column definitions extracted into hook
  const columns = useUserTableColumns({
    currentUserId: currentUser?.id ?? null,
    onEdit: handleEdit,
    onDelete: handleDeleteUser,
    onLoginAs: handleLoginAs,
  })

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

  // Bulk action definitions extracted into hook
  const bulkActions = useUserBulkActions({
    currentUserId: currentUser?.id ?? null,
    onBulkEnable: handleBulkEnable,
    onBulkDisable: handleBulkDisable,
    onBulkDelete: handleBulkDelete,
  })

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
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          responsive={true}
          cardBreakpoint={LAYOUT.CARD_BREAKPOINT}
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
              sx={{ maxWidth: LAYOUT.MOBILE_BUTTON_MAX_WIDTH }}
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
