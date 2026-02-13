import { useState, useMemo, useCallback } from 'react'
import { UseDataTableOptions, UseDataTableReturn, TableColumn, DataGroup, GroupConfig } from '../components/DataTable/types'
import { STORAGE_KEYS } from '../constants/storage'

export function useDataTable<T extends object>(
  data: T[],
  columns: TableColumn<T>[],
  keyExtractor: (item: T) => string | number,
  options?: UseDataTableOptions<T>,
  groupConfig?: GroupConfig<T>
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
  const [groupingEnabled, setGroupingEnabled] = useState(groupConfig?.defaultEnabled ?? false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        // First check standard column values
        const matchesColumn = columns.some((column) => {
          const value = column.accessor(item)
          if (value == null) return false
          return String(value).toLowerCase().includes(query)
        })
        
        if (matchesColumn) return true
        
        // Special search for Access Lists - search in nested items
        if ('items' in item && Array.isArray((item as any).items)) {
          const matchesUser = (item as any).items.some((user: any) => 
            user.username?.toLowerCase().includes(query)
          )
          if (matchesUser) return true
        }
        
        if ('clients' in item && Array.isArray((item as any).clients)) {
          const matchesClient = (item as any).clients.some((client: any) => 
            client.address?.includes(searchQuery) // IP addresses are case-sensitive
          )
          if (matchesClient) return true
        }
        
        return false
      })
    }

    // Apply filters
    if (options?.filterFunction) {
      // Use custom filter function if provided
      result = result.filter((item) => options.filterFunction!(item, filters))
    } else {
      // Use default filter logic
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
        
        // Access Lists specific filters
        if (filterId === 'hasUsers') {
          const users = (item as any).items as any[] | undefined
          const userCount = users?.length || 0
          if (filterValue === 'with-users') {
            return userCount > 0
          }
          if (filterValue === 'no-users') {
            return userCount === 0
          }
          return true
        }
        
        if (filterId === 'hasRules') {
          const clients = (item as any).clients as any[] | undefined
          const ruleCount = clients?.length || 0
          if (filterValue === 'with-rules') {
            return ruleCount > 0
          }
          if (filterValue === 'no-rules') {
            return ruleCount === 0
          }
          return true
        }
        
        // Certificate specific filters
        if (filterId === 'provider') {
          const provider = (item as any).provider
          if (filterValue === 'letsencrypt') {
            return provider === 'letsencrypt'
          }
          if (filterValue === 'other') {
            return provider !== 'letsencrypt'
          }
          return true
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
    }

    return result
  }, [data, searchQuery, filters, columns, options?.filterFunction])

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

  // Group data if grouping is enabled
  const groups = useMemo<DataGroup<T>[]>(() => {
    if (!groupingEnabled || !groupConfig) return []

    const groupMap = new Map<string, T[]>()
    
    // Group items
    sortedData.forEach(item => {
      const groupId = groupConfig.groupBy(item)
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, [])
      }
      groupMap.get(groupId)!.push(item)
    })

    // Convert to DataGroup array
    return Array.from(groupMap.entries()).map(([groupId, items]) => ({
      id: groupId,
      label: groupConfig.groupLabel(groupId, items),
      items,
      isExpanded: groupConfig.defaultExpanded !== false ? 
        (expandedGroups.has(groupId) ? false : true) : 
        expandedGroups.has(groupId)
    }))
  }, [sortedData, groupingEnabled, groupConfig, expandedGroups])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (groupingEnabled && groups.length > 0) {
      // When grouping is enabled, we need to flatten the expanded groups
      const flattenedItems: T[] = []
      groups.forEach(group => {
        if (group.isExpanded) {
          flattenedItems.push(...group.items)
        }
      })
      const start = page * rowsPerPage
      const end = start + rowsPerPage
      return flattenedItems.slice(start, end)
    } else {
      const start = page * rowsPerPage
      const end = start + rowsPerPage
      return sortedData.slice(start, end)
    }
  }, [sortedData, page, rowsPerPage, groupingEnabled, groups])

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

  const handleToggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  const handleToggleAllGroups = useCallback((expanded: boolean) => {
    if (expanded) {
      setExpandedGroups(new Set())
    } else {
      const allGroupIds = groups.map(g => g.id)
      setExpandedGroups(new Set(allGroupIds))
    }
  }, [groups])

  const handleToggleGrouping = useCallback(() => {
    setGroupingEnabled(prev => {
      const newValue = !prev
      // Save to localStorage if we have a groupConfig
      if (groupConfig) {
        localStorage.setItem(STORAGE_KEYS.CERT_GROUP_BY_DOMAIN, newValue.toString())
      }
      return newValue
    })
    setPage(0) // Reset to first page when toggling grouping
  }, [groupConfig])

  const resetTable = useCallback(() => {
    setSortField(options?.defaultSortField)
    setSortDirection(options?.defaultSortDirection || 'asc')
    setPage(0)
    setRowsPerPage(options?.defaultRowsPerPage || 10)
    setSearchQuery('')
    setFilters(options?.defaultFilters || {})
    setSelectedIds(new Set())
    setGroupingEnabled(groupConfig?.defaultEnabled ?? false)
    setExpandedGroups(new Set())
  }, [options, groupConfig])

  return {
    // State
    sortField,
    sortDirection,
    page,
    rowsPerPage,
    searchQuery,
    filters,
    selected,
    groupingEnabled,
    
    // Computed
    processedData: sortedData,
    paginatedData,
    groups,
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
    handleToggleGroup,
    handleToggleAllGroups,
    handleToggleGrouping,
    
    // Reset
    resetTable
  }
}