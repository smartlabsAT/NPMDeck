import React, { useState, useEffect } from 'react'
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material'
import { usersApi, User, CreateUserPayload, UpdateUserPayload } from '../../api/users'
import { useAuthStore } from '../../stores/authStore'
import BaseDrawer, { DrawerTab } from '../base/BaseDrawer'
import { useDrawerForm } from '../../hooks/useDrawerForm'
import { useToast } from '../../contexts/ToastContext'
import { NAVIGATION_CONFIG } from '../../constants/navigation'
import { VALIDATION } from '../../constants/validation'
import { PERMISSION_PRESETS } from './constants'
import type { UserFormData } from './types'
import UserDetailsTab from './UserDetailsTab'
import UserPasswordTab from './UserPasswordTab'
import UserPermissionsTab from './UserPermissionsTab'

interface UserDrawerProps {
  open: boolean
  onClose: () => void
  user: User | null
  onSave: () => void
}

const UserDrawer = ({ open, onClose, user, onSave }: UserDrawerProps) => {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState<string>('custom')
  const { user: currentUser } = useAuthStore()
  const { showSuccess, showError } = useToast()

  const isCurrentUserAdmin = currentUser?.roles?.includes('admin')
  const isChangingOwnPassword = currentUser?.id === user?.id
  const isAdminUser = user?.roles?.includes('admin')
  const isEditMode = !!user

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
    validate: (data) => {
      const errors: Partial<Record<keyof UserFormData, string>> = {}

      // Name validation
      if (!data.name || data.name.trim() === '') {
        errors.name = 'Name is required'
      }

      // Email validation
      if (!data.email || data.email.trim() === '') {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Invalid email format'
      }

      // Password validation (only for new users or if changing password)
      if (!user && activeTab === 0) { // New user on details tab
        if (!data.new_password) {
          errors.new_password = 'Password is required for new users'
        }
      }

      if (data.new_password || data.confirm_password) {
        if (data.new_password !== data.confirm_password) {
          errors.confirm_password = 'Passwords do not match'
        }
        if (data.new_password && data.new_password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
          errors.new_password = `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`
        }
        if (isChangingOwnPassword && !data.current_password) {
          errors.current_password = 'Current password is required'
        }
      }

      return Object.keys(errors).length > 0 ? errors : null
    },
    onSubmit: async (data) => {
      if (user) {
        // Update existing user
        const updateData: UpdateUserPayload = {
          name: data.name,
          nickname: data.nickname,
          email: data.email,
          is_disabled: data.is_disabled,
          roles: data.is_admin ? ['admin'] : [],
        }
        await usersApi.update(user.id, updateData)
      } else {
        // Create new user
        const createData: CreateUserPayload = {
          name: data.name,
          nickname: data.nickname,
          email: data.email,
          is_disabled: data.is_disabled,
          roles: data.is_admin ? ['admin'] : [],
        }
        const newUser = await usersApi.create(createData)

        // Set password for new user (required)
        if (data.new_password) {
          await usersApi.updatePassword(newUser.id, {
            type: 'password',
            secret: data.new_password,
          })
        }

        // Set permissions if not default (all/manage)
        const hasNonDefaultPermissions =
          data.permissions.visibility !== 'all' ||
          data.permissions.proxy_hosts !== 'manage' ||
          data.permissions.redirection_hosts !== 'manage' ||
          data.permissions.dead_hosts !== 'manage' ||
          data.permissions.streams !== 'manage' ||
          data.permissions.access_lists !== 'manage' ||
          data.permissions.certificates !== 'manage'

        if (hasNonDefaultPermissions && !data.is_admin) {
          await usersApi.updatePermissions(newUser.id, data.permissions)
        }
      }
      onSave()
    },
    onSuccess: (data) => {
      showSuccess('user', isEditMode ? 'updated' : 'created', data.name || data.email)
    },
    onError: (error) => {
      showError('user', isEditMode ? 'update' : 'create', error.message, form.data.name || form.data.email)
    },
  })

  const handlePasswordSubmit = async () => {
    if (!user || !form.data.new_password) return

    try {
      await usersApi.updatePassword(user.id, {
        type: 'password',
        current: isChangingOwnPassword ? form.data.current_password : undefined,
        secret: form.data.new_password,
      })

      showSuccess('user', 'password-changed', user.name || user.email)

      // Reset password fields
      form.setFieldValue('current_password', '')
      form.setFieldValue('new_password', '')
      form.setFieldValue('confirm_password', '')
    } catch (error) {
      showError('user', 'password-change', error instanceof Error ? error.message : 'Unknown error', user.name || user.email)
    }
  }

  const handlePermissionsSubmit = async () => {
    if (!user) return

    try {
      await usersApi.updatePermissions(user.id, form.data.permissions)
      showSuccess('user', 'permissions-updated', user.name || user.email)
      onSave()
    } catch (error) {
      showError('user', 'permissions-update', error instanceof Error ? error.message : 'Unknown error', user.name || user.email)
    }
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

  useEffect(() => {
    if (open) {
      setActiveTab(0)
      // Reset form when opening with different user or new user
      form.resetForm({
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
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- form.resetForm is stable; adding form object would cause infinite re-renders
  }, [open, user, form.resetForm])

  const tabs: DrawerTab[] = [
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
      titleIcon={React.createElement(NAVIGATION_CONFIG.users.icon, { sx: { color: NAVIGATION_CONFIG.users.color } })}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={form.loading}
      error={form.globalError || undefined}
      onSave={form.handleSubmit}
      isDirty={form.isDirty}
      confirmClose={form.isDirty}
      saveText={user ? 'Save Changes' : 'Create User'}
    >
      <UserDetailsTab
        form={form}
        isEditMode={isEditMode}
        user={user}
        isCurrentUserAdmin={isCurrentUserAdmin}
        activeTab={activeTab}
      />
      {user && (
        <UserPasswordTab
          form={form}
          user={user}
          isChangingOwnPassword={!!isChangingOwnPassword}
          activeTab={activeTab}
          onPasswordSubmit={handlePasswordSubmit}
        />
      )}
      {user && (
        <UserPermissionsTab
          form={form}
          user={user}
          isAdminUser={isAdminUser}
          activeTab={activeTab}
          selectedPreset={selectedPreset}
          onPresetChange={handlePresetChange}
          onPermissionsSubmit={handlePermissionsSubmit}
        />
      )}
    </BaseDrawer>
  );
}

export default UserDrawer
