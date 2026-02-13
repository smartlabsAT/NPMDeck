/**
 * Status utility functions for host/stream entities
 * Extracted from ProxyHosts, RedirectionHosts, DeadHosts, Streams pages and detail dialogs
 */
import { Tooltip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ErrorIcon from '@mui/icons-material/Error'

/** Entity shape required for status utilities */
interface StatusEntity {
  enabled: boolean
  meta: { nginx_online?: boolean; nginx_err?: string | null }
}

/**
 * Get the status icon for an entity with tooltip.
 *
 * @param entity - Object with enabled and meta.nginx_online fields
 * @returns A React node with the appropriate status icon and tooltip
 */
export function getStatusIcon(entity: StatusEntity): React.ReactNode {
  if (!entity.enabled) {
    return <Tooltip title="Disabled"><CancelIcon color="disabled" /></Tooltip>
  }
  if (entity.meta.nginx_online === false) {
    return <Tooltip title={entity.meta.nginx_err || 'Offline'}><ErrorIcon color="error" /></Tooltip>
  }
  return <Tooltip title="Online"><CheckCircleIcon color="success" /></Tooltip>
}

/**
 * Get the status text label for an entity.
 *
 * @param entity - Object with enabled and meta.nginx_online fields
 * @returns Status text: 'Disabled', 'Offline', or 'Online'
 */
export function getStatusText(entity: StatusEntity): string {
  if (!entity.enabled) return 'Disabled'
  if (entity.meta.nginx_online === false) return 'Offline'
  return 'Online'
}

/**
 * Get the status color for MUI Chip/Badge components.
 *
 * @param entity - Object with enabled and meta.nginx_online fields
 * @returns MUI color: 'default', 'error', or 'success'
 */
export function getStatusColor(entity: StatusEntity): 'default' | 'error' | 'success' {
  if (!entity.enabled) return 'default'
  if (entity.meta.nginx_online === false) return 'error'
  return 'success'
}
