import React, { useMemo } from 'react'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import type { BulkAction } from '../components/DataTable/types'
import type { ToastEntityType } from '../types/entityTypes'

interface UseRedirectionHostBulkActionsParams {
  showSuccess: (entityType: ToastEntityType, action: string, entityName?: string, entityId?: number | string) => void
  showError: (entityType: ToastEntityType, action: string, error?: string, entityName?: string, entityId?: number | string) => void
  loadHosts: () => Promise<void>
}

/**
 * Custom hook that provides bulk action definitions for the redirection hosts DataTable.
 * Supports bulk enable, disable, and delete operations.
 */
const useRedirectionHostBulkActions = (params: UseRedirectionHostBulkActionsParams): BulkAction<RedirectionHost>[] => {
  const { showSuccess, showError, loadHosts } = params

  const bulkActions = useMemo<BulkAction<RedirectionHost>[]>(() => [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckCircleIcon />,
      confirmMessage: 'Are you sure you want to enable the selected redirection hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => !item.enabled).map(item => redirectionHostsApi.enable(item.id)))
          showSuccess('redirection-host', 'enabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('redirection-host', 'enable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <CancelIcon />,
      confirmMessage: 'Are you sure you want to disable the selected redirection hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => item.enabled).map(item => redirectionHostsApi.disable(item.id)))
          showSuccess('redirection-host', 'disabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('redirection-host', 'disable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: 'Are you sure you want to delete the selected redirection hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.map(item => redirectionHostsApi.delete(item.id)))
          showSuccess('redirection-host', 'deleted', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('redirection-host', 'delete', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  ], [showSuccess, showError, loadHosts])

  return bulkActions
}

export default useRedirectionHostBulkActions
