import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  IconButton,
  Typography,
  Avatar,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  PersonOutline as UserIcon,
  Block as BlockIcon,
  Check as CheckIcon,
} from '@mui/icons-material'
import { usersApi, User } from '../api/users'
import { getErrorMessage } from '../types/common'
import { useAuthStore } from '../stores/authStore'
import UserDrawer from '../components/UserDrawer'
import ConfirmDialog from '../components/ConfirmDialog'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable, TableColumn, Filter, BulkAction } from '../components/DataTable'

const Users = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [usersToDelete, setUsersToDelete] = useState<User[]>([])
  const [bulkDisableDialogOpen, setBulkDisableDialogOpen] = useState(false)
  const [usersToBulkProcess, setUsersToBulkProcess] = useState<User[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)
  
  const { user: currentUser, pushCurrentToStack } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const isAdmin = currentUser?.roles?.includes('admin')

  useEffect(() => {
    loadUsers()
  }, [])

  // Handle URL parameter for viewing/editing
  useEffect(() => {
    if (id && id !== 'new') {
      const user = users.find(u => u.id === parseInt(id))
      if (user) {
        setSelectedUser(user)
        setDrawerOpen(true)
      }
    } else if (id === 'new') {
      setSelectedUser(null)
      setDrawerOpen(true)
    } else {
      setDrawerOpen(false)
      setSelectedUser(null)
    }
  }, [id, users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await usersApi.getAll(['permissions'])
      setUsers(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Format relative time for last login
  const formatRelativeTime = (date: string | null | undefined) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const then = new Date(date)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    
    return then.toLocaleDateString()
  }

  const handleRowClick = (user: User) => {
    setSelectedUser(user)
    setDrawerOpen(true)
    navigate(`/users/${user.id}`)
  }

  const handleEdit = (user: User) => {
    handleRowClick(user)
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setDrawerOpen(true)
    navigate('/users/new')
  }

  const handleDelete = (user: User) => {
    setUsersToDelete([user])
    setDeleteDialogOpen(true)
    setDrawerOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (usersToDelete.length === 0) return
    
    setBulkProcessing(true)
    let successCount = 0
    let failCount = 0
    
    for (const user of usersToDelete) {
      try {
        await usersApi.delete(user.id)
        successCount++
      } catch (err: unknown) {
        failCount++
        showError('user', 'delete', err instanceof Error ? err.message : 'Unknown error', user.name || user.email, user.id)
      }
    }
    
    if (successCount > 0) {
      showSuccess('user', 'deleted', `${successCount} user${successCount > 1 ? 's' : ''}`)
      await loadUsers()
    }
    
    setBulkProcessing(false)
    setDeleteDialogOpen(false)
    setUsersToDelete([])
  }

  const handleBulkDisable = async () => {
    if (usersToBulkProcess.length === 0) return
    
    setBulkProcessing(true)
    let successCount = 0
    let failCount = 0
    
    for (const user of usersToBulkProcess) {
      try {
        await usersApi.update(user.id, { ...user, is_disabled: true })
        successCount++
      } catch (err: unknown) {
        failCount++
        showError('user', 'disable', err instanceof Error ? err.message : 'Unknown error', user.name || user.email, user.id)
      }
    }
    
    if (successCount > 0) {
      showSuccess('user', 'disabled', `${successCount} user${successCount > 1 ? 's' : ''}`)
      await loadUsers()
    }
    
    setBulkProcessing(false)
    setBulkDisableDialogOpen(false)
    setUsersToBulkProcess([])
  }


  const handleLoginAs = async (user: User) => {
    if (currentUser?.id === user.id) return
    
    try {
      // Push current account to stack before switching
      pushCurrentToStack()
      
      const response = await usersApi.loginAs(user.id)
      // Store the new token and reload
      localStorage.setItem('npm_token', response.token)
      localStorage.setItem('npm_user', JSON.stringify(response.user))
      window.location.href = '/'
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    }
  }

  const getRoleDisplay = (roles: string[]) => {
    return roles.map(role => 
      role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1)
    ).join(', ')
  }

  // Table column definitions
  const columns: TableColumn<User>[] = useMemo(() => [
    {
      id: 'avatar',
      label: '',
      width: 60,
      accessor: (user) => user.avatar,
      render: (_, user) => (
        <Box position="relative" display="inline-block">
          <Avatar
            src={user.avatar || '/images/default-avatar.jpg'}
            alt={user.name}
          >
            <PersonIcon />
          </Avatar>
          <Box
            position="absolute"
            bottom={0}
            right={0}
            width={12}
            height={12}
            borderRadius="50%"
            bgcolor={user.is_disabled ? 'error.main' : 'success.main'}
            border="2px solid"
            borderColor="background.paper"
          />
        </Box>
      ),
    },
    {
      id: 'name',
      label: 'User',
      accessor: (user) => user.name,
      sortable: true,
      render: (_, user) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.nickname || user.email}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      accessor: (user) => user.email,
      sortable: true,
    },
    {
      id: 'roles',
      label: 'Role',
      accessor: (user) => user.roles,
      sortable: true,
      render: (roles) => (
        <Chip
          size="small"
          label={getRoleDisplay(roles)}
          color={roles.includes('admin') ? 'primary' : 'default'}
          icon={roles.includes('admin') ? <AdminIcon /> : <UserIcon />}
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (user) => user.is_disabled,
      sortable: true,
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
      accessor: (user) => user.created_on,
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    // TODO: Enable when last_login is available in API
    // {
    //   id: 'last_login',
    //   label: 'Last Login',
    //   accessor: (user) => user.last_login,
    //   sortable: true,
    //   render: (date) => formatRelativeTime(date),
    // },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      accessor: () => null,
      render: (_, user) => (
        <Box display="flex" gap={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
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
              onClick={() => handleDelete(user)}
              color="error"
              title="Delete User"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ),
    },
  ], [currentUser])

  // Filter definitions
  const filters: Filter[] = useMemo(() => [
    {
      id: 'roles',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'admin', label: 'Administrator', icon: <AdminIcon fontSize="small" /> },
        { value: 'user', label: 'User', icon: <UserIcon fontSize="small" /> },
      ],
    },
    {
      id: 'is_disabled',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'false', label: 'Active', icon: <CheckIcon fontSize="small" color="success" /> },
        { value: 'true', label: 'Disabled', icon: <BlockIcon fontSize="small" color="error" /> },
      ],
    },
  ], [])

  // Bulk action definitions
  const bulkActions: BulkAction<User>[] = useMemo(() => [
    {
      id: 'disable',
      label: 'Disable',
      icon: <BlockIcon />,
      action: async (users) => {
        setUsersToBulkProcess(users.filter(u => !u.is_disabled && u.id !== currentUser?.id))
        setBulkDisableDialogOpen(true)
      },
      disabled: (users) => users.every(u => u.is_disabled || u.id === currentUser?.id),
      confirmMessage: 'Disable {count} users?',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      action: async (users) => {
        setUsersToDelete(users.filter(u => u.id !== currentUser?.id))
        setDeleteDialogOpen(true)
      },
      disabled: (users) => users.every(u => u.id === currentUser?.id),
      confirmMessage: 'Delete {count} users? This action cannot be undone.',
    },
  ], [currentUser])

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <PageHeader
          icon={<GroupIcon sx={{ color: '#868e96' }} />}
          title="Users"
          description="Manage user accounts and permissions"
        />
        {isAdmin && (
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
        onRowClick={handleRowClick}
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
      />


      <UserDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          navigate('/users')
        }}
        user={selectedUser}
        onSave={() => {
          loadUsers()
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={usersToDelete.length === 1 ? "Delete User?" : `Delete ${usersToDelete.length} Users?`}
        message={
          usersToDelete.length === 1
            ? `Are you sure you want to delete ${usersToDelete[0]?.name}? This action cannot be undone.`
            : `Are you sure you want to delete ${usersToDelete.length} users? This action cannot be undone.`
        }
        confirmText="Delete"
        confirmColor="error"
        loading={bulkProcessing}
      />

      <ConfirmDialog
        open={bulkDisableDialogOpen}
        onClose={() => setBulkDisableDialogOpen(false)}
        onConfirm={handleBulkDisable}
        title={usersToBulkProcess.length === 1 ? "Disable User?" : `Disable ${usersToBulkProcess.length} Users?`}
        message={
          usersToBulkProcess.length === 1
            ? `Are you sure you want to disable ${usersToBulkProcess[0]?.name}?`
            : `Are you sure you want to disable ${usersToBulkProcess.length} users?`
        }
        confirmText="Disable"
        confirmColor="warning"
        loading={bulkProcessing}
      />
    </Box>
  )
}

export default Users
