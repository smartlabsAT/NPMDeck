import { describe, it, expect } from 'vitest'
import {
  isAdmin,
  hasPermission,
  canView,
  canManage,
  getPermissionLevel,
  hasAnyPermission,
  getVisibleResources,
  shouldFilterByUser,
  canAccessResource,
} from '../permissions'
import { mockUser, mockNonAdminUser } from '../../test/fixtures'

describe('isAdmin', () => {
  it('returns false for null user', () => {
    expect(isAdmin(null)).toBe(false)
  })

  it('returns true when user has admin role', () => {
    expect(isAdmin(mockUser({ roles: ['admin'] }))).toBe(true)
  })

  it('returns false when user lacks admin role', () => {
    expect(isAdmin(mockUser({ roles: ['user'] }))).toBe(false)
  })
})

describe('hasPermission', () => {
  it('returns false for null user', () => {
    expect(hasPermission(null, 'proxy_hosts', 'view')).toBe(false)
  })

  it('returns true for admin regardless of resource permissions', () => {
    const admin = mockUser({ roles: ['admin'], permissions: undefined })
    expect(hasPermission(admin, 'proxy_hosts', 'manage')).toBe(true)
  })

  it('respects hierarchy: manage grants view', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'manage' } })
    expect(hasPermission(user, 'proxy_hosts', 'view')).toBe(true)
  })

  it('respects hierarchy: view does not grant manage', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'view' } })
    expect(hasPermission(user, 'proxy_hosts', 'manage')).toBe(false)
  })

  it('treats hidden as no access', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'hidden' } })
    expect(hasPermission(user, 'proxy_hosts', 'view')).toBe(false)
  })

  it('falls back to DEFAULT_PERMISSIONS when user has no permissions object', () => {
    const user = mockNonAdminUser({ permissions: undefined })
    expect(hasPermission(user, 'proxy_hosts', 'view')).toBe(false)
  })
})

describe('canView', () => {
  it('returns true when user can view resource', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'view' } })
    expect(canView(user, 'proxy_hosts')).toBe(true)
  })

  it('returns false when permission is hidden', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'hidden' } })
    expect(canView(user, 'proxy_hosts')).toBe(false)
  })
})

describe('canManage', () => {
  it('returns true when user has manage permission', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'manage' } })
    expect(canManage(user, 'proxy_hosts')).toBe(true)
  })

  it('returns false for view-only permission', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'view' } })
    expect(canManage(user, 'proxy_hosts')).toBe(false)
  })
})

describe('getPermissionLevel', () => {
  it('returns hidden for null user', () => {
    expect(getPermissionLevel(null, 'proxy_hosts')).toBe('hidden')
  })

  it('returns manage for admin', () => {
    expect(getPermissionLevel(mockUser(), 'proxy_hosts')).toBe('manage')
  })

  it('returns the user permission level for the resource', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'view' } })
    expect(getPermissionLevel(user, 'proxy_hosts')).toBe('view')
  })
})

describe('hasAnyPermission', () => {
  it('returns false for null user', () => {
    expect(hasAnyPermission(null)).toBe(false)
  })

  it('returns true for admin', () => {
    expect(hasAnyPermission(mockUser())).toBe(true)
  })

  it('returns true when user has view on at least one resource', () => {
    const user = mockNonAdminUser({
      permissions: { proxy_hosts: 'view', redirection_hosts: 'hidden' },
    })
    expect(hasAnyPermission(user, 'view')).toBe(true)
  })

  it('returns false when all resources are hidden', () => {
    const user = mockNonAdminUser({
      permissions: {
        proxy_hosts: 'hidden',
        redirection_hosts: 'hidden',
        dead_hosts: 'hidden',
        streams: 'hidden',
        access_lists: 'hidden',
        certificates: 'hidden',
      },
    })
    expect(hasAnyPermission(user, 'view')).toBe(false)
  })

  it('defaults requiredLevel to view when omitted', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'view' } })
    expect(hasAnyPermission(user)).toBe(true)
  })
})

describe('getVisibleResources', () => {
  it('returns empty array for null user', () => {
    expect(getVisibleResources(null)).toEqual([])
  })

  it('returns only viewable resources for non-admin', () => {
    const user = mockNonAdminUser({
      permissions: {
        proxy_hosts: 'view',
        redirection_hosts: 'manage',
        dead_hosts: 'hidden',
        streams: 'hidden',
        access_lists: 'view',
        certificates: 'hidden',
      },
    })
    expect(getVisibleResources(user)).toEqual([
      'proxy_hosts',
      'redirection_hosts',
      'access_lists',
    ])
  })
})

describe('shouldFilterByUser', () => {
  it('returns true for null user', () => {
    expect(shouldFilterByUser(null)).toBe(true)
  })

  it('returns false for admin', () => {
    expect(shouldFilterByUser(mockUser())).toBe(false)
  })

  it('returns true when visibility is user', () => {
    const user = mockNonAdminUser({ permissions: { visibility: 'user' } })
    expect(shouldFilterByUser(user)).toBe(true)
  })

  it('returns false when visibility is all', () => {
    const user = mockNonAdminUser({ permissions: { visibility: 'all' } })
    expect(shouldFilterByUser(user)).toBe(false)
  })
})

describe('canAccessResource', () => {
  it('returns false for null user', () => {
    expect(canAccessResource(null, 'proxy_hosts', 'view')).toBe(false)
  })

  it('uses canView for view action', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'view' } })
    expect(canAccessResource(user, 'proxy_hosts', 'view')).toBe(true)
  })

  it('uses canManage for create/edit/delete actions', () => {
    const user = mockNonAdminUser({ permissions: { proxy_hosts: 'view' } })
    expect(canAccessResource(user, 'proxy_hosts', 'create')).toBe(false)
    expect(canAccessResource(user, 'proxy_hosts', 'edit')).toBe(false)
    expect(canAccessResource(user, 'proxy_hosts', 'delete')).toBe(false)
  })
})
