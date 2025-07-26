import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  Block as BlockIcon,
} from '@mui/icons-material'
import { usersApi, User } from '../api/users'
import { useAuthStore } from '../stores/authStore'
import UserDrawer from '../components/UserDrawer'
import ConfirmDialog from '../components/ConfirmDialog'

const Users = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuUser, setMenuUser] = useState<User | null>(null)
  
  const { user: currentUser, pushCurrentToStack } = useAuthStore()
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
      const data = await usersApi.getAll(['permissions'], searchQuery)
      setUsers(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers()
  }

  const handleRowClick = (user: User) => {
    setSelectedUser(user)
    setDrawerOpen(true)
    navigate(`/users/${user.id}`)
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setDrawerOpen(true)
    navigate('/users/new')
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
    setDrawerOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    
    try {
      await usersApi.delete(userToDelete.id)
      await loadUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login as user')
    }
    handleCloseMenu()
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget)
    setMenuUser(user)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    setMenuUser(null)
  }

  const getRoleDisplay = (roles: string[]) => {
    return roles.map(role => 
      role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1)
    ).join(', ')
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.nickname.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })

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
        <Typography variant="h4">Users</Typography>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box p={2}>
          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, nickname, or email..."
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
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={60}></TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">User</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">Email</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">Roles</Typography>
              </TableCell>
              <TableCell align="center" width={100}>
                <Typography variant="subtitle2" fontWeight="bold">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  {searchQuery ? 'No users found matching your search.' : 'No users configured yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  hover
                  onClick={() => handleRowClick(user)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created on {new Date(user.created_on).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getRoleDisplay(user.roles)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMenuClick(e, user)
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          if (menuUser) {
            handleRowClick(menuUser)
            handleCloseMenu()
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View/Edit User</ListItemText>
        </MenuItem>
        {currentUser?.id !== menuUser?.id && !menuUser?.is_disabled && (
          <MenuItem onClick={() => menuUser && handleLoginAs(menuUser)}>
            <ListItemIcon>
              <LoginIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign in as User</ListItemText>
          </MenuItem>
        )}
        {currentUser?.id !== menuUser?.id && (
          <>
            <MenuItem divider />
            <MenuItem onClick={() => menuUser && handleDelete(menuUser)}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete User</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

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
        onLoginAs={handleLoginAs}
        onDelete={handleDelete}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User?"
        message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  )
}

export default Users
