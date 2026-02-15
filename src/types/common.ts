import type { Owner } from './base'
import type { Certificate } from '../api/certificates'

// Re-export Owner from base types for backward compatibility
export type { Owner }

/**
 * Shape of the NPM API error response body.
 */
interface ApiErrorBody {
  error?: {
    message: string
    code?: string
  }
  message?: string
}

// Import/Export data types
export interface ImportValidationData {
  version?: string
  type?: string
  data?: unknown
  exported_at?: string
}

// Helper function to safely extract error message
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error

  const err = error as {
    response?: { data?: ApiErrorBody }
    message?: string
  }

  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    'An unexpected error occurred'
  )
}

// Certificate with host relations
export interface CertificateHostRelation {
  id: number
  domain_names: string[]
  enabled: boolean
  // Missing properties that are being used
  forward_scheme?: string
  forward_host?: string
  forward_port?: number
  forward_domain_name?: string
}

export interface CertificateWithHosts extends Certificate {
  proxy_hosts?: CertificateHostRelation[]
  redirection_hosts?: CertificateHostRelation[]
  dead_hosts?: CertificateHostRelation[]
}
