import React from 'react'
import { useAuthStore } from '../stores/authStore'
import { Resource, PermissionLevel } from '../types/permissions'
import { Tooltip } from '@mui/material'

interface PermissionGateProps {
  children: React.ReactNode
  resource: Resource
  level?: PermissionLevel
  action?: 'view' | 'create' | 'edit' | 'delete'
  fallback?: React.ReactNode
  showTooltip?: boolean
  tooltipText?: string
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource,
  level,
  action,
  fallback = null,
  showTooltip = false,
  tooltipText
}) => {
  const { hasPermission, canAccess } = useAuthStore()

  // Use either level-based or action-based permission check
  const hasRequiredPermission = action
    ? canAccess(resource, action)
    : hasPermission(resource, level || 'view')

  if (!hasRequiredPermission) {
    return <>{fallback}</>
  }

  if (showTooltip && tooltipText) {
    return (
      <Tooltip title={tooltipText}>
        <div>{children}</div>
      </Tooltip>
    )
  }

  return <>{children}</>
}

export default PermissionGate