import type { Certificate } from '../../api/certificates'

export function mockCertificate(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: 1,
    created_on: '2026-01-01T00:00:00.000Z',
    modified_on: '2026-01-01T00:00:00.000Z',
    owner_user_id: 1,
    provider: 'letsencrypt',
    nice_name: 'example.com',
    domain_names: ['example.com'],
    expires_on: '2027-01-01T00:00:00.000Z',
    meta: { letsencrypt_email: 'admin@example.com', dns_challenge: false },
    ...overrides,
  }
}
