import { TableColumn } from './types'

/**
 * Column priority levels for responsive behavior
 * P1: Essential - Always visible
 * P2: Important - Hidden on mobile
 * P3: Optional - Hidden on tablet and mobile
 */
export type ColumnPriority = 'P1' | 'P2' | 'P3'

/**
 * Extended column definition with responsive properties
 */
export interface ResponsiveTableColumn<T = object> extends TableColumn<T> {
  /** Priority level for responsive display */
  priority?: ColumnPriority
  
  /** Custom mobile label (shorter version for mobile) */
  mobileLabel?: string
  
  /** Whether to show in card view on mobile */
  showInCard?: boolean
  
  /** Custom card display component */
  cardDisplay?: (value: unknown, row: T) => React.ReactNode
  
  /** Minimum width in pixels (for table view) */
  minWidth?: number
  
  /** Whether this column should stack vertically on mobile */
  mobileStack?: boolean
}

/**
 * Configuration for responsive table behavior
 */
export interface ResponsiveTableConfig {
  /** Enable responsive mode */
  responsive?: boolean
  
  /** Breakpoint for switching to card layout (default: 'md') - can be predefined or custom pixel value */
  cardBreakpoint?: 'sm' | 'md' | 'lg' | 'xl' | number
  
  /** Breakpoint for compact mode (default: 'lg') - can be predefined or custom pixel value */
  compactBreakpoint?: 'sm' | 'md' | 'lg' | 'xl' | number
  
  /** Custom card renderer */
  renderCard?: (row: unknown, columns: ResponsiveTableColumn[]) => React.ReactNode
  
  /** Show column priority badges in header */
  showPriorityBadges?: boolean
  
  /** Enable column visibility toggle menu */
  enableColumnToggle?: boolean
  
  /** Columns that should always be visible */
  stickyColumns?: string[]
}

/**
 * Props for responsive table wrapper
 */
export interface ResponsiveTableProps<T = object> {
  columns: ResponsiveTableColumn<T>[]
  data: T[]
  config?: ResponsiveTableConfig
}

/**
 * Helper to filter columns by current breakpoint
 */
export function getVisibleColumns<T>(
  columns: ResponsiveTableColumn<T>[],
  mode: 'mobile' | 'compact' | 'full'
): ResponsiveTableColumn<T>[] {
  if (mode === 'full') {
    return columns
  }
  
  if (mode === 'compact') {
    // Show P1 and P2 columns
    return columns.filter(col => 
      !col.priority || col.priority === 'P1' || col.priority === 'P2'
    )
  }
  
  // Mobile: Only show P1 columns
  return columns.filter(col => 
    !col.priority || col.priority === 'P1'
  )
}

/**
 * Helper to determine if we should use card layout
 */
export function shouldUseCardLayout(
  mode: 'mobile' | 'compact' | 'full',
  config?: ResponsiveTableConfig
): boolean {
  if (!config?.responsive) return false
  
  const breakpoint = config.cardBreakpoint || 'md'
  
  // If breakpoint is a number, we'll use a simple comparison
  // For now, treat numeric breakpoints as mobile-only since mode is already determined
  if (typeof breakpoint === 'number') {
    // The mode is already calculated based on screen width in useResponsiveMode
    // So we just check if we're in mobile mode
    return mode === 'mobile'
  }
  
  switch (breakpoint) {
    case 'sm':
      return mode === 'mobile'
    case 'md':
      return mode === 'mobile'
    case 'lg':
      return mode === 'mobile' || mode === 'compact'
    case 'xl':
      return mode === 'mobile' || mode === 'compact'
    default:
      return mode === 'mobile'
  }
}