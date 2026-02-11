import { Chip, ChipProps } from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as EnabledIcon,
  Cancel as DisabledIcon,
  Refresh as RenewedIcon,
} from '@mui/icons-material'

export type ActionType = 'created' | 'updated' | 'deleted' | 'enabled' | 'disabled' | 'renewed'

interface ActionChipProps extends Omit<ChipProps, 'icon' | 'color' | 'label'> {
  action: ActionType
  label?: string
}

const getActionIcon = (action: ActionType) => {
  switch (action) {
    case 'created':
      return <AddIcon fontSize="small" />
    case 'updated':
      return <EditIcon fontSize="small" />
    case 'deleted':
      return <DeleteIcon fontSize="small" />
    case 'enabled':
      return <EnabledIcon fontSize="small" />
    case 'disabled':
      return <DisabledIcon fontSize="small" />
    case 'renewed':
      return <RenewedIcon fontSize="small" />
    default:
      return null
  }
}

const getActionColor = (action: ActionType): 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default' => {
  switch (action) {
    case 'created':
      return 'success'
    case 'updated':
      return 'info'
    case 'deleted':
      return 'error'
    case 'enabled':
      return 'success'
    case 'disabled':
      return 'warning'
    case 'renewed':
      return 'info'
    default:
      return 'default'
  }
}

const ActionChip = ({ action, label, sx, ...props }: ActionChipProps) => {
  return (
    <Chip
      size="small"
      label={label || action}
      color={getActionColor(action)}
      icon={getActionIcon(action) || undefined}
      sx={{ textTransform: 'capitalize', ...sx }}
      {...props}
    />
  )
}

export default ActionChip