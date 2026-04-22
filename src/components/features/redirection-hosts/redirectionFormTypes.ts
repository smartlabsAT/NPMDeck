import type { ChangeEvent } from 'react'

/**
 * Full shape returned by useDrawerForm.getFieldProps — passed through from parent
 * to preserve onBlur (touch tracking), disabled (while submitting), and touch-gated
 * error display. Shared between RedirectionSslSection and LetsEncryptForm.
 */
export interface EmailFieldProps {
  name: string
  value: string | number | readonly string[]
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur: () => void
  error: boolean
  helperText?: string
  disabled: boolean
}

/**
 * Values shown in the SSL tab of the Redirection Host drawer.
 * Subset of the full form state for clean prop typing.
 */
export interface RedirectionSslValues {
  certificate_id: number | string
  use_lets_encrypt: boolean
  ssl_forced: boolean
  hsts_enabled: boolean
  hsts_subdomains: boolean
  http2_support: boolean
  letsencrypt_email: string
  letsencrypt_agree: boolean
  dns_challenge: boolean
  dns_provider: string
  dns_provider_credentials: string
  propagation_seconds: string
}
