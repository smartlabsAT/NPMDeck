import React from 'react'
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from '@mui/material'
import {
  VisibilityOff as HiddenIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import type { PermissionLevel } from './types'

/**
 * Props for the PermissionToggleRow component
 */
interface PermissionToggleRowProps {
  /** Permission key identifier */
  permissionKey: string
  /** Display label for the permission */
  label: string
  /** Icon displayed next to the label */
  icon: React.ReactNode
  /** Current permission level */
  value: PermissionLevel
  /** Callback when permission level changes */
  onChange: (value: PermissionLevel) => void
  /** Whether the toggle is disabled */
  disabled?: boolean
}

/**
 * Returns the icon for a given permission level
 */
const getPermissionIcon = (level: PermissionLevel): React.ReactNode => {
  switch (level) {
    case 'hidden': return <HiddenIcon fontSize="small" />
    case 'view': return <ViewIcon fontSize="small" />
    case 'manage': return <EditIcon fontSize="small" />
  }
}

/**
 * PermissionToggleRow - A single row in the feature permissions section
 *
 * Renders an icon + label on the left and a ToggleButtonGroup
 * with hidden/view/manage options on the right.
 */
const PermissionToggleRow = ({
  permissionKey,
  label,
  icon,
  value,
  onChange,
  disabled = false,
}: PermissionToggleRowProps) => {
  return (
    <Grid size={12} key={permissionKey}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5
          }}>
          {icon}
          <Typography variant="body2" sx={{
            fontWeight: "medium"
          }}>
            {label}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={value}
          exclusive
          onChange={(_, newValue) => newValue && onChange(newValue as PermissionLevel)}
          disabled={disabled}
          size="small"
        >
          <ToggleButton value="hidden" sx={{ px: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5
              }}>
              {getPermissionIcon('hidden')}
              <Typography variant="caption">Hidden</Typography>
            </Box>
          </ToggleButton>
          <ToggleButton value="view" sx={{ px: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5
              }}>
              {getPermissionIcon('view')}
              <Typography variant="caption">View</Typography>
            </Box>
          </ToggleButton>
          <ToggleButton value="manage" sx={{ px: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5
              }}>
              {getPermissionIcon('manage')}
              <Typography variant="caption">Manage</Typography>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Grid>
  )
}

export default PermissionToggleRow
