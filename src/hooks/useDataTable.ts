import { useState, useMemo, useCallback } from 'react'
import { UseDataTableOptions, UseDataTableReturn, TableColumn } from '../components/DataTable/types'

export function useDataTable<T>(
  data: T[],
  columns: TableColumn<T>[],
  keyExtractor: (item: T) => string | number,
  options?: UseDataTableOptions
): UseDataTableReturn<T> {
  // State
  const [sortField, setSortField] = useState<string | undefined>(options?.defaultSortField)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    options?.defaultSortDirection || 'asc'
  )
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(options?.defaultRowsPerPage || 10)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>(options?.defaultFilters || {})
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        return columns.some((column) => {
          const value = column.accessor(item)
          if (value == null) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    // Apply filters
    Object.entries(filters).forEach(([filterId, filterValue]) => {
      if (filterValue === '' || filterValue === 'all' || filterValue == null) return
      
      result = result.filter((item) => {
        // Special handling for certain filters
        if (filterId === 'roles') {
          const roles = (item as any).roles as string[]
          if (filterValue === 'admin') {
            return roles.includes('admin')
          }
          if (filterValue === 'user') {
            // Non-admin users
            return !roles.includes('admin')
          }
          return true
        }
        
        if (filterId === 'is_disabled') {
          const isDisabled = (item as any).is_disabled
          return String(isDisabled) === filterValue
        }
        
        // Find column with matching filter ID
        const column = columns.find(col => col.id === filterId)
        if (!column) return true
        
        const value = column.accessor(item)
        
        // Handle different filter types
        if (Array.isArray(filterValue)) {
          return filterValue.includes(value)
        }
        
        return value === filterValue
      })
    })

    return result
  }, [data, searchQuery, filters, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData

    const column = columns.find(col => col.id === sortField)
    if (!column || !column.sortable) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = column.accessor(a)
      const bValue = column.accessor(b)

      if (aValue == null) return 1
      if (bValue == null) return -1

      let comparison = 0
      if (aValue < bValue) comparison = -1
      if (aValue > bValue) comparison = 1

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortField, sortDirection, columns])

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage
    const end = start + rowsPerPage
    return sortedData.slice(start, end)
  }, [sortedData, page, rowsPerPage])

  // Selected items
  const selected = useMemo(() => {
    return data.filter(item => selectedIds.has(keyExtractor(item)))
  }, [data, selectedIds, keyExtractor])

  // Computed values
  const totalCount = filteredData.length
  const selectedCount = selected.length
  const pageItemsCount = paginatedData.length
  const pageSelectedCount = paginatedData.filter(
    item => selectedIds.has(keyExtractor(item))
  ).length
  const isAllSelected = pageItemsCount > 0 && pageSelectedCount === pageItemsCount
  const isIndeterminate = pageSelectedCount > 0 && pageSelectedCount < pageItemsCount

  // Handlers
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(0) // Reset to first page on sort
  }, [sortField])

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage)
  }, [])

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setPage(0)
  }, [])

  const handleFilter = useCallback((filterId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value
    }))
    setPage(0)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    setPage(0)
  }, [])

  const handleSelect = useCallback((item: T) => {
    const id = keyExtractor(item)
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [keyExtractor])

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      // Deselect all on current page
      const pageIds = paginatedData.map(item => keyExtractor(item))
      setSelectedIds(prev => {
        const next = new Set(prev)
        pageIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      // Select all on current page
      const pageIds = paginatedData.map(item => keyExtractor(item))
      setSelectedIds(prev => {
        const next = new Set(prev)
        pageIds.forEach(id => next.add(id))
        return next
      })
    }
  }, [isAllSelected, paginatedData, keyExtractor])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const resetTable = useCallback(() => {
    setSortField(options?.defaultSortField)
    setSortDirection(options?.defaultSortDirection || 'asc')
    setPage(0)
    setRowsPerPage(options?.defaultRowsPerPage || 10)
    setSearchQuery('')
    setFilters(options?.defaultFilters || {})
    setSelectedIds(new Set())
  }, [options])

  return {
    // State
    sortField,
    sortDirection,
    page,
    rowsPerPage,
    searchQuery,
    filters,
    selected,
    
    // Computed
    processedData: sortedData,
    paginatedData,
    totalCount,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    
    // Handlers
    handleSort,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearch,
    handleFilter,
    handleClearFilters,
    handleSelect,
    handleSelectAll,
    handleClearSelection,
    
    // Reset
    resetTable
  }
}