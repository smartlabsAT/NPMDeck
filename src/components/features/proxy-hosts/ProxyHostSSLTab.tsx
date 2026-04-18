import React from 'react'
import {
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Certificate } from '../../../api/certificates'
import FormSection from '../../shared/FormSection'
import CertificateSelector from '../../shared/CertificateSelector'
import type { ProxyHostFormData } from './proxyHostFormTypes'

interface SSLTabProps {
  data: ProxyHostFormData
  setFieldValue: (field: keyof ProxyHostFormData, value: ProxyHostFormData[keyof ProxyHostFormData]) => void
  errors: Partial<Record<keyof ProxyHostFormData, string>>
  certificates: Certificate[]
  loadingData: boolean
}

const ProxyHostSSLTab = React.memo(({ data, setFieldValue, errors, certificates, loadingData }: SSLTabProps) => {
  const navigate = useNavigate()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormSection title="SSL Configuration">
        <FormControlLabel
          control={
            <Switch
              checked={data.sslEnabled}
              onChange={(e) => setFieldValue('sslEnabled', e.target.checked)}
            />
          }
          label="SSL"
        />

        {data.sslEnabled && (
          <CertificateSelector
            value={data.selectedCertificate}
            onChange={(newValue) => {
              setFieldValue('selectedCertificate', newValue)
              setFieldValue('certificateId', newValue?.id || 0)
            }}
            certificates={certificates}
            loading={loadingData}
            error={errors.certificateId}
            showDomainInfo={true}
            showAddButton={true}
            onAddClick={() => navigate('/security/certificates/new/letsencrypt')}
          />
        )}
      </FormSection>

      {data.sslEnabled && (
        <FormSection title="SSL Options">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.forceSSL}
                  onChange={(e) => setFieldValue('forceSSL', e.target.checked)}
                />
              }
              label="Force SSL"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={data.http2Support}
                  onChange={(e) => setFieldValue('http2Support', e.target.checked)}
                />
              }
              label="HTTP/2 Support"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={data.hstsEnabled}
                  onChange={(e) => setFieldValue('hstsEnabled', e.target.checked)}
                />
              }
              label="HSTS Enabled"
            />

            {data.hstsEnabled && (
              <FormControlLabel
                control={
                  <Switch
                    checked={data.hstsSubdomains}
                    onChange={(e) => setFieldValue('hstsSubdomains', e.target.checked)}
                  />
                }
                label="HSTS Subdomains"
                sx={{ ml: 4 }}
              />
            )}
          </Box>
        </FormSection>
      )}
    </Box>
  )
})

ProxyHostSSLTab.displayName = 'SSLTab'

export default ProxyHostSSLTab
