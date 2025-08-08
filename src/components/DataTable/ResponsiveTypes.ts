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
export interface ResponsiveTableColumn<T = any> extends TableColumn<T> {
  /** Priority level for responsive display */
  priority?: ColumnPriority
  
  /** Custom mobile label (shorter version for mobile) */
  mobileLabel?: string
  
  /** Whether to show in card view on mobile */
  showInCard?: boolean
  
  /** Custom card display component */
  cardDisplay?: (value: any, row: T) => React.ReactNode
  
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
  
  /** Breakpoint for switching to card layout (default: 'md') */
  cardBreakpoint?: 'sm' | 'md' | 'lg'
  
  /** Breakpoint for compact mode (default: 'lg') */
  compactBreakpoint?: 'md' | 'lg' | 'xl'
  
  /** Custom card renderer */
  renderCard?: (row: any, columns: ResponsiveTableColumn[]) => React.ReactNode
  
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
export interface ResponsiveTableProps<T = any> {
  columns: ResponsiveTableColumn<T>[]
  data: T[]
  config?: ResponsiveTableConfig
  // ... other DataTable props
  [key: string]: any
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
  
  switch (breakpoint) {
    case 'sm':
      return mode === 'mobile'
    case 'md':
      return mode === 'mobile'
    case 'lg':
      return mode === 'mobile' || mode === 'compact'
    default:
      return mode === 'mobile'
  }
}