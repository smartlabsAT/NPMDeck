import { useMemo, useCallback } from 'react'
import type { ProxyHost } from '../api/proxyHosts'
import type { Filter, FilterValue } from '../components/DataTable/types'
import { filterBySsl, filterByStatus } from '../utils/filterUtils'
import { SSL_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from '../constants/table'

interface UseProxyHostFiltersReturn {
  filters: Filter[]
  filterFunction: (item: ProxyHost, activeFilters: Record<string, FilterValue>) => boolean
}

/**
 * Custom hook that provides filter definitions and filter logic for proxy hosts DataTable.
 * Supports filtering by SSL status, access list, and enabled/disabled state.
 */
const useProxyHostFilters = (): UseProxyHostFiltersReturn => {
  const filters = useMemo<Filter[]>(() => [
    {
      id: 'ssl',
      label: 'SSL',
      type: 'select',
      defaultValue: 'all',
      options: [...SSL_FILTER_OPTIONS]
    },
    {
      id: 'access',
      label: 'Access',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'public', label: 'Public' },
        { value: 'restricted', label: 'Restricted' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: [...STATUS_FILTER_OPTIONS]
    }
  ], [])

  const filterFunction = useCallback((item: ProxyHost, activeFilters: Record<string, FilterValue>) => {
    if (!filterBySsl(item, activeFilters.ssl)) return false

    // Access filter (ProxyHost-specific)
    if (activeFilters.access && activeFilters.access !== 'all') {
      if (activeFilters.access === 'public' && item.access_list) return false
      if (activeFilters.access === 'restricted' && !item.access_list) return false
    }

    if (!filterByStatus(item, activeFilters.status)) return false

    return true
  }, [])

  return { filters, filterFunction }
}

export default useProxyHostFilters
