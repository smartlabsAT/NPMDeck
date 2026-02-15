import React from 'react'
import {
  Box,
  Button,
  Typography,
  Alert,
  Chip,
  useTheme,
  alpha,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { FONT_WEIGHT } from '../../constants/layout'

interface ArrayFieldActionsProps<T> {
  value: T[]
  label: string
  required: boolean
  readonly: boolean
  maxItems?: number
  minItems: number
  addButtonText: string
  emptyPlaceholder: string
  showIndices: boolean
  error?: boolean
  helperText?: string
  onAdd: () => void
  EmptyComponent?: React.ComponentType<{ onAdd: () => void }>
  AddButtonComponent?: React.ComponentType<{ onAdd: () => void; disabled: boolean }>
}

const ArrayFieldActions = <T,>({
  value,
  label,
  required,
  readonly,
  maxItems,
  minItems,
  addButtonText,
  emptyPlaceholder,
  showIndices,
  error,
  helperText,
  onAdd,
  EmptyComponent,
  AddButtonComponent,
}: ArrayFieldActionsProps<T>) => {
  const theme = useTheme()

  const canAddMore = !maxItems || value.length < maxItems
  const hasMinimumItems = value.length >= minItems
  const isEmpty = value.length === 0

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="subtitle1"
            component="label"
            sx={{
              fontWeight: FONT_WEIGHT.MEDIUM,
              color: error ? 'error.main' : 'text.primary',
            }}
          >
            {label}
            {required && (
              <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
                *
              </Typography>
            )}
          </Typography>
          
          {showIndices && !isEmpty && (
            <Chip
              label={`${value.length} item${value.length !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
              }}
            />
          )}
        </Box>

        {/* Add Button */}
        {!readonly && canAddMore && (
          AddButtonComponent ? (
            <AddButtonComponent onAdd={onAdd} disabled={!canAddMore} />
          ) : (
            <Button
              startIcon={<AddIcon />}
              onClick={onAdd}
              variant="outlined"
              size="small"
              disabled={!canAddMore}
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.dark,
                },
              }}
            >
              {addButtonText}
            </Button>
          )
        )}
      </Box>

      {/* Helper Text */}
      {helperText && (
        <Typography
          variant="caption"
          color={error ? 'error.main' : 'text.secondary'}
          sx={{ mb: 2, display: 'block' }}
        >
          {helperText}
        </Typography>
      )}

      {/* Validation Messages */}
      {!hasMinimumItems && minItems > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          At least {minItems} item{minItems !== 1 ? 's are' : ' is'} required.
        </Alert>
      )}

      {maxItems && value.length >= maxItems && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Maximum of {maxItems} items allowed.
        </Alert>
      )}

      {/* Empty State */}
      {isEmpty && (
        EmptyComponent ? (
          <EmptyComponent onAdd={onAdd} />
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              px: 2,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {emptyPlaceholder}
            </Typography>
            {!readonly && canAddMore && (
              <Button
                startIcon={<AddIcon />}
                onClick={onAdd}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                {addButtonText}
              </Button>
            )}
          </Box>
        )
      )}
    </Box>
  )
}

export default ArrayFieldActions