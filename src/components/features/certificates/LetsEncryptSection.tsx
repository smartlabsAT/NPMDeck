import React from 'react'
import {
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { certificatesApi } from '../../../api/certificates'
import { getErrorMessage } from '../../../types/common'
import FormSection from '../../shared/FormSection'
import DomainInput from '../../DomainInput'
import DNSProviderSelector from './components/DNSProviderSelector'
import type { CertificateFormData } from './CertificateDrawer'

interface LetsEncryptSectionProps {
  data: Pick<
    CertificateFormData,
    | 'domainNames'
    | 'letsencryptEmail'
    | 'letsencryptAgree'
    | 'dnsChallenge'
    | 'dnsProvider'
    | 'dnsProviderCredentials'
    | 'propagationSeconds'
  >
  errors: Partial<Record<keyof CertificateFormData, string>>
  touched: Partial<Record<keyof CertificateFormData, boolean>>
  setFieldValue: <K extends keyof CertificateFormData>(field: K, value: CertificateFormData[K]) => void
  isEditMode: boolean
}

export default function LetsEncryptSection({
  data,
  errors,
  touched,
  setFieldValue,
  isEditMode,
}: LetsEncryptSectionProps) {
  const [testingDomains, setTestingDomains] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ reachable: boolean; error?: string } | null>(null)

  const handleDnsProviderChange = React.useCallback((provider: string) => {
    setFieldValue('dnsProvider', provider)
  }, [setFieldValue])

  const handleDnsCredentialsChange = React.useCallback((credentials: string) => {
    setFieldValue('dnsProviderCredentials', credentials)
  }, [setFieldValue])

  const handleTestDomains = async () => {
    if (data.domainNames.length === 0) {
      return
    }

    setTestingDomains(true)
    setTestResult(null)

    try {
      const result = await certificatesApi.testHttpReachability(data.domainNames)
      setTestResult(result)
    } catch (err: unknown) {
      setTestResult({
        reachable: false,
        error: getErrorMessage(err)
      })
    } finally {
      setTestingDomains(false)
    }
  }

  return (
    <>
      {/* Domain Names Section */}
      <FormSection title="Domain Names" required>
        <DomainInput
          value={data.domainNames}
          onChange={(domainNames) => setFieldValue('domainNames', domainNames)}
          helperText="Enter the domain names this certificate should cover. Wildcards (*.example.com) are supported."
          error={Boolean(errors.domainNames && touched.domainNames)}
          required
          disabled={isEditMode}
        />
        {errors.domainNames && touched.domainNames && (
          <Alert severity="error" sx={{ mt: 1 }}>{errors.domainNames}</Alert>
        )}
      </FormSection>

      {/* Let's Encrypt Configuration — creation only */}
      {!isEditMode && (
        <>
          <FormSection title="Let's Encrypt Configuration" required>
            <TextField
              label="Email Address"
              type="email"
              value={data.letsencryptEmail}
              onChange={(e) => setFieldValue('letsencryptEmail', e.target.value)}
              helperText="Used for important certificate notifications"
              required
              fullWidth
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={data.letsencryptAgree}
                  onChange={(e) => setFieldValue('letsencryptAgree', e.target.checked)}
                />
              }
              label="I agree to the Let&apos;s Encrypt Subscriber Agreement"
            />
          </FormSection>

          <FormSection title="Challenge Method">
            <FormControlLabel
              control={
                <Switch
                  checked={data.dnsChallenge}
                  onChange={(e) => setFieldValue('dnsChallenge', e.target.checked)}
                />
              }
              label="Use DNS Challenge"
            />

            {data.dnsChallenge ? (
              <>
                <Alert severity="info" sx={{ mt: 1 }}>
                  DNS challenge allows wildcard certificates and works behind firewalls.
                </Alert>

                <Box sx={{ mt: 2 }}>
                  <DNSProviderSelector
                    value={data.dnsProvider}
                    onChange={handleDnsProviderChange}
                    credentials={data.dnsProviderCredentials}
                    onCredentialsChange={handleDnsCredentialsChange}
                  />

                  <TextField
                    label="Propagation Seconds"
                    type="number"
                    value={data.propagationSeconds}
                    onChange={(e) => setFieldValue('propagationSeconds', parseInt(e.target.value) || 120)}
                    helperText="Time to wait for DNS propagation (default: 120 seconds)"
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                </Box>
              </>
            ) : (
              <>
                <Alert severity="info" sx={{ mt: 1 }}>
                  HTTP challenge requires domains to be publicly accessible on port 80.
                  Wildcard certificates are not supported with HTTP challenge.
                </Alert>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleTestDomains}
                    disabled={testingDomains || data.domainNames.length === 0}
                    startIcon={testingDomains ? <CircularProgress size={20} /> : <CheckIcon />}
                  >
                    Test Domain Reachability
                  </Button>
                  {testResult && (
                    <Alert
                      severity={testResult.reachable ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                    >
                      {testResult.reachable
                        ? 'All domains are reachable and ready for certificate generation'
                        : testResult.error || 'Some domains are not reachable'}
                    </Alert>
                  )}
                </Box>
              </>
            )}
          </FormSection>
        </>
      )}
    </>
  )
}
