import { useMemo } from 'react'
import {
  Check as CheckIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import type { User } from '../../api/users'
import type { BulkAction } from '../../components/DataTable/types'

interface UseUserBulkActionsParams {
  currentUserId: number | null
  onBulkEnable: (users: User[]) => Promise<void>
  onBulkDisable: (users: User[]) => Promise<void>
  onBulkDelete: (users: User[]) => void
}

/**
 * Custom hook that provides bulk action definitions for the Users DataTable.
 * Users use `is_disabled` rather than `enabled`, so these actions are defined
 * directly rather than via createStandardBulkActions.
 */
export function useUserBulkActions(params: UseUserBulkActionsParams): BulkAction<User>[] {
  const { currentUserId, onBulkEnable, onBulkDisable, onBulkDelete } = params

  return useMemo<BulkAction<User>[]>(() => [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckIcon />,
      color: 'success',
      action: async (selectedUsers) => {
        await onBulkEnable(selectedUsers)
      },
      disabled: (selectedUsers) => selectedUsers.every(u => !u.is_disabled || u.id === currentUserId),
      confirmMessage: 'Enable {count} users?',
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <BlockIcon />,
      color: 'warning',
      action: async (selectedUsers) => {
        await onBulkDisable(selectedUsers)
      },
      disabled: (selectedUsers) => selectedUsers.every(u => u.is_disabled || u.id === currentUserId),
      confirmMessage: 'Disable {count} users?',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      action: async (selectedUsers) => {
        onBulkDelete(selectedUsers.filter(u => u.id !== currentUserId))
      },
      disabled: (selectedUsers) => selectedUsers.every(u => u.id === currentUserId),
      confirmMessage: 'Delete {count} users? This action cannot be undone.',
    },
  ], [currentUserId, onBulkEnable, onBulkDisable, onBulkDelete])
}
