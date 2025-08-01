import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material'
import {
  Close as CloseIcon,
} from '@mui/icons-material'
import { BulkAction } from './types'
import ConfirmDialog from '../ConfirmDialog'

interface DataTableBulkActionsProps<T> {
  selectedCount: number
  actions: BulkAction<T>[]
  selectedItems: T[]
  onClearSelection: () => void
}

export default function DataTableBulkActions<T>({
  selectedCount,
  actions,
  selectedItems,
  onClearSelection,
}: DataTableBulkActionsProps<T>) {
  const [confirmAction, setConfirmAction] = useState<BulkAction<T> | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleAction = async (action: BulkAction<T>) => {
    if (action.confirmMessage) {
      setConfirmAction(action)
    } else {
      await executeAction(action)
    }
  }

  const executeAction = async (action: BulkAction<T>) => {
    setProcessing(true)
    try {
      await action.action(selectedItems)
      onClearSelection()
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setProcessing(false)
      setConfirmAction(null)
    }
  }

  const handleConfirm = async () => {
    if (confirmAction) {
      await executeAction(confirmAction)
    }
  }

  const getConfirmMessage = () => {
    if (!confirmAction?.confirmMessage) return ''
    return confirmAction.confirmMessage.replace('{count}', selectedCount.toString())
  }

  return (
    <>
      <Paper
        sx={{
          position: 'sticky',
          top: 64,
          zIndex: 10,
          mb: 2,
          p: 2,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="subtitle1" fontWeight="medium">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </Typography>
            <Box sx={{ height: 24, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="contained"
                size="small"
                startIcon={action.icon}
                onClick={() => handleAction(action)}
                disabled={processing || (action.disabled && action.disabled(selectedItems))}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                  ...(action.color === 'error' && {
                    backgroundColor: 'error.dark',
                    '&:hover': {
                      backgroundColor: 'error.main',
                    },
                  }),
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
          <Tooltip title="Clear selection">
            <IconButton
              size="small"
              onClick={onClearSelection}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.label || ''}
        message={getConfirmMessage()}
        confirmText={confirmAction?.label || 'Confirm'}
        confirmColor={confirmAction?.color === 'error' ? 'error' : 'primary'}
        loading={processing}
      />
    </>
  )
}