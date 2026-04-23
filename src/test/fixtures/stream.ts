import type { Stream } from '../../api/streams'

export function mockStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 1,
    created_on: '2026-01-01T00:00:00.000Z',
    modified_on: '2026-01-01T00:00:00.000Z',
    owner_user_id: 1,
    incoming_port: 8080,
    forwarding_host: '192.168.1.1',
    forwarding_port: 8080,
    tcp_forwarding: true,
    udp_forwarding: false,
    certificate_id: 0,
    enabled: true,
    meta: { nginx_online: true, nginx_err: null },
    ...overrides,
  }
}
