import { useMemo, useCallback } from 'react'
import type { RedirectionHost } from '../api/redirectionHosts'
import type { Filter, FilterValue } from '../components/DataTable/types'
import { filterBySsl, filterByStatus } from '../utils/filterUtils'

interface UseRedirectionHostFiltersReturn {
  filters: Filter[]
  filterFunction: (item: RedirectionHost, activeFilters: Record<string, FilterValue>) => boolean
}

/**
 * Custom hook that provides filter definitions and filter logic for redirection hosts DataTable.
 * Supports filtering by HTTP code, SSL status, and enabled/disabled state.
 */
const useRedirectionHostFilters = (): UseRedirectionHostFiltersReturn => {
  const filters = useMemo<Filter[]>(() => [
    {
      id: 'http_code',
      label: 'HTTP Code',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: '301', label: '301 Moved Permanently' },
        { value: '302', label: '302 Found' },
        { value: '307', label: '307 Temporary Redirect' },
        { value: '308', label: '308 Permanent Redirect' }
      ]
    },
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

  const filterFunction = useCallback((item: RedirectionHost, activeFilters: Record<string, FilterValue>) => {
    // HTTP Code filter (RedirectionHost-specific)
    if (activeFilters.http_code && activeFilters.http_code !== 'all') {
      if (item.forward_http_code.toString() !== activeFilters.http_code) return false
    }

    if (!filterBySsl(item, activeFilters.ssl)) return false
    if (!filterByStatus(item, activeFilters.status)) return false

    return true
  }, [])

  return { filters, filterFunction }
}

export default useRedirectionHostFilters
