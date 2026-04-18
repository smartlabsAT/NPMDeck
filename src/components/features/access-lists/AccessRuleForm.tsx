import React from 'react'
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  IconButton,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material'
import type { ArrayItemProps } from '../../shared/ArrayItemComponent'
import { validateIpCidr } from '../../../utils/ipValidation'

export interface AccessRule {
  address: string
  directive: 'allow' | 'deny'
}

const AccessRuleForm = React.memo(({ value, onChange, onDelete, onMoveUp, onMoveDown }: ArrayItemProps<AccessRule>) => {
  const error = validateIpCidr(value.address)

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start'
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
        <TextField
          label="IP Address or Range"
          value={value.address}
          onChange={(e) => {
            onChange({ ...value, address: e.target.value })
          }}
          error={!!error}
          helperText={error || "Examples: 192.168.1.0/24, 10.0.0.5, all"}
          fullWidth
          required
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={value.directive}
            onChange={(e) => {
              onChange({ ...value, directive: e.target.value })
            }}
            label="Action"
          >
            <MenuItem value="allow">Allow</MenuItem>
            <MenuItem value="deny">Deny</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {onMoveUp && (
          <IconButton
            size="small"
            onClick={onMoveUp}
            title="Move up"
            disabled={!onMoveUp}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
        )}
        {onMoveDown && (
          <IconButton
            size="small"
            onClick={onMoveDown}
            title="Move down"
            disabled={!onMoveDown}
          >
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton
          size="small"
          onClick={onDelete}
          color="error"
          title="Delete rule"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  )
})

AccessRuleForm.displayName = 'AccessRuleForm'

export default AccessRuleForm
