import { ReactNode } from 'react'

export interface TableColumn<T> {
  id: string
  label: string
  icon?: ReactNode
  accessor: (item: T) => any
  sortable?: boolean
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, item: T) => ReactNode
  headerRender?: () => ReactNode
}

export interface Filter {
  id: string
  label: string
  type: 'select' | 'checkbox' | 'date' | 'text'
  options?: FilterOption[]
  defaultValue?: any
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

export interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  keyExtractor: (item: T) => string | number
  onRowClick?: (item: T) => void
  bulkActions?: BulkAction<T>[]
  filters?: Filter[]
  searchPlaceholder?: string
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
}

export interface DataTableState {
  sortField?: string
  sortDirection: 'asc' | 'desc'
  page: number
  rowsPerPage: number
  searchQuery: string
  filters: Record<string, any>
  selected: (string | number)[]
}

export interface UseDataTableOptions {
  defaultSortField?: string
  defaultSortDirection?: 'asc' | 'desc'
  defaultRowsPerPage?: number
  defaultFilters?: Record<string, any>
}

export interface UseDataTableReturn<T> {
  // State
  sortField?: string
  sortDirection: 'asc' | 'desc'
  page: number
  rowsPerPage: number
  searchQuery: string
  filters: Record<string, any>
  selected: T[]
  
  // Computed
  processedData: T[]
  paginatedData: T[]
  totalCount: number
  selectedCount: number
  isAllSelected: boolean
  isIndeterminate: boolean
  
  // Handlers
  handleSort: (field: string) => void
  handleChangePage: (event: unknown, newPage: number) => void
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleSearch: (query: string) => void
  handleFilter: (filterId: string, value: any) => void
  handleClearFilters: () => void
  handleSelect: (item: T) => void
  handleSelectAll: () => void
  handleClearSelection: () => void
  
  // Reset
  resetTable: () => void
}