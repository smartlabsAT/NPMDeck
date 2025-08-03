import React, { useCallback, useMemo } from 'react'
import {
  Box,
  Stack,
  useTheme,
  Fade,
} from '@mui/material'

// Import split components
import DefaultStringItemComponent, { ArrayItemProps } from './ArrayItemComponent'
import ArrayFieldActions from './ArrayFieldActions'
import useArrayFieldLogic from './ArrayFieldLogic'
import { ArrayFieldManagerProps } from './ArrayFieldTypes'

/**
 * ArrayFieldManager - A comprehensive component for managing arrays of items
 * 
 * Features:
 * - Add, remove, reorder items
 * - Validation and error handling
 * - Drag and drop support
 * - Custom item components
 * - Type-safe with generics
 * - Configurable limits and behaviors
 * 
 * @example
 * ```tsx
 * <ArrayFieldManager
 *   value={domains}
 *   onChange={setDomains}
 *   label="Domain Names"
 *   defaultValue=""
 *   maxItems={10}
 *   validateItem={(domain) => domain.length > 0 ? null : 'Domain is required'}
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
  suggestions: _suggestions = [],
  allowDuplicates = true,
  EmptyComponent,
  AddButtonComponent,
  animationDuration = 200,
}: ArrayFieldManagerProps<T>) {
  const _theme = useTheme()

  // Use the custom hook for array logic
  const {
    handleAdd,
    handleRemove,
    handleUpdate,
    handleMoveUp,
    handleMoveDown,
    handleCopy,
    validationResults,
    hasValidationErrors,
  } = useArrayFieldLogic(value, onChange, validateItem, transformItem, allowDuplicates)

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
    return DefaultStringItemComponent as unknown as React.ComponentType<ArrayItemProps<T>>
  }, [ItemComponent, defaultValue])

  const SelectedItemComponent = getDefaultItemComponent()

  /**
   * Add new item
   */
  const handleAddItem = useCallback(() => {
    if (readonly || (maxItems && value.length >= maxItems)) return
    handleAdd(defaultValue)
  }, [readonly, maxItems, value.length, handleAdd, defaultValue])

  /**
   * Check constraints
   */
  const canAddMore = !maxItems || value.length < maxItems
  const _hasMinimumItems = value.length >= minItems

  /**
   * Memoized item list
   */
  const itemList = useMemo(() => {
    return value.map((item, index) => {
      const validation = validationResults[index] || { error: false, helperText: undefined }
      
      return (
        <Fade
          key={index}
          in={true}
          timeout={animationDuration}
        >
          <Box>
            <SelectedItemComponent
              value={item}
              index={index}
              onChange={(newValue) => handleUpdate(index, newValue)}
              onDelete={() => handleRemove(index)}
              onMoveUp={allowReorder && index > 0 ? () => handleMoveUp(index) : undefined}
              onMoveDown={allowReorder && index < value.length - 1 ? () => handleMoveDown(index) : undefined}
              onCopy={allowCopy && canAddMore ? () => handleCopy(index) : undefined}
              error={validation.error}
              helperText={validation.helperText}
              readonly={readonly}
              draggable={draggable}
            />
          </Box>
        </Fade>
      )
    })
  }, [
    value,
    validationResults,
    animationDuration,
    SelectedItemComponent,
    handleUpdate,
    handleRemove,
    handleMoveUp,
    handleMoveDown,
    handleCopy,
    allowReorder,
    allowCopy,
    canAddMore,
    readonly,
    draggable,
  ])

  return (
    <Box sx={{ ...sx }}>
      <ArrayFieldActions
        value={value}
        label={label}
        required={required}
        readonly={readonly}
        maxItems={maxItems}
        minItems={minItems}
        addButtonText={addButtonText}
        emptyPlaceholder={emptyPlaceholder}
        showIndices={showIndices}
        error={error || hasValidationErrors}
        helperText={helperText}
        onAdd={handleAddItem}
        EmptyComponent={EmptyComponent}
        AddButtonComponent={AddButtonComponent}
      />

      {/* Items List */}
      {value.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {itemList}
        </Stack>
      )}
    </Box>
  )
}