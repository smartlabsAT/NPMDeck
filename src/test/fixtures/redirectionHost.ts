import type { RedirectionHost } from '../../api/redirectionHosts'

export function mockRedirectionHost(overrides: Partial<RedirectionHost> = {}): RedirectionHost {
  return {
    id: 1,
    created_on: '2026-01-01T00:00:00.000Z',
    modified_on: '2026-01-01T00:00:00.000Z',
    owner_user_id: 1,
    domain_names: ['old.example.com'],
    forward_scheme: 'https',
    forward_domain_name: 'new.example.com',
    forward_http_code: 301,
    preserve_path: true,
    certificate_id: 0,
    ssl_forced: false,
    hsts_enabled: false,
    hsts_subdomains: false,
    http2_support: false,
    block_exploits: false,
    advanced_config: '',
    enabled: true,
    meta: { nginx_online: true, nginx_err: null },
    ...overrides,
  }
}
