import { ReactNode } from 'react'
import { SxProps, Theme } from '@mui/material'
import { ArrayItemProps } from './ArrayItemComponent'

/**
 * Validation function for array items
 */
export type ArrayItemValidator<T> = (item: T, index: number, array: T[]) => string | null

/**
 * Transform function for processing items before display/editing
 */
export type ArrayItemTransformer<T> = (item: T) => T

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
  /** Whether items can be dragged */
  draggable?: boolean
  /** Whether to allow copying items */
  allowCopy?: boolean
  /** Whether to allow reordering items */
  allowReorder?: boolean
  /** Custom styles */
  sx?: SxProps<Theme>
  /** Whether the field has an error */
  error?: boolean
  /** Predefined suggestions for new items */
  suggestions?: T[]
  /** Whether to allow duplicate items */
  allowDuplicates?: boolean
  /** Custom empty state component */
  EmptyComponent?: React.ComponentType<{ onAdd: () => void }>
  /** Custom add button component */
  AddButtonComponent?: React.ComponentType<{ onAdd: () => void; disabled: boolean }>
  /** Animation duration in ms */
  animationDuration?: number
}