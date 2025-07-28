import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Grid,
} from '@mui/material'
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Delete as DeleteIcon,
  VisibilityOff as HiddenIcon,
  Visibility as ViewIcon,
  Edit as ManageIcon,
  Public as PublicIcon,
  PersonOutline as UserOnlyIcon,
  Group,
} from '@mui/icons-material'
import { usersApi, User, CreateUserPayload, UpdateUserPayload } from '../api/users'
import { useAuthStore } from '../stores/authStore'

interface UserDrawerProps {
  open: boolean
  onClose: () => void
  user: User | null
  onSave: () => void
  onLoginAs?: (user: User) => void
  onDelete?: (user: User) => void
}

type PermissionLevel = 'hidden' | 'view' | 'manage'
type VisibilityLevel = 'all' | 'user'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface PermissionPreset {
  name: string
  description: string
  permissions: {
    visibility: VisibilityLevel
    proxy_hosts: PermissionLevel
    redirection_hosts: PermissionLevel
    dead_hosts: PermissionLevel
    streams: PermissionLevel
    access_lists: PermissionLevel
    certificates: PermissionLevel
  }
}

const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    name: 'Read-Only',
    description: 'Can view all features but cannot make changes',
    permissions: {
      visibility: 'all',
      proxy_hosts: 'view',
      redirection_hosts: 'view',
      dead_hosts: 'view',
      streams: 'view',
      access_lists: 'view',
      certificates: 'view',
    }
  },
  {
    name: 'Host Manager',
    description: 'Can manage all host types',
    permissions: {
      visibility: 'all',
      proxy_hosts: 'manage',
      redirection_hosts: 'manage',
      dead_hosts: 'manage',
      streams: 'manage',
      access_lists: 'view',
      certificates: 'view',
    }
  },
  {
    name: 'Certificate Manager',
    description: 'Can manage certificates and access lists',
    permissions: {
      visibility: 'all',
      proxy_hosts: 'view',
      redirection_hosts: 'view',
      dead_hosts: 'view',
      streams: 'view',
      access_lists: 'manage',
      certificates: 'manage',
    }
  },
  {
    name: 'Own Items Only',
    description: 'Can only see and manage their own items',
    permissions: {
      visibility: 'user',
      proxy_hosts: 'manage',
      redirection_hosts: 'manage',
      dead_hosts: 'manage',
      streams: 'manage',
      access_lists: 'manage',
      certificates: 'manage',
    }
  },
]

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

const UserDrawer: React.FC<UserDrawerProps> = ({ open, onClose, user, onSave, onLoginAs, onDelete }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('custom')
  
  // Form data for details tab
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    is_disabled: false,
    is_admin: false,
  })
  
  // Password data
  const [passwordData, setPasswordData] = useState({
    current: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  // Permissions data
  const [permissions, setPermissions] = useState({
    visibility: 'all' as VisibilityLevel,
    proxy_hosts: 'manage' as PermissionLevel,
    redirection_hosts: 'manage' as PermissionLevel,
    dead_hosts: 'manage' as PermissionLevel,
    streams: 'manage' as PermissionLevel,
    access_lists: 'manage' as PermissionLevel,
    certificates: 'manage' as PermissionLevel,
  })
  
  const { user: currentUser } = useAuthStore()
  const isCurrentUserAdmin = currentUser?.roles?.includes('admin')
  const isChangingOwnPassword = currentUser?.id === user?.id
  const cannotDeleteSelf = currentUser?.id === user?.id
  const isAdminUser = user?.roles?.includes('admin')

  useEffect(() => {
    // Reset tab to 0 when drawer opens/closes
    setActiveTab(0)
    setError(null)
    setSuccessMessage(null)
    
    // Reset password data
    setPasswordData({
      current: '',
      newPassword: '',
      confirmPassword: '',
    })
    
    if (user) {
      // Load user details
      setFormData({
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        is_disabled: user.is_disabled,
        is_admin: user.roles?.includes('admin') || false,
      })
      
      // Load permissions
      if (user.permissions) {
        setPermissions({
          visibility: user.permissions.visibility || 'all',
          proxy_hosts: user.permissions.proxy_hosts || 'manage',
          redirection_hosts: user.permissions.redirection_hosts || 'manage',
          dead_hosts: user.permissions.dead_hosts || 'manage',
          streams: user.permissions.streams || 'manage',
          access_lists: user.permissions.access_lists || 'manage',
          certificates: user.permissions.certificates || 'manage',
        })
      }
    } else {
      // Reset for new user
      setFormData({
        name: '',
        nickname: '',
        email: '',
        is_disabled: false,
        is_admin: false,
      })
      setPermissions({
        visibility: 'all',
        proxy_hosts: 'manage',
        redirection_hosts: 'manage',
        dead_hosts: 'manage',
        streams: 'manage',
        access_lists: 'manage',
        certificates: 'manage',
      })
    }
  }, [user, open])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setError(null)
    setSuccessMessage(null)
  }

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (user) {
        // Update existing user
        const updateData: UpdateUserPayload = {
          name: formData.name,
          nickname: formData.nickname,
          email: formData.email,
          is_disabled: formData.is_disabled,
        }
        await usersApi.update(user.id, updateData)
        setSuccessMessage('User details updated successfully')
      } else {
        // Create new user
        const createData: CreateUserPayload = {
          name: formData.name,
          nickname: formData.nickname,
          email: formData.email,
          is_disabled: formData.is_disabled,
        }
        await usersApi.create(createData)
        setSuccessMessage('User created successfully')
        // For new users, switch to permissions tab
        setActiveTab(2)
      }
      onSave()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await usersApi.updatePassword(user.id, {
        type: 'password',
        current: isChangingOwnPassword ? passwordData.current : undefined,
        secret: passwordData.newPassword,
      })
      setSuccessMessage('Password updated successfully')
      // Reset password fields
      setPasswordData({
        current: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await usersApi.updatePermissions(user.id, permissions)
      setSuccessMessage('Permissions updated successfully')
      onSave()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permissions')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: field === 'is_disabled' || field === 'is_admin' ? e.target.checked : e.target.value,
    })
  }

  const handlePasswordChange = (field: keyof typeof passwordData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordData({
      ...passwordData,
      [field]: e.target.value,
    })
  }

  const handlePermissionChange = (key: keyof typeof permissions, value: string) => {
    setPermissions({
      ...permissions,
      [key]: value,
    })
    setSelectedPreset('custom')
  }

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    if (presetName !== 'custom') {
      const preset = PERMISSION_PRESETS.find(p => p.name === presetName)
      if (preset) {
        setPermissions(preset.permissions)
      }
    }
  }

  const getPermissionIcon = (level: PermissionLevel) => {
    switch (level) {
      case 'hidden':
        return <HiddenIcon fontSize="small" />
      case 'view':
        return <ViewIcon fontSize="small" />
      case 'manage':
        return <ManageIcon fontSize="small" />
    }
  }

  const getPermissionColor = (level: PermissionLevel): 'error' | 'warning' | 'success' => {
    switch (level) {
      case 'hidden':
        return 'error'
      case 'view':
        return 'warning'
      case 'manage':
        return 'success'
    }
  }

  const handleDeleteClick = () => {
    if (user && onDelete) {
      onDelete(user)
      onClose()
    }
  }

  const handleLoginAsClick = () => {
    if (user && onLoginAs) {
      onLoginAs(user)
      onClose()
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 500 } }
      }}
    >
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user ? <PersonIcon sx={{ color: '#6c757d' }} /> : <Group sx={{ color: '#6c757d' }} />}
            <Typography variant="h5">
              {user ? `Edit User: ${user.name}` : 'New User'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab icon={<PersonIcon />} label="Details" />
          {user && <Tab icon={<LockIcon />} label="Password" />}
          {user && <Tab icon={<ShieldIcon />} label="Permissions" />}
        </Tabs>

        {/* Details Tab */}
        <TabPanel value={activeTab} index={0}>
          <form onSubmit={handleDetailsSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={handleChange('name')}
              margin="normal"
              required
              helperText="The user's full name"
            />

            <TextField
              fullWidth
              label="Nickname"
              value={formData.nickname}
              onChange={handleChange('nickname')}
              margin="normal"
              required
              helperText="A short display name"
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              margin="normal"
              required
              disabled={user?.email === 'admin@example.com'}
              helperText="Used for login and notifications"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_disabled}
                  onChange={handleChange('is_disabled')}
                />
              }
              label="Disabled"
              sx={{ mt: 2, mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Disabled users cannot login
            </Typography>

            {isCurrentUserAdmin && (
              <>
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_admin}
                      onChange={handleChange('is_admin')}
                      disabled={user?.email === 'admin@example.com'}
                    />
                  }
                  label="Administrator"
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                  Administrators have full access to all features
                </Typography>
              </>
            )}

            <Box display="flex" gap={2} mt={3}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : (user ? 'Save Changes' : 'Create User')}
              </Button>
            </Box>

            {user && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box display="flex" gap={2}>
                  {!cannotDeleteSelf && !user.is_disabled && onLoginAs && (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleLoginAsClick}
                      startIcon={<LockIcon />}
                    >
                      Sign in as User
                    </Button>
                  )}
                  {!cannotDeleteSelf && onDelete && (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={handleDeleteClick}
                      startIcon={<DeleteIcon />}
                    >
                      Delete User
                    </Button>
                  )}
                </Box>
              </>
            )}
          </form>
        </TabPanel>

        {/* Password Tab */}
        {user && (
          <TabPanel value={activeTab} index={1}>
            <form onSubmit={handlePasswordSubmit}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Changing password for: <strong>{user.name}</strong>
              </Typography>

              {isChangingOwnPassword && (
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={passwordData.current}
                  onChange={handlePasswordChange('current')}
                  margin="normal"
                  required
                />
              )}

              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange('newPassword')}
                margin="normal"
                required
                helperText="Minimum 6 characters"
              />

              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                margin="normal"
                required
                error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
                helperText={
                  passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
              />

              <Box display="flex" gap={2} mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword || (isChangingOwnPassword && !passwordData.current)}
                >
                  {loading ? <CircularProgress size={24} /> : 'Change Password'}
                </Button>
              </Box>
            </form>
          </TabPanel>
        )}

        {/* Permissions Tab */}
        {user && (
          <TabPanel value={activeTab} index={2}>
            <form onSubmit={handlePermissionsSubmit}>
              {isAdminUser && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This user is an administrator and has full access to all features.
                </Alert>
              )}

              {/* Permission Presets */}
              {!isAdminUser && (
                <Box mb={3}>
                  <FormControl fullWidth>
                    <InputLabel>Permission Template</InputLabel>
                    <Select
                      value={selectedPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      label="Permission Template"
                    >
                      <MenuItem value="custom">
                        <Box display="flex" alignItems="center" gap={1}>
                          <ManageIcon fontSize="small" />
                          <span>Custom Configuration</span>
                        </Box>
                      </MenuItem>
                      {PERMISSION_PRESETS.map((preset) => (
                        <MenuItem key={preset.name} value={preset.name}>
                          <Box>
                            <Typography variant="body2">{preset.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {preset.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Visibility Settings */}
              <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
                  <PublicIcon fontSize="small" />
                  Visibility Scope
                </Typography>
                <ToggleButtonGroup
                  value={permissions.visibility}
                  exclusive
                  onChange={(_e, value) => value && handlePermissionChange('visibility', value)}
                  disabled={isAdminUser}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  <ToggleButton value="all">
                    <Box textAlign="center">
                      <PublicIcon sx={{ mb: 0.5 }} />
                      <Typography variant="caption" display="block">All Items</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Can see everyone's items
                      </Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="user">
                    <Box textAlign="center">
                      <UserOnlyIcon sx={{ mb: 0.5 }} />
                      <Typography variant="caption" display="block">Own Items Only</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Can only see their items
                      </Typography>
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>

              {/* Feature Permissions Matrix */}
              <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
                <ShieldIcon fontSize="small" />
                Feature Permissions
              </Typography>
              
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {[
                    { key: 'proxy_hosts', label: 'Proxy Hosts', icon: '🔀' },
                    { key: 'redirection_hosts', label: 'Redirection Hosts', icon: '↪️' },
                    { key: 'dead_hosts', label: '404 Hosts', icon: '🚫' },
                    { key: 'streams', label: 'Streams', icon: '🌊' },
                    { key: 'access_lists', label: 'Access Lists', icon: '🔐' },
                    { key: 'certificates', label: 'SSL Certificates', icon: '🔒' },
                  ].map(({ key, label, icon }) => (
                    <Grid item xs={12} key={key}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Typography variant="h6">{icon}</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {label}
                          </Typography>
                        </Box>
                        <ToggleButtonGroup
                          value={permissions[key as keyof typeof permissions]}
                          exclusive
                          onChange={(_e, value) => value && handlePermissionChange(key as keyof typeof permissions, value)}
                          disabled={isAdminUser}
                          size="small"
                        >
                          <ToggleButton value="hidden" sx={{ px: 2 }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {getPermissionIcon('hidden')}
                              <Typography variant="caption">Hidden</Typography>
                            </Box>
                          </ToggleButton>
                          <ToggleButton value="view" sx={{ px: 2 }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {getPermissionIcon('view')}
                              <Typography variant="caption">View</Typography>
                            </Box>
                          </ToggleButton>
                          <ToggleButton value="manage" sx={{ px: 2 }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {getPermissionIcon('manage')}
                              <Typography variant="caption">Manage</Typography>
                            </Box>
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                      {key !== 'certificates' && <Divider sx={{ mt: 2 }} />}
                    </Grid>
                  ))}
                </Grid>

                {/* Permission Summary */}
                {!isAdminUser && (
                  <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
                    <Typography variant="caption" fontWeight="bold" gutterBottom display="block">
                      Permission Summary:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                      {Object.entries(permissions).map(([key, value]) => {
                        if (key === 'visibility') return null
                        const feature = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                        return (
                          <Chip
                            key={key}
                            label={`${feature}: ${value}`}
                            size="small"
                            color={getPermissionColor(value as PermissionLevel)}
                            icon={getPermissionIcon(value as PermissionLevel)}
                          />
                        )
                      })}
                    </Box>
                  </Box>
                )}
              </Paper>

              <Box display="flex" gap={2} mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading || isAdminUser}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Permissions'}
                </Button>
              </Box>
            </form>
          </TabPanel>
        )}
      </Box>
    </Drawer>
  )
}

export default UserDrawer