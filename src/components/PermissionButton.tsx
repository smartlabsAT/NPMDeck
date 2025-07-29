import { Button, ButtonProps, Tooltip } from '@mui/material'
import { useAuthStore } from '../stores/authStore'
import { Resource, PermissionLevel } from '../types/permissions'

interface PermissionButtonProps extends Omit<ButtonProps, 'action'> {
  resource: Resource
  level?: PermissionLevel
  permissionAction?: 'view' | 'create' | 'edit' | 'delete'
  hideWhenUnauthorized?: boolean
  tooltipWhenDisabled?: string
}

const PermissionButton: React.FC<PermissionButtonProps> = ({
  resource,
  level,
  permissionAction,
  hideWhenUnauthorized = false,
  tooltipWhenDisabled = 'Sie haben nicht die erforderlichen Berechtigungen für diese Aktion',
  children,
  disabled,
  ...buttonProps
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

  const button = (
    <Button
      {...buttonProps}
      disabled={isDisabled}
    >
      {children}
    </Button>
  )

  if (!hasRequiredPermission && tooltipWhenDisabled) {
    return (
      <Tooltip title={tooltipWhenDisabled}>
        <span>{button}</span>
      </Tooltip>
    )
  }

  return button
}

export default PermissionButton