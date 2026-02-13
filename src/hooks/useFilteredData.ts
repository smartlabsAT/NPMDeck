import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'

interface HasOwnerId {
  owner_user_id?: number
  owner?: { id: number }
}

export function useFilteredData<T extends HasOwnerId>(
  data: T[]
): T[] {
  const { user, shouldFilterByUser } = useAuthStore()

  return useMemo(() => {
    // If user is admin or visibility is 'all', return all data
    if (!shouldFilterByUser() || !user) {
      return data
    }

    // Filter data to only show items owned by current user
    return data.filter(item => {
      const ownerId = item.owner?.id || item.owner_user_id
      return ownerId === user.id
    })
  }, [data, user, shouldFilterByUser])
}

export interface FilteredInfo {
  isFiltered: boolean
  hiddenCount: number
  totalCount: number
  visibleCount: number
}

// Hook for displaying filtered count info
export function useFilteredInfo<T extends HasOwnerId>(
  data: T[],
  filteredData: T[]
): FilteredInfo {
  const { shouldFilterByUser } = useAuthStore()

  return useMemo(() => {
    const isFiltered = shouldFilterByUser() && data.length !== filteredData.length
    const hiddenCount = data.length - filteredData.length

    return {
      isFiltered,
      hiddenCount,
      totalCount: data.length,
      visibleCount: filteredData.length
    }
  }, [data, filteredData, shouldFilterByUser])
}