import { useState } from 'react'
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
        elevation={1}
        sx={{
          position: 'sticky',
          top: 64,
          zIndex: 10,
          mb: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={3} alignItems="center">
              <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 150 }}>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {selectedCount}
                </Typography>
                <Typography variant="body1" fontWeight="medium" whiteSpace="nowrap">
                  {selectedCount === 1 ? 'item selected' : 'items selected'}
                </Typography>
              </Box>
              
              <Box sx={{ height: 28, width: 1, backgroundColor: 'divider' }} />
              
              <Stack direction="row" spacing={1.5}>
                {actions.map((action) => {
                  const isDisabled = processing || (action.disabled && action.disabled(selectedItems))
                  const actionColor = action.color || 'primary'
                  
                  return (
                    <Button
                      key={action.id}
                      variant="contained"
                      size="small"
                      startIcon={action.icon}
                      onClick={() => handleAction(action)}
                      disabled={isDisabled}
                      color={actionColor}
                    >
                      {action.label}
                    </Button>
                  )
                })}
              </Stack>
            </Stack>
            
            <Tooltip title="Clear selection">
              <IconButton
                size="small"
                onClick={onClearSelection}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
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