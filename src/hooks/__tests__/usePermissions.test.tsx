import { describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithProviders, resetAuthStore } from '../../test/utils'
import { usePermissions } from '../usePermissions'
import { useAuthStore } from '../../stores/authStore'
import { mockUser, mockNonAdminUser } from '../../test/fixtures'

describe('usePermissions', () => {
  beforeEach(() => {
    resetAuthStore()
  })

  it('canView returns false when user is null', () => {
    const { result } = renderHookWithProviders(() => usePermissions())
    expect(result.current.canView('proxy_hosts')).toBe(false)
  })

  it('canView returns true for admin', () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    const { result } = renderHookWithProviders(() => usePermissions())
    expect(result.current.canView('proxy_hosts')).toBe(true)
  })

  it('canManage respects view-only permission', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({ permissions: { visibility: 'user', proxy_hosts: 'view', redirection_hosts: 'hidden', dead_hosts: 'hidden', streams: 'hidden', access_lists: 'hidden', certificates: 'hidden' } }),
      isAuthenticated: true,
    })
    const { result } = renderHookWithProviders(() => usePermissions())
    expect(result.current.canManage('proxy_hosts')).toBe(false)
    expect(result.current.canView('proxy_hosts')).toBe(true)
  })

  it('isAdmin is true for admin user', () => {
    // isAdmin is a boolean property on the return value, not a function
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    const { result } = renderHookWithProviders(() => usePermissions())
    expect(result.current.isAdmin).toBe(true)
  })

  it('isAdmin is false for non-admin', () => {
    useAuthStore.setState({ user: mockNonAdminUser(), isAuthenticated: true })
    const { result } = renderHookWithProviders(() => usePermissions())
    expect(result.current.isAdmin).toBe(false)
  })

  it('hasAnyPermission returns true for admin', () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    const { result } = renderHookWithProviders(() => usePermissions())
    expect(result.current.hasAnyPermission()).toBe(true)
  })

  it('canAccess view uses canView under the hood', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({ permissions: { visibility: 'user', proxy_hosts: 'view', redirection_hosts: 'hidden', dead_hosts: 'hidden', streams: 'hidden', access_lists: 'hidden', certificates: 'hidden' } }),
      isAuthenticated: true,
    })
    const { result } = renderHookWithProviders(() => usePermissions())
    expect(result.current.canAccess('proxy_hosts', 'view')).toBe(true)
    expect(result.current.canAccess('proxy_hosts', 'edit')).toBe(false)
  })

  it('getVisibleResources returns only viewable resources for non-admin', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({
        permissions: {
          visibility: 'user',
          proxy_hosts: 'view',
          redirection_hosts: 'hidden',
          dead_hosts: 'hidden',
          streams: 'hidden',
          access_lists: 'hidden',
          certificates: 'hidden',
        },
      }),
      isAuthenticated: true,
    })
    const { result } = renderHookWithProviders(() => usePermissions())
    expect(result.current.getVisibleResources()).toEqual(['proxy_hosts'])
  })
})
