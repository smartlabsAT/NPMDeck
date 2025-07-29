import { useCallback, useMemo } from 'react'
import { ArrayItemValidator, ArrayItemTransformer } from './ArrayFieldTypes'

/**
 * Custom hook for array field logic and validation
 */
export const useArrayFieldLogic = <T,>(
  value: T[],
  onChange: (value: T[]) => void,
  validateItem?: ArrayItemValidator<T>,
  transformItem?: ArrayItemTransformer<T>,
  allowDuplicates = true
) => {
  /**
   * Add a new item to the array
   */
  const handleAdd = useCallback((newItem: T) => {
    const processedItem = transformItem ? transformItem(newItem) : newItem
    
    // Check for duplicates if not allowed
    if (!allowDuplicates && value.some(item => 
      JSON.stringify(item) === JSON.stringify(processedItem)
    )) {
      return false // Item already exists
    }
    
    onChange([...value, processedItem])
    return true
  }, [value, onChange, transformItem, allowDuplicates])

  /**
   * Remove an item at a specific index
   */
  const handleRemove = useCallback((index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }, [value, onChange])

  /**
   * Update an item at a specific index
   */
  const handleUpdate = useCallback((index: number, newItem: T) => {
    const processedItem = transformItem ? transformItem(newItem) : newItem
    const newValue = [...value]
    newValue[index] = processedItem
    onChange(newValue)
  }, [value, onChange, transformItem])

  /**
   * Move an item up in the array
   */
  const handleMoveUp = useCallback((index: number) => {
    if (index > 0) {
      const newValue = [...value]
      const temp = newValue[index]
      newValue[index] = newValue[index - 1]
      newValue[index - 1] = temp
      onChange(newValue)
    }
  }, [value, onChange])

  /**
   * Move an item down in the array
   */
  const handleMoveDown = useCallback((index: number) => {
    if (index < value.length - 1) {
      const newValue = [...value]
      const temp = newValue[index]
      newValue[index] = newValue[index + 1]
      newValue[index + 1] = temp
      onChange(newValue)
    }
  }, [value, onChange])

  /**
   * Copy an item at a specific index
   */
  const handleCopy = useCallback((index: number) => {
    const itemToCopy = value[index]
    const processedItem = transformItem ? transformItem(itemToCopy) : itemToCopy
    onChange([...value, processedItem])
  }, [value, onChange, transformItem])

  /**
   * Validate all items and return validation results
   */
  const validationResults = useMemo(() => {
    if (!validateItem) return []
    
    return value.map((item, index) => {
      const error = validateItem(item, index, value)
      return {
        error: !!error,
        helperText: error || undefined,
      }
    })
  }, [value, validateItem])

  /**
   * Check if the array has any validation errors
   */
  const hasValidationErrors = useMemo(() => {
    return validationResults.some(result => result.error)
  }, [validationResults])

  return {
    handleAdd,
    handleRemove,
    handleUpdate,
    handleMoveUp,
    handleMoveDown,
    handleCopy,
    validationResults,
    hasValidationErrors,
  }
}

export default useArrayFieldLogic