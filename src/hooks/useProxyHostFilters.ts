import { useMemo, useCallback } from 'react'
import type { ProxyHost } from '../api/proxyHosts'
import type { Filter, FilterValue } from '../components/DataTable/types'

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
      options: [
        { value: 'all', label: 'All' },
        { value: 'forced', label: 'SSL Forced' },
        { value: 'optional', label: 'SSL Optional' },
        { value: 'disabled', label: 'No SSL' }
      ]
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
      options: [
        { value: 'all', label: 'All' },
        { value: 'enabled', label: 'Enabled' },
        { value: 'disabled', label: 'Disabled' }
      ]
    }
  ], [])

  const filterFunction = useCallback((item: ProxyHost, activeFilters: Record<string, FilterValue>) => {
    // SSL filter
    if (activeFilters.ssl && activeFilters.ssl !== 'all') {
      if (activeFilters.ssl === 'forced' && (!item.certificate_id || !item.ssl_forced)) return false
      if (activeFilters.ssl === 'optional' && (!item.certificate_id || item.ssl_forced)) return false
      if (activeFilters.ssl === 'disabled' && item.certificate_id) return false
    }

    // Access filter
    if (activeFilters.access && activeFilters.access !== 'all') {
      if (activeFilters.access === 'public' && item.access_list) return false
      if (activeFilters.access === 'restricted' && !item.access_list) return false
    }

    // Status filter
    if (activeFilters.status && activeFilters.status !== 'all') {
      if (activeFilters.status === 'enabled' && !item.enabled) return false
      if (activeFilters.status === 'disabled' && item.enabled) return false
    }

    return true
  }, [])

  return { filters, filterFunction }
}

export default useProxyHostFilters
