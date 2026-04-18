import {
  Box,
  Alert,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import type { ChangeEvent } from 'react'

const DNS_PROVIDERS = [
  { value: 'cloudflare', label: 'Cloudflare' },
  { value: 'digitalocean', label: 'DigitalOcean' },
  { value: 'duckdns', label: 'DuckDNS' },
  { value: 'godaddy', label: 'GoDaddy' },
  { value: 'google', label: 'Google' },
  { value: 'hetzner', label: 'Hetzner' },
  { value: 'linode', label: 'Linode' },
  { value: 'route53', label: 'AWS Route53' },
]

/** Full shape returned by useDrawerForm.getFieldProps — passed through from parent to preserve
 *  onBlur (touch tracking), disabled (while submitting), and touch-gated error display. */
export interface EmailFieldProps {
  name: string
  value: string | number | readonly string[]
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur: () => void
  error: boolean
  helperText?: string
  disabled: boolean
}

/** Subset of LetsEncrypt-related field keys handled by this component */
export type LetsEncryptFieldKey =
  | 'letsencrypt_email'
  | 'letsencrypt_agree'
  | 'dns_challenge'
  | 'dns_provider'
  | 'dns_provider_credentials'
  | 'propagation_seconds'

/** Value union for all LetsEncrypt fields */
export type LetsEncryptFieldValue = string | boolean

interface LetsEncryptFormProps {
  /** Full getFieldProps result for letsencrypt_email — preserves onBlur, disabled, error, helperText */
  emailProps: EmailFieldProps
  letsencrypt_agree: boolean
  dns_challenge: boolean
  dns_provider: string
  dns_provider_credentials: string
  propagation_seconds: string
  onFieldChange: (field: LetsEncryptFieldKey, value: LetsEncryptFieldValue) => void
}

export default function LetsEncryptForm({
  emailProps,
  letsencrypt_agree,
  dns_challenge,
  dns_provider,
  dns_provider_credentials,
  propagation_seconds,
  onFieldChange,
}: LetsEncryptFormProps) {
  return (
    <Box sx={{ mt: 3 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        A new Let&apos;s Encrypt certificate will be requested when you save
      </Alert>

      <TextField
        {...emailProps}
        fullWidth
        label="Email Address"
        type="email"
        margin="normal"
        required
        helperText={emailProps.helperText || "For Let's Encrypt notifications"}
      />

      <FormControlLabel
        control={
          <Switch
            checked={dns_challenge}
            onChange={(e) => onFieldChange('dns_challenge', e.target.checked)}
          />
        }
        label="Use DNS Challenge"
        sx={{ mt: 2 }}
      />
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          ml: 2,
          mb: 2,
          display: 'block',
        }}
      >
        Required for wildcard certificates
      </Typography>

      {dns_challenge && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>DNS Provider</InputLabel>
            <Select
              value={dns_provider}
              onChange={(e) => onFieldChange('dns_provider', e.target.value)}
              label="DNS Provider"
              required
            >
              {DNS_PROVIDERS.map((provider) => (
                <MenuItem key={provider.value} value={provider.value}>
                  {provider.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="DNS Provider Credentials"
            multiline
            rows={4}
            value={dns_provider_credentials}
            onChange={(e) => onFieldChange('dns_provider_credentials', e.target.value)}
            margin="normal"
            helperText="Provider-specific API credentials"
          />

          <TextField
            fullWidth
            label="Propagation Seconds"
            type="number"
            value={propagation_seconds}
            onChange={(e) => onFieldChange('propagation_seconds', e.target.value)}
            margin="normal"
            helperText="Time to wait for DNS propagation (default: provider-specific)"
          />
        </>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={letsencrypt_agree}
            onChange={(e) => onFieldChange('letsencrypt_agree', e.target.checked)}
          />
        }
        label="I agree to the Let's Encrypt Terms of Service"
        sx={{ mt: 2 }}
        required
      />
    </Box>
  )
}
