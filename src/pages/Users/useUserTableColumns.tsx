import React, { useMemo } from 'react'
import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Chip,
} from '@mui/material'
import {
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
import type { User } from '../../api/users'
import { ResponsiveTableColumn, ColumnPriority } from '../../components/DataTable/ResponsiveTypes'

interface UseUserTableColumnsParams {
  currentUserId: number | null
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onLoginAs: (user: User) => void
}

/** Returns a human-readable role label for a set of role strings. */
function getRoleDisplay(roles: string[]): string {
  if (!roles || roles.length === 0) {
    return 'User'
  }
  return roles
    .map(role =>
      role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1)
    )
    .join(', ')
}

/**
 * Custom hook that provides column definitions for the Users DataTable.
 * Extracts column configuration including render functions, sorting, and responsive priorities.
 */
export function useUserTableColumns(params: UseUserTableColumnsParams): ResponsiveTableColumn<User>[] {
  const { currentUserId, onEdit, onDelete, onLoginAs } = params

  return useMemo<ResponsiveTableColumn<User>[]>(() => [
    {
      id: 'avatar',
      label: '',
      width: 60,
      accessor: (user) => user.avatar,
      priority: 'P1' as ColumnPriority,
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
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      render: (_, user) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
            {user.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
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
      priority: 'P2' as ColumnPriority,
      showInCard: true,
    },
    {
      id: 'roles',
      label: 'Role',
      icon: <ShieldIcon />,
      accessor: (user) => user.roles,
      sortable: true,
      priority: 'P1' as ColumnPriority,
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
      priority: 'P1' as ColumnPriority,
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
      priority: 'P3' as ColumnPriority,
      showInCard: false,
      render: (date) => new Date(date as string).toLocaleDateString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <SettingsIcon />,
      align: 'right',
      accessor: () => null,
      priority: 'P1' as ColumnPriority,
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
            onClick={() => onEdit(user)}
            title="Edit User"
            aria-label="Edit User"
          >
            <EditIcon />
          </IconButton>
          {currentUserId !== user.id && !user.is_disabled && (
            <IconButton
              size="small"
              onClick={() => onLoginAs(user)}
              title="Sign in as User"
              aria-label="Sign in as User"
            >
              <LoginIcon />
            </IconButton>
          )}
          {currentUserId !== user.id && (
            <IconButton
              size="small"
              onClick={() => onDelete(user)}
              color="error"
              title="Delete User"
              aria-label="Delete User"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ),
    },
  ], [currentUserId, onEdit, onDelete, onLoginAs])
}
