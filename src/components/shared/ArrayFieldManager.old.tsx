import React, { ReactNode, useCallback, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  Alert,
  Paper,
  Tooltip,
  InputAdornment,
  FormHelperText,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
} from '@mui/icons-material'

/**
 * Validation function for array items
 */
export type ArrayItemValidator<T> = (item: T, index: number, array: T[]) => string | null

/**
 * Transform function for processing items before display/editing
 */
export type ArrayItemTransformer<T> = (item: T) => T

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
 * Props for the ArrayFieldManager component
 */
export interface ArrayFieldManagerProps<T> {
  /** Array of values */
  value: T[]
  /** Change handler for the entire array */
  onChange: (value: T[]) => void
  /** Label for the field */
  label: string
  /** Help text */
  helperText?: string
  /** Whether the field is required */
  required?: boolean
  /** Whether the field is readonly */
  readonly?: boolean
  /** Maximum number of items allowed */
  maxItems?: number
  /** Minimum number of items required */
  minItems?: number
  /** Default value for new items */
  defaultValue: T
  /** Custom component for rendering items */
  ItemComponent?: React.ComponentType<ArrayItemProps<T>>
  /** Validation function for items */
  validateItem?: ArrayItemValidator<T>
  /** Transform function for items */
  transformItem?: ArrayItemTransformer<T>
  /** Placeholder text for empty state */
  emptyPlaceholder?: string
  /** Custom add button text */
  addButtonText?: string
  /** Whether to show item indices */
  showIndices?: boolean
  /** Whether items are draggable for reordering */
  draggable?: boolean
  /** Whether to show copy button for items */
  allowCopy?: boolean
  /** Whether to show move up/down buttons */
  allowReorder?: boolean
  /** Custom styling */
  sx?: any
  /** Error message for the entire field */
  error?: string
  /** Autocomplete suggestions for new items */
  suggestions?: T[]
  /** Whether to allow duplicates */
  allowDuplicates?: boolean
  /** Custom empty state component */
  EmptyComponent?: React.ComponentType
  /** Custom add button component */
  AddButtonComponent?: React.ComponentType<{ onClick: () => void; disabled: boolean }>
  /** Animation duration for adding/removing items */
  animationDuration?: number
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

/**
 * ArrayFieldManager - A comprehensive component for managing array fields
 * 
 * Features:
 * - Add, remove, and reorder items
 * - Item validation with error display
 * - Drag and drop reordering
 * - Copy/duplicate items
 * - Autocomplete suggestions
 * - Custom item components
 * - Empty state handling
 * - Min/max item limits
 * - Accessibility support
 * 
 * @example
 * ```tsx
 * // String array example
 * <ArrayFieldManager
 *   value={domains}
 *   onChange={setDomains}
 *   label="Domain Names"
 *   helperText="Enter domain names for this proxy host"
 *   defaultValue=""
 *   maxItems={10}
 *   required
 *   validateItem={(domain) => {
 *     if (!domain) return 'Domain name is required'
 *     if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return 'Invalid domain format'
 *     return null
 *   }}
 *   suggestions={recentDomains}
 *   allowCopy
 *   draggable
 * />
 * 
 * // Custom object array example
 * <ArrayFieldManager
 *   value={headers}
 *   onChange={setHeaders}
 *   label="Custom Headers"
 *   defaultValue={{ name: '', value: '' }}
 *   ItemComponent={CustomHeaderItem}
 *   maxItems={20}
 * />
 * ```
 */
export default function ArrayFieldManager<T = string>({
  value = [],
  onChange,
  label,
  helperText,
  required = false,
  readonly = false,
  maxItems,
  minItems = 0,
  defaultValue,
  ItemComponent,
  validateItem,
  transformItem,
  emptyPlaceholder = 'No items added yet',
  addButtonText = 'Add Item',
  showIndices = false,
  draggable = false,
  allowCopy = false,
  allowReorder = false,
  sx,
  error,
  suggestions = [],
  allowDuplicates = true,
  EmptyComponent,
  AddButtonComponent,
  animationDuration = 200,
}: ArrayFieldManagerProps<T>) {
  const theme = useTheme()

  /**
   * Get default item component based on type
   */
  const getDefaultItemComponent = useCallback(() => {
    if (ItemComponent) return ItemComponent
    
    // For string arrays, use the default string component
    if (typeof defaultValue === 'string') {
      return DefaultStringItemComponent as unknown as React.ComponentType<ArrayItemProps<T>>
    }
    
    // For other types, provide a generic component that handles any type
    const GenericItemComponent = (props: ArrayItemProps<T>) => {
      const { value, onChange, onDelete, error, helperText, readonly } = props
      return (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TextField
            value={JSON.stringify(value)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                // Invalid JSON, don't update
              }
            }}
            variant="outlined"
            size="small"
            fullWidth
            error={error}
            helperText={helperText}
            disabled={readonly}
          />
        </Paper>
      )
    }
    
    return GenericItemComponent
  }, [ItemComponent, defaultValue])

  const ItemComponentToUse = getDefaultItemComponent()

  /**
   * Validate individual items
   */
  const itemErrors = useMemo(() => {
    if (!validateItem) return {}
    
    const errors: Record<number, string> = {}
    value.forEach((item, index) => {
      const error = validateItem(item, index, value)
      if (error) {
        errors[index] = error
      }
    })
    return errors
  }, [value, validateItem])

  /**
   * Check if we can add more items
   */
  const canAddMore = useMemo(() => {
    if (readonly) return false
    if (maxItems && value.length >= maxItems) return false
    return true
  }, [readonly, maxItems, value.length])

  /**
   * Check for duplicates
   */
  const hasDuplicates = useMemo(() => {
    if (allowDuplicates) return false
    
    const stringified = value.map(item => JSON.stringify(item))
    return stringified.length !== new Set(stringified).size
  }, [value, allowDuplicates])

  /**
   * Add new item
   */
  const handleAdd = useCallback(() => {
    if (!canAddMore) return
    
    let newItem = defaultValue
    if (transformItem) {
      newItem = transformItem(newItem)
    }
    
    onChange([...value, newItem])
  }, [canAddMore, defaultValue, transformItem, onChange, value])

  /**
   * Remove item at index
   */
  const handleDelete = useCallback((index: number) => {
    if (readonly) return
    
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }, [readonly, value, onChange])

  /**
   * Update item at index
   */
  const handleItemChange = useCallback((index: number, newItem: T) => {
    if (readonly) return
    
    let processedItem = newItem
    if (transformItem) {
      processedItem = transformItem(processedItem)
    }
    
    const newValue = [...value]
    newValue[index] = processedItem
    onChange(newValue)
  }, [readonly, value, transformItem, onChange])

  /**
   * Move item up
   */
  const handleMoveUp = useCallback((index: number) => {
    if (readonly || index === 0) return
    
    const newValue = [...value]
    const temp = newValue[index]
    newValue[index] = newValue[index - 1]
    newValue[index - 1] = temp
    onChange(newValue)
  }, [readonly, value, onChange])

  /**
   * Move item down
   */
  const handleMoveDown = useCallback((index: number) => {
    if (readonly || index === value.length - 1) return
    
    const newValue = [...value]
    const temp = newValue[index]
    newValue[index] = newValue[index + 1]
    newValue[index + 1] = temp
    onChange(newValue)
  }, [readonly, value, onChange])

  /**
   * Copy item
   */
  const handleCopy = useCallback((index: number) => {
    if (!canAddMore) return
    
    let copiedItem = structuredClone ? structuredClone(value[index]) : JSON.parse(JSON.stringify(value[index]))
    if (transformItem) {
      copiedItem = transformItem(copiedItem)
    }
    
    const newValue = [...value]
    newValue.splice(index + 1, 0, copiedItem)
    onChange(newValue)
  }, [canAddMore, value, transformItem, onChange])

  /**
   * Get validation state
   */
  const hasErrors = Object.keys(itemErrors).length > 0 || !!error
  const isBelowMinItems = value.length < minItems

  return (
    <Box sx={{ ...sx }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: hasErrors ? 'error.main' : 'text.primary',
          }}
        >
          {label}
          {required && (
            <Typography
              component="span"
              sx={{ color: 'error.main', ml: 0.5 }}
            >
              *
            </Typography>
          )}
        </Typography>
        
        {helperText && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {helperText}
          </Typography>
        )}
        
        {/* Status indicators */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${value.length} item${value.length !== 1 ? 's' : ''}`}
            size="small"
            color={isBelowMinItems ? 'error' : 'default'}
          />
          
          {maxItems && (
            <Chip
              label={`Max: ${maxItems}`}
              size="small"
              variant="outlined"
            />
          )}
          
          {hasDuplicates && (
            <Chip
              label="Has duplicates"
              size="small"
              color="warning"
            />
          )}
        </Box>
      </Box>

      {/* Error messages */}
      {(error || isBelowMinItems) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || `At least ${minItems} item${minItems !== 1 ? 's' : ''} required`}
        </Alert>
      )}

      {/* Items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        {value.length === 0 ? (
          EmptyComponent ? (
            <EmptyComponent />
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.action.hover, 0.3),
                border: `2px dashed ${theme.palette.divider}`,
              }}
            >
              <Typography color="text.secondary">
                {emptyPlaceholder}
              </Typography>
            </Paper>
          )
        ) : (
          value.map((item, index) => (
            <Box
              key={`item-${index}`}
              sx={{
                transition: `all ${animationDuration}ms ease-in-out`,
                opacity: 1,
                transform: 'translateY(0)',
              }}
            >
              {showIndices && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Item {index + 1}
                </Typography>
              )}
              
              <ItemComponentToUse
                value={item}
                index={index}
                onChange={(newItem) => handleItemChange(index, newItem)}
                onDelete={() => handleDelete(index)}
                onMoveUp={allowReorder && index > 0 ? () => handleMoveUp(index) : undefined}
                onMoveDown={allowReorder && index < value.length - 1 ? () => handleMoveDown(index) : undefined}
                onCopy={allowCopy && canAddMore ? () => handleCopy(index) : undefined}
                error={!!itemErrors[index]}
                helperText={itemErrors[index]}
                readonly={readonly}
                draggable={draggable}
              />
            </Box>
          ))
        )}
      </Box>

      {/* Add button */}
      {!readonly && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {AddButtonComponent ? (
            <AddButtonComponent onClick={handleAdd} disabled={!canAddMore} />
          ) : (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              disabled={!canAddMore}
              sx={{
                borderStyle: 'dashed',
                '&:hover': {
                  borderStyle: 'solid',
                },
              }}
            >
              {addButtonText}
              {maxItems && ` (${value.length}/${maxItems})`}
            </Button>
          )}
        </Box>
      )}

      {/* Footer help text */}
      {(hasErrors || isBelowMinItems) && (
        <FormHelperText error sx={{ mt: 1 }}>
          {Object.keys(itemErrors).length > 0 && 
            `${Object.keys(itemErrors).length} item${Object.keys(itemErrors).length !== 1 ? 's' : ''} have errors`}
        </FormHelperText>
      )}
    </Box>
  )
}