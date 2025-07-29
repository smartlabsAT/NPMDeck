import React, { ReactNode } from 'react'
import {
  Box,
  IconButton,
  TextField,
  Paper,
  Tooltip,
  InputAdornment,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
} from '@mui/icons-material'

/**
 * Props for individual array item components
 */
export interface ArrayItemProps<T> {
  /** Item value */
  value: T
  /** Item index in array */
  index: number
  /** Change handler */
  onChange: (value: T) => void
  /** Delete handler */
  onDelete: () => void
  /** Move up handler */
  onMoveUp?: () => void
  /** Move down handler */
  onMoveDown?: () => void
  /** Copy handler */
  onCopy?: () => void
  /** Whether item has validation error */
  error?: boolean
  /** Error message */
  helperText?: string
  /** Whether item is readonly */
  readonly?: boolean
  /** Whether to show drag handle */
  draggable?: boolean
  /** Additional actions */
  actions?: ReactNode
}

/**
 * Default item component for string arrays
 */
function DefaultStringItemComponent({
  value,
  index,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onCopy,
  error,
  helperText,
  readonly,
  draggable,
  actions,
}: ArrayItemProps<string>) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      {draggable && (
        <DragIcon sx={{ color: 'text.secondary', cursor: 'grab' }} />
      )}

      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        variant="outlined"
        size="small"
        fullWidth
        error={error}
        helperText={helperText}
        disabled={readonly}
        InputProps={{
          endAdornment: readonly ? undefined : (
            <InputAdornment position="end">
              <Tooltip title="Clear">
                <IconButton
                  size="small"
                  onClick={() => onChange('')}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {onMoveUp && (
          <Tooltip title="Move up">
            <IconButton size="small" onClick={onMoveUp}>
              <MoveUpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {onMoveDown && (
          <Tooltip title="Move down">
            <IconButton size="small" onClick={onMoveDown}>
              <MoveDownIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {onCopy && (
          <Tooltip title="Copy">
            <IconButton size="small" onClick={onCopy}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {actions}
        
        {!readonly && (
          <Tooltip title="Delete">
            <IconButton size="small" onClick={onDelete} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  )
}

export default DefaultStringItemComponent