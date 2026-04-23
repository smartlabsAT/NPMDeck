import type { ProxyHost } from '../../api/proxyHosts'

export function mockProxyHost(overrides: Partial<ProxyHost> = {}): ProxyHost {
  return {
    id: 1,
    created_on: '2026-01-01T00:00:00.000Z',
    modified_on: '2026-01-01T00:00:00.000Z',
    owner_user_id: 1,
    domain_names: ['example.com'],
    forward_scheme: 'http',
    forward_host: '192.168.1.1',
    forward_port: 8080,
    certificate_id: 0,
    ssl_forced: false,
    hsts_enabled: false,
    hsts_subdomains: false,
    http2_support: false,
    block_exploits: false,
    caching_enabled: false,
    allow_websocket_upgrade: false,
    access_list_id: 0,
    advanced_config: '',
    enabled: true,
    meta: { nginx_online: true, nginx_err: null },
    locations: [],
    ...overrides,
  }
}
