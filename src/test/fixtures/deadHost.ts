import type { DeadHost } from '../../api/deadHosts'

export function mockDeadHost(overrides: Partial<DeadHost> = {}): DeadHost {
  return {
    id: 1,
    created_on: '2026-01-01T00:00:00.000Z',
    modified_on: '2026-01-01T00:00:00.000Z',
    owner_user_id: 1,
    domain_names: ['dead.example.com'],
    certificate_id: 0,
    ssl_forced: false,
    hsts_enabled: false,
    hsts_subdomains: false,
    http2_support: false,
    advanced_config: '',
    enabled: true,
    meta: { nginx_online: true, nginx_err: null },
    ...overrides,
  }
}
