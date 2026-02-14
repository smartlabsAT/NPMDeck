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
  showWarning: (message: string, entityType?: ToastEntityType) => void
  loadItems: () => Promise<void>
}

/**
 * Reports the outcome of a bulk operation using Promise.allSettled results.
 * Shows success toast when all items succeed, warning when some fail,
 * and error when all fail.
 */
function reportBulkResults(
  results: PromiseSettledResult<void>[],
  action: string,
  entityType: ToastEntityType,
  entityLabel: string,
  showSuccess: StandardBulkActionsConfig['showSuccess'],
  showError: StandardBulkActionsConfig['showError'],
  showWarning: StandardBulkActionsConfig['showWarning']
): void {
  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  if (failed === 0) {
    showSuccess(entityType, action, `${succeeded} ${entityLabel}`)
  } else if (succeeded === 0) {
    showError(entityType, action, `All ${failed} operations failed`)
  } else {
    showWarning(`${succeeded} ${entityLabel} ${action} successfully, ${failed} failed`, entityType)
  }
}

export function createStandardBulkActions<T extends ToggleableEntity>(
  config: StandardBulkActionsConfig
): BulkAction<T>[] {
  const { api, entityType, entityLabel, showSuccess, showError, showWarning, loadItems } = config

  return [
    {
      id: 'enable',
      label: 'Enable',
      icon: <CheckCircleIcon />,
      confirmMessage: `Are you sure you want to enable the selected ${entityLabel}?`,
      action: async (items: T[]) => {
        const results = await Promise.allSettled(
          items.filter(item => !item.enabled).map(item => api.enable(item.id))
        )
        reportBulkResults(results, 'enabled', entityType, entityLabel, showSuccess, showError, showWarning)
        await loadItems()
      }
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <CancelIcon />,
      confirmMessage: `Are you sure you want to disable the selected ${entityLabel}?`,
      action: async (items: T[]) => {
        const results = await Promise.allSettled(
          items.filter(item => item.enabled).map(item => api.disable(item.id))
        )
        reportBulkResults(results, 'disabled', entityType, entityLabel, showSuccess, showError, showWarning)
        await loadItems()
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: `Are you sure you want to delete the selected ${entityLabel}?`,
      action: async (items: T[]) => {
        const results = await Promise.allSettled(
          items.map(item => api.delete(item.id))
        )
        reportBulkResults(results, 'deleted', entityType, entityLabel, showSuccess, showError, showWarning)
        await loadItems()
      }
    }
  ]
}
