import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from '@mui/material'
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Delete as DeleteIcon,
  VisibilityOff as HiddenIcon,
  Visibility as ViewIcon,
  Edit as ManageIcon,
  Public as PublicIcon,
  PersonOutline as UserOnlyIcon,
} from '@mui/icons-material'
import { usersApi, User, CreateUserPayload, UpdateUserPayload } from '../api/users'
import { useAuthStore } from '../stores/authStore'
import BaseDrawer, { Tab } from './base/BaseDrawer'
import { useDrawerForm } from '../hooks/useDrawerForm'
import FormSection from './shared/FormSection'
import TabPanel from './shared/TabPanel'

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

interface UserFormData {
  name: string
  nickname: string
  email: string
  is_disabled: boolean
  is_admin: boolean
  current_password: string
  new_password: string
  confirm_password: string
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

interface PermissionPreset {
  name: string
  description: string
  permissions: UserFormData['permissions']
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

const UserDrawer: React.FC<UserDrawerProps> = ({ open, onClose, user, onSave, onLoginAs, onDelete }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState<string>('custom')
  const { user: currentUser } = useAuthStore()
  
  const isCurrentUserAdmin = currentUser?.roles?.includes('admin')
  const isChangingOwnPassword = currentUser?.id === user?.id
  const cannotDeleteSelf = currentUser?.id === user?.id
  const isAdminUser = user?.roles?.includes('admin')

  // Form management
  const form = useDrawerForm<UserFormData>({
    initialData: {
      name: user?.name || '',
      nickname: user?.nickname || '',
      email: user?.email || '',
      is_disabled: user?.is_disabled || false,
      is_admin: user?.roles?.includes('admin') || false,
      current_password: '',
      new_password: '',
      confirm_password: '',
      permissions: {
        visibility: user?.permissions?.visibility || 'all',
        proxy_hosts: user?.permissions?.proxy_hosts || 'manage',
        redirection_hosts: user?.permissions?.redirection_hosts || 'manage',
        dead_hosts: user?.permissions?.dead_hosts || 'manage',
        streams: user?.permissions?.streams || 'manage',
        access_lists: user?.permissions?.access_lists || 'manage',
        certificates: user?.permissions?.certificates || 'manage',
      },
    },
    fields: {
      name: { initialValue: '', required: true },
      nickname: { initialValue: '', required: true },
      email: { initialValue: '', required: true },
      new_password: {
        initialValue: '',
        validate: (value) => {
          if (value && value.length < 6) return 'Password must be at least 6 characters'
          return null
        }
      },
      confirm_password: {
        initialValue: '',
        validate: (value, formData) => {
          if (formData?.new_password && value !== formData.new_password) {
            return 'Passwords do not match'
          }
          return null
        }
      },
      permissions: { initialValue: {} },
      is_disabled: { initialValue: false },
      is_admin: { initialValue: false },
      current_password: { initialValue: '' },
    },
    onSubmit: async (data) => {
      if (user) {
        // Update existing user
        const updateData: UpdateUserPayload = {
          name: data.name,
          nickname: data.nickname,
          email: data.email,
          is_disabled: data.is_disabled,
        }
        await usersApi.update(user.id, updateData)
      } else {
        // Create new user
        const createData: CreateUserPayload = {
          name: data.name,
          nickname: data.nickname,
          email: data.email,
          is_disabled: data.is_disabled,
        }
        await usersApi.create(createData)
      }
      onSave()
    },
  })

  const handlePasswordSubmit = async () => {
    if (!user || !form.data.new_password) return
    
    await usersApi.updatePassword(user.id, {
      type: 'password',
      current: isChangingOwnPassword ? form.data.current_password : undefined,
      secret: form.data.new_password,
    })
    
    // Reset password fields
    form.setFieldValue('current_password', '')
    form.setFieldValue('new_password', '')
    form.setFieldValue('confirm_password', '')
  }

  const handlePermissionsSubmit = async () => {
    if (!user) return
    await usersApi.updatePermissions(user.id, form.data.permissions)
    onSave()
  }

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    if (presetName !== 'custom') {
      const preset = PERMISSION_PRESETS.find(p => p.name === presetName)
      if (preset) {
        form.setFieldValue('permissions', preset.permissions)
      }
    }
  }

  const getPermissionIcon = (level: PermissionLevel) => {
    switch (level) {
      case 'hidden': return <HiddenIcon fontSize="small" />
      case 'view': return <ViewIcon fontSize="small" />
      case 'manage': return <ManageIcon fontSize="small" />
    }
  }


  useEffect(() => {
    if (open) setActiveTab(0)
  }, [open])

  const tabs: Tab[] = [
    {
      id: 'details',
      label: 'Details',
      icon: <PersonIcon />,
      hasError: Boolean(form.errors.name || form.errors.nickname || form.errors.email),
    },
    ...(user ? [{
      id: 'password',
      label: 'Password',
      icon: <LockIcon />,
      hasError: Boolean(form.errors.new_password || form.errors.confirm_password),
    }] : []),
    ...(user ? [{
      id: 'permissions',
      label: 'Permissions',
      icon: <ShieldIcon />,
    }] : []),
  ]

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={user ? `Edit User: ${user.name}` : 'New User'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={form.loading}
      error={form.globalError || undefined}
      onSave={form.handleSubmit}
      isDirty={form.isDirty}
      saveText={user ? 'Save Changes' : 'Create User'}
    >
      <TabPanel value={activeTab} index={0} keepMounted animation="none">
        <FormSection title="User Details">
          <TextField
            {...form.getFieldProps('name')}
            fullWidth
            label="Full Name"
            margin="normal"
            required
            helperText="The user's full name"
          />

          <TextField
            {...form.getFieldProps('nickname')}
            fullWidth
            label="Nickname"
            margin="normal"
            required
            helperText="A short display name"
          />

          <TextField
            {...form.getFieldProps('email')}
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            required
            disabled={user?.email === 'admin@example.com'}
            helperText="Used for login and notifications"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.data.is_disabled}
                onChange={(e) => form.setFieldValue('is_disabled', e.target.checked)}
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
              <FormControlLabel
                control={
                  <Switch
                    checked={form.data.is_admin}
                    onChange={(e) => form.setFieldValue('is_admin', e.target.checked)}
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
        </FormSection>

        {user && (
          <FormSection title="Actions">
            <Box display="flex" gap={2}>
              {!cannotDeleteSelf && !user.is_disabled && onLoginAs && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => { onLoginAs(user); onClose() }}
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
                  onClick={() => { onDelete(user); onClose() }}
                  startIcon={<DeleteIcon />}
                >
                  Delete User
                </Button>
              )}
            </Box>
          </FormSection>
        )}
      </TabPanel>

      {user && (
        <TabPanel value={activeTab} index={1} keepMounted animation="none">
          <FormSection title="Change Password">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Changing password for: <strong>{user.name}</strong>
            </Typography>

            {isChangingOwnPassword && (
              <TextField
                {...form.getFieldProps('current_password')}
                fullWidth
                type="password"
                label="Current Password"
                margin="normal"
                required
              />
            )}

            <TextField
              {...form.getFieldProps('new_password')}
              fullWidth
              type="password"
              label="New Password"
              margin="normal"
              required
              helperText="Minimum 6 characters"
            />

            <TextField
              {...form.getFieldProps('confirm_password')}
              fullWidth
              type="password"
              label="Confirm New Password"
              margin="normal"
              required
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handlePasswordSubmit}
              disabled={form.loading || !form.data.new_password || !form.data.confirm_password || (isChangingOwnPassword && !form.data.current_password)}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>
          </FormSection>
        </TabPanel>
      )}

      {user && (
        <TabPanel value={activeTab} index={2} keepMounted animation="none">
          {isAdminUser && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This user is an administrator and has full access to all features.
            </Alert>
          )}

          {!isAdminUser && (
            <FormSection title="Permission Templates">
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
            </FormSection>
          )}

          <FormSection title="Visibility Scope">
            <ToggleButtonGroup
              value={form.data.permissions.visibility}
              exclusive
              onChange={(_, value) => value && form.setFieldValue('permissions', { ...form.data.permissions, visibility: value })}
              disabled={isAdminUser}
              fullWidth
            >
              <ToggleButton value="all">
                <Box textAlign="center">
                  <PublicIcon sx={{ mb: 0.5 }} />
                  <Typography variant="caption" display="block">All Items</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="user">
                <Box textAlign="center">
                  <UserOnlyIcon sx={{ mb: 0.5 }} />
                  <Typography variant="caption" display="block">Own Items Only</Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </FormSection>

          <FormSection title="Feature Permissions">
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
                      value={form.data.permissions[key as keyof typeof form.data.permissions]}
                      exclusive
                      onChange={(_, value) => value && form.setFieldValue('permissions', { 
                        ...form.data.permissions, 
                        [key]: value 
                      })}
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
                </Grid>
              ))}
            </Grid>

            <Button
              fullWidth
              variant="contained"
              onClick={handlePermissionsSubmit}
              disabled={form.loading || isAdminUser}
              sx={{ mt: 3 }}
            >
              Save Permissions
            </Button>
          </FormSection>
        </TabPanel>
      )}
    </BaseDrawer>
  )
}

export default UserDrawer