import React, { useMemo } from 'react'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import type { BulkAction } from '../components/DataTable/types'
import type { ToastEntityType } from '../types/entityTypes'

interface UseProxyHostBulkActionsParams {
  showSuccess: (entityType: ToastEntityType, action: string, entityName?: string, entityId?: number | string) => void
  showError: (entityType: ToastEntityType, action: string, error?: string, entityName?: string, entityId?: number | string) => void
  loadHosts: () => Promise<void>
}

/**
 * Custom hook that provides bulk action definitions for the proxy hosts DataTable.
 * Supports bulk enable, disable, and delete operations.
 */
const useProxyHostBulkActions = (params: UseProxyHostBulkActionsParams): BulkAction<ProxyHost>[] => {
  const { showSuccess, showError, loadHosts } = params

  const bulkActions = useMemo<BulkAction<ProxyHost>[]>(() => [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckCircleIcon />,
      confirmMessage: 'Are you sure you want to enable the selected proxy hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => !item.enabled).map(item => proxyHostsApi.enable(item.id)))
          showSuccess('proxy-host', 'enabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('proxy-host', 'enable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <CancelIcon />,
      confirmMessage: 'Are you sure you want to disable the selected proxy hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.filter(item => item.enabled).map(item => proxyHostsApi.disable(item.id)))
          showSuccess('proxy-host', 'disabled', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('proxy-host', 'disable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: 'Are you sure you want to delete the selected proxy hosts?',
      action: async (items) => {
        try {
          await Promise.all(items.map(item => proxyHostsApi.delete(item.id)))
          showSuccess('proxy-host', 'deleted', `${items.length} hosts`)
          await loadHosts()
        } catch (err) {
          showError('proxy-host', 'delete', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  ], [showSuccess, showError, loadHosts])

  return bulkActions
}

export default useProxyHostBulkActions
