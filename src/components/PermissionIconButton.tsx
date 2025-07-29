import { IconButton, IconButtonProps, Tooltip } from '@mui/material'
import { useAuthStore } from '../stores/authStore'
import { Resource, PermissionLevel } from '../types/permissions'

interface PermissionIconButtonProps extends Omit<IconButtonProps, 'action'> {
  resource: Resource
  level?: PermissionLevel
  permissionAction?: 'view' | 'create' | 'edit' | 'delete'
  hideWhenUnauthorized?: boolean
  tooltipWhenDisabled?: string
  tooltipTitle?: string
}

const PermissionIconButton: React.FC<PermissionIconButtonProps> = ({
  resource,
  level,
  permissionAction,
  hideWhenUnauthorized = false,
  tooltipWhenDisabled = 'Keine Berechtigung',
  tooltipTitle,
  children,
  disabled,
  ...iconButtonProps
}) => {
  const { hasPermission, canAccess } = useAuthStore()

  // Use either level-based or action-based permission check
  const hasRequiredPermission = permissionAction
    ? canAccess(resource, permissionAction)
    : hasPermission(resource, level || 'manage')

  if (!hasRequiredPermission && hideWhenUnauthorized) {
    return null
  }

  const isDisabled = disabled || !hasRequiredPermission

  const iconButton = (
    <IconButton
      {...iconButtonProps}
      disabled={isDisabled}
    >
      {children}
    </IconButton>
  )

  // Determine which tooltip to show
  let tooltip = tooltipTitle
  if (!hasRequiredPermission && tooltipWhenDisabled) {
    tooltip = tooltipWhenDisabled
  }

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        <span>{iconButton}</span>
      </Tooltip>
    )
  }

  return iconButton
}

export default PermissionIconButton