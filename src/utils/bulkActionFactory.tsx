import React from 'react'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import type { BulkAction } from '../components/DataTable/types'
import type { ToastEntityType } from '../types/entityTypes'
import type { ToggleableEntity } from '../types/base'

interface BulkActionApi {
  enable: (id: number) => Promise<void>
  disable: (id: number) => Promise<void>
  delete: (id: number) => Promise<void>
}

interface StandardBulkActionsConfig {
  api: BulkActionApi
  entityType: ToastEntityType
  entityLabel: string
  showSuccess: (entityType: ToastEntityType, action: string, entityName?: string, entityId?: number | string) => void
  showError: (entityType: ToastEntityType, action: string, error?: string, entityName?: string, entityId?: number | string) => void
  loadItems: () => Promise<void>
}

export function createStandardBulkActions<T extends ToggleableEntity>(
  config: StandardBulkActionsConfig
): BulkAction<T>[] {
  const { api, entityType, entityLabel, showSuccess, showError, loadItems } = config

  return [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckCircleIcon />,
      confirmMessage: `Are you sure you want to enable the selected ${entityLabel}?`,
      action: async (items: T[]) => {
        try {
          await Promise.all(items.filter(item => !item.enabled).map(item => api.enable(item.id)))
          showSuccess(entityType, 'enabled', `${items.length} ${entityLabel}`)
          await loadItems()
        } catch (err) {
          showError(entityType, 'enable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <CancelIcon />,
      confirmMessage: `Are you sure you want to disable the selected ${entityLabel}?`,
      action: async (items: T[]) => {
        try {
          await Promise.all(items.filter(item => item.enabled).map(item => api.disable(item.id)))
          showSuccess(entityType, 'disabled', `${items.length} ${entityLabel}`)
          await loadItems()
        } catch (err) {
          showError(entityType, 'disable', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: `Are you sure you want to delete the selected ${entityLabel}?`,
      action: async (items: T[]) => {
        try {
          await Promise.all(items.map(item => api.delete(item.id)))
          showSuccess(entityType, 'deleted', `${items.length} ${entityLabel}`)
          await loadItems()
        } catch (err) {
          showError(entityType, 'delete', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  ]
}
