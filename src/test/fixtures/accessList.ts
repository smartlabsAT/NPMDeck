import type { AccessList } from '../../api/accessLists'

export function mockAccessList(overrides: Partial<AccessList> = {}): AccessList {
  return {
    id: 1,
    created_on: '2026-01-01T00:00:00.000Z',
    modified_on: '2026-01-01T00:00:00.000Z',
    owner_user_id: 1,
    name: 'Default Access',
    satisfy_any: false,
    pass_auth: false,
    items: [],
    clients: [],
    meta: {},
    ...overrides,
  }
}
