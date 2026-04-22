import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material'
import { Certificate } from '../../../api/certificates'
import CertificateSelector from '../../shared/CertificateSelector'
import LetsEncryptForm from './LetsEncryptForm'
import type { EmailFieldProps, RedirectionSslValues } from './redirectionFormTypes'

export type { RedirectionSslValues }

interface RedirectionSslSectionProps {
  values: RedirectionSslValues
  certificates: Certificate[]
  emailProps: EmailFieldProps
  onFieldChange: (field: keyof RedirectionSslValues, value: RedirectionSslValues[keyof RedirectionSslValues]) => void
  onAddCertificateClick: () => void
}

export default function RedirectionSslSection({
  values,
  certificates,
  emailProps,
  onFieldChange,
  onAddCertificateClick,
}: RedirectionSslSectionProps) {
  const hasExistingCert =
    values.certificate_id !== 0 && values.certificate_id !== 'new'

  return (
    <>
      <CertificateSelector
        value={certificates.find((c) => c.id === values.certificate_id) || null}
        onChange={(newValue) => {
          if (newValue) {
            onFieldChange('certificate_id', newValue.id)
            onFieldChange('use_lets_encrypt', false)
          } else {
            onFieldChange('certificate_id', 0)
            onFieldChange('use_lets_encrypt', false)
          }
        }}
        certificates={certificates}
        loading={false}
        helperText="Choose an existing certificate or request a new one"
        showDomainInfo={false}
        showAddButton={true}
        onAddClick={onAddCertificateClick}
        includeNewOption={true}
        onNewOptionSelect={() => {
          onFieldChange('certificate_id', 'new')
          onFieldChange('use_lets_encrypt', true)
        }}
      />

      {hasExistingCert && (
        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={values.ssl_forced}
                onChange={(e) => onFieldChange('ssl_forced', e.target.checked)}
              />
            }
            label="Force SSL"
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
            Redirect all HTTP traffic to HTTPS
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={values.http2_support}
                onChange={(e) => onFieldChange('http2_support', e.target.checked)}
              />
            }
            label="HTTP/2 Support"
          />

          <FormControlLabel
            control={
              <Switch
                checked={values.hsts_enabled}
                onChange={(e) => onFieldChange('hsts_enabled', e.target.checked)}
                disabled={!values.ssl_forced}
              />
            }
            label="HSTS Enabled"
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
            HTTP Strict Transport Security
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={values.hsts_subdomains}
                onChange={(e) =>
                  onFieldChange('hsts_subdomains', e.target.checked)
                }
                disabled={!values.hsts_enabled}
              />
            }
            label="HSTS Subdomains"
            sx={{ ml: 4 }}
          />
        </Box>
      )}

      {values.use_lets_encrypt && values.certificate_id === 'new' && (
        <LetsEncryptForm
          emailProps={emailProps}
          letsencrypt_agree={values.letsencrypt_agree}
          dns_challenge={values.dns_challenge}
          dns_provider={values.dns_provider}
          dns_provider_credentials={values.dns_provider_credentials}
          propagation_seconds={values.propagation_seconds}
          onFieldChange={onFieldChange}
        />
      )}
    </>
  )
}
