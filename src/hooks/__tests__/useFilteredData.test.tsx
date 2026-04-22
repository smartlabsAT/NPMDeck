import { describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithProviders } from '../../test/utils'
import { useFilteredData, useFilteredInfo } from '../useFilteredData'
import { useAuthStore } from '../../stores/authStore'
import { mockUser, mockNonAdminUser, mockProxyHost } from '../../test/fixtures'

function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    tokenExpiresAt: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    tokenStack: [],
    refreshInterval: null,
    expiryWarningTimeout: null,
    isRefreshing: false,
  })
}

describe('useFilteredData', () => {
  beforeEach(() => {
    resetAuthStore()
  })

  it('returns full data when user is null', () => {
    const data = [mockProxyHost({ id: 1 }), mockProxyHost({ id: 2 })]
    const { result } = renderHookWithProviders(() => useFilteredData(data))
    expect(result.current).toEqual(data)
  })

  it('returns full data for admin user (shouldFilterByUser=false)', () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    const data = [mockProxyHost({ id: 1, owner_user_id: 2 }), mockProxyHost({ id: 2, owner_user_id: 3 })]
    const { result } = renderHookWithProviders(() => useFilteredData(data))
    expect(result.current).toHaveLength(2)
  })

  it('filters by owner_user_id for non-admin with visibility=user', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({ id: 5, permissions: { visibility: 'user', proxy_hosts: 'view', redirection_hosts: 'hidden', dead_hosts: 'hidden', streams: 'hidden', access_lists: 'hidden', certificates: 'hidden' } }),
      isAuthenticated: true,
    })
    const data = [
      mockProxyHost({ id: 1, owner_user_id: 5 }),
      mockProxyHost({ id: 2, owner_user_id: 3 }),
      mockProxyHost({ id: 3, owner_user_id: 5 }),
    ]
    const { result } = renderHookWithProviders(() => useFilteredData(data))
    expect(result.current).toHaveLength(2)
    expect(result.current.map(h => h.id).sort()).toEqual([1, 3])
  })

  it('returns full data for user with visibility=all', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({ id: 5, permissions: { visibility: 'all', proxy_hosts: 'view', redirection_hosts: 'hidden', dead_hosts: 'hidden', streams: 'hidden', access_lists: 'hidden', certificates: 'hidden' } }),
      isAuthenticated: true,
    })
    const data = [
      mockProxyHost({ id: 1, owner_user_id: 2 }),
      mockProxyHost({ id: 2, owner_user_id: 3 }),
    ]
    const { result } = renderHookWithProviders(() => useFilteredData(data))
    expect(result.current).toHaveLength(2)
  })

  it('returns empty array when all items are owned by others', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({ id: 5, permissions: { visibility: 'user', proxy_hosts: 'view', redirection_hosts: 'hidden', dead_hosts: 'hidden', streams: 'hidden', access_lists: 'hidden', certificates: 'hidden' } }),
      isAuthenticated: true,
    })
    const data = [
      mockProxyHost({ id: 1, owner_user_id: 2 }),
      mockProxyHost({ id: 2, owner_user_id: 3 }),
    ]
    const { result } = renderHookWithProviders(() => useFilteredData(data))
    expect(result.current).toHaveLength(0)
  })
})

describe('useFilteredInfo', () => {
  beforeEach(() => {
    resetAuthStore()
  })

  it('reports isFiltered=false when user is null (no filtering happens)', () => {
    const data = [mockProxyHost({ id: 1 })]
    const { result } = renderHookWithProviders(() => useFilteredInfo(data, data))
    expect(result.current.isFiltered).toBe(false)
  })

  it('reports isFiltered=true when non-admin has smaller filtered set', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({ id: 5, permissions: { visibility: 'user', proxy_hosts: 'view', redirection_hosts: 'hidden', dead_hosts: 'hidden', streams: 'hidden', access_lists: 'hidden', certificates: 'hidden' } }),
      isAuthenticated: true,
    })
    const data = [mockProxyHost({ id: 1 }), mockProxyHost({ id: 2 })]
    const filtered = [mockProxyHost({ id: 1 })]
    const { result } = renderHookWithProviders(() => useFilteredInfo(data, filtered))
    expect(result.current.isFiltered).toBe(true)
  })

  it('reports correct totalCount / visibleCount / hiddenCount', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({ id: 5, permissions: { visibility: 'user', proxy_hosts: 'view', redirection_hosts: 'hidden', dead_hosts: 'hidden', streams: 'hidden', access_lists: 'hidden', certificates: 'hidden' } }),
      isAuthenticated: true,
    })
    const data = [mockProxyHost({ id: 1 }), mockProxyHost({ id: 2 }), mockProxyHost({ id: 3 })]
    const filtered = [mockProxyHost({ id: 1 })]
    const { result } = renderHookWithProviders(() => useFilteredInfo(data, filtered))
    expect(result.current.totalCount).toBe(3)
    expect(result.current.visibleCount).toBe(1)
    expect(result.current.hiddenCount).toBe(2)
  })

  it('reports hiddenCount=0 when not filtered', () => {
    const data = [mockProxyHost({ id: 1 })]
    const { result } = renderHookWithProviders(() => useFilteredInfo(data, data))
    expect(result.current.hiddenCount).toBe(0)
  })

  it('isFiltered=false for admin user even with differing counts', () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    const data = [mockProxyHost({ id: 1 }), mockProxyHost({ id: 2 })]
    const filtered = [mockProxyHost({ id: 1 })]
    const { result } = renderHookWithProviders(() => useFilteredInfo(data, filtered))
    expect(result.current.isFiltered).toBe(false)
  })
})
