import type { User } from '../../api/users'

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    nickname: 'tester',
    avatar: '',
    roles: ['admin'],
    is_disabled: false,
    permissions: {
      visibility: 'all',
      proxy_hosts: 'manage',
      redirection_hosts: 'manage',
      dead_hosts: 'manage',
      streams: 'manage',
      access_lists: 'manage',
      certificates: 'manage',
    },
    created_on: '2026-01-01T00:00:00.000Z',
    modified_on: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function mockNonAdminUser(overrides: Partial<User> = {}): User {
  return mockUser({
    id: 2,
    name: 'Regular User',
    email: 'user@example.com',
    roles: ['user'],
    permissions: {
      visibility: 'user',
      proxy_hosts: 'view',
      redirection_hosts: 'hidden',
      dead_hosts: 'hidden',
      streams: 'hidden',
      access_lists: 'hidden',
      certificates: 'hidden',
    },
    ...overrides,
  })
}
