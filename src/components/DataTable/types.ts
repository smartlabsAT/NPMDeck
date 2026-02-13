import { ReactNode } from 'react'

export type FilterValue = string | number | boolean | string[] | null | undefined

export interface TableColumn<T> {
  id: string
  label: string
  icon?: ReactNode
  accessor: (item: T) => unknown
  sortable?: boolean
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, item: T) => ReactNode
  headerRender?: () => ReactNode
}

export interface Filter {
  id: string
  label: string
  type: 'select' | 'checkbox' | 'date' | 'text'
  options?: FilterOption[]
  defaultValue?: FilterValue
}

export interface FilterOption {
  value: string | number
  label: string
  icon?: ReactNode
}

export interface BulkAction<T> {
  id: string
  label: string
  icon?: ReactNode
  action: (items: T[]) => Promise<void>
  confirmMessage?: string
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  disabled?: (items: T[]) => boolean
}

export interface GroupConfig<T> {
  /** Function to determine which group an item belongs to */
  groupBy: (item: T) => string
  /** Function to get display name for a group */
  groupLabel: (groupId: string, items: T[]) => ReactNode
  /** Whether grouping is enabled by default */
  defaultEnabled?: boolean
  /** Whether groups are expanded by default */
  defaultExpanded?: boolean
  /** Custom group header renderer */
  groupHeaderRender?: (groupId: string, items: T[], isExpanded: boolean) => ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  keyExtractor: (item: T) => string | number
  onRowClick?: (item: T) => void
  bulkActions?: BulkAction<T>[]
  filters?: Filter[]
  filterFunction?: (item: T, activeFilters: Record<string, FilterValue>) => boolean
  searchPlaceholder?: string
  searchFields?: string[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  stickyHeader?: boolean
  defaultSortField?: string
  defaultSortDirection?: 'asc' | 'desc'
  defaultRowsPerPage?: number
  rowsPerPageOptions?: number[]
  selectable?: boolean
  searchable?: boolean
  showPagination?: boolean
  dense?: boolean
  groupConfig?: GroupConfig<T>
  showGroupToggle?: boolean
  // Responsive settings
  responsive?: boolean
  cardBreakpoint?: 'sm' | 'md' | 'lg' | 'xl' | number
  compactBreakpoint?: 'sm' | 'md' | 'lg' | 'xl' | number
  renderCard?: (item: T, columns: TableColumn<T>[], options: { isSelected: boolean; onSelect: () => void; onRowClick?: () => void }) => ReactNode
}

export interface DataTableState {
  sortField?: string
  sortDirection: 'asc' | 'desc'
  page: number
  rowsPerPage: number
  searchQuery: string
  filters: Record<string, FilterValue>
  selected: (string | number)[]
  groupingEnabled: boolean
  expandedGroups: Set<string>
}

export interface UseDataTableOptions<T = object> {
  defaultSortField?: string
  defaultSortDirection?: 'asc' | 'desc'
  defaultRowsPerPage?: number
  defaultFilters?: Record<string, FilterValue>
  filterFunction?: (item: T, activeFilters: Record<string, FilterValue>) => boolean
  searchFields?: string[]
}

export interface DataGroup<T> {
  id: string
  label: ReactNode
  items: T[]
  isExpanded: boolean
}

export interface UseDataTableReturn<T> {
  // State
  sortField?: string
  sortDirection: 'asc' | 'desc'
  page: number
  rowsPerPage: number
  searchQuery: string
  filters: Record<string, FilterValue>
  selected: T[]
  groupingEnabled: boolean
  
  // Computed
  processedData: T[]
  paginatedData: T[]
  groups: DataGroup<T>[]
  totalCount: number
  selectedCount: number
  isAllSelected: boolean
  isIndeterminate: boolean
  
  // Handlers
  handleSort: (field: string) => void
  handleChangePage: (event: unknown, newPage: number) => void
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleSearch: (query: string) => void
  handleFilter: (filterId: string, value: FilterValue) => void
  handleClearFilters: () => void
  handleSelect: (item: T) => void
  handleSelectAll: () => void
  handleClearSelection: () => void
  handleToggleGroup: (groupId: string) => void
  handleToggleAllGroups: (expanded: boolean) => void
  handleToggleGrouping: () => void
  
  // Reset
  resetTable: () => void
}