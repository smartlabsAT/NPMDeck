import React from 'react'
import {
  TextField,
  FormControlLabel,
  Switch,
  Box,
  RadioGroup,
  Radio,
  FormLabel,
  Alert,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material'
import {
  Info as InfoIcon,
  VpnKey as VpnKeyIcon,
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Description as FileIcon,
  Key as KeyIcon,
  AccountTree as ChainIcon,
} from '@mui/icons-material'
import { Certificate, CreateCertificate, certificatesApi } from '../../../api/certificates'
import BaseDrawer from '../../base/BaseDrawer'
import TabPanel from '../../shared/TabPanel'
import FormSection from '../../shared/FormSection'
import DomainInput from '../../DomainInput'
import { useDrawerForm } from '../../../hooks/useDrawerForm'
import FileDropzone from './components/FileDropzone'
import DNSProviderSelector from './components/DNSProviderSelector'

interface CertificateDrawerProps {
  open: boolean
  onClose: () => void
  certificate?: Certificate | null
  onSave: () => void
  initialProvider?: 'letsencrypt' | 'other'
}

interface CertificateFormData {
  provider: 'letsencrypt' | 'other'
  niceName: string
  domainNames: string[]
  letsencryptEmail: string
  letsencryptAgree: boolean
  dnsChallenge: boolean
  dnsProvider: string
  dnsProviderCredentials: string
  propagationSeconds: number
  certificateFile: File | null
  certificateKeyFile: File | null
  intermediateCertificateFile: File | null
}

export default function CertificateDrawer({ 
  open, 
  onClose, 
  certificate, 
  onSave, 
  initialProvider = 'letsencrypt' 
}: CertificateDrawerProps) {
  const [activeTab, setActiveTab] = React.useState(0)
  const [testingDomains, setTestingDomains] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ reachable: boolean; error?: string } | null>(null)

  const isEditMode = !!certificate

  const {
    data,
    setFieldValue,
    loading,
    globalError,
    errors,
    handleSubmit,
    isDirty,
    isValid,
  } = useDrawerForm<CertificateFormData>({
    initialData: {
      provider: certificate?.provider || initialProvider,
      niceName: certificate?.nice_name || '',
      domainNames: certificate?.domain_names || [],
      letsencryptEmail: certificate?.meta?.letsencrypt_email || '',
      letsencryptAgree: certificate?.meta?.letsencrypt_agree || false,
      dnsChallenge: certificate?.meta?.dns_challenge || false,
      dnsProvider: certificate?.meta?.dns_provider || '',
      dnsProviderCredentials: certificate?.meta?.dns_provider_credentials || '',
      propagationSeconds: certificate?.meta?.propagation_seconds || 120,
      certificateFile: null,
      certificateKeyFile: null,
      intermediateCertificateFile: null,
    },
    fields: {
      provider: {
        initialValue: 'letsencrypt' as 'letsencrypt' | 'other',
        required: true
      },
      niceName: {
        initialValue: '',
        required: false
      },
      domainNames: {
        initialValue: [],
        required: true,
        validate: (domains: string[]) => domains.length === 0 ? 'At least one domain name is required' : null
      },
      letsencryptEmail: {
        initialValue: '',
        validate: (email: string, formData: any) => {
          if (formData?.provider === 'letsencrypt' && !email) {
            return 'Email is required for Let\'s Encrypt certificates'
          }
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Please enter a valid email address'
          }
          return null
        }
      },
      letsencryptAgree: {
        initialValue: false,
        validate: (agree: boolean, formData: any) => {
          if (formData?.provider === 'letsencrypt' && !agree) {
            return 'You must agree to the Let\'s Encrypt Subscriber Agreement'
          }
          return null
        }
      },
      dnsChallenge: {
        initialValue: false,
        required: false
      },
      dnsProvider: {
        initialValue: '',
        validate: (provider: string, data: any) => {
          if (data.provider === 'letsencrypt' && data.dnsChallenge && !provider) {
            return 'DNS provider is required when DNS challenge is enabled'
          }
          return null
        }
      },
      dnsProviderCredentials: {
        initialValue: '',
        validate: (credentials: string, data: any) => {
          if (data.provider === 'letsencrypt' && data.dnsChallenge && data.dnsProvider && !credentials) {
            return 'DNS provider credentials are required'
          }
          return null
        }
      },
      propagationSeconds: {
        initialValue: 120,
        required: false
      },
      certificateFile: {
        initialValue: null as File | null,
        validate: (file: File | null, data: any) => {
          if (data.provider === 'other' && !isEditMode && !file) {
            return 'Certificate file is required for custom certificates'
          }
          return null
        }
      },
      certificateKeyFile: {
        initialValue: null as File | null,
        validate: (file: File | null, data: any) => {
          if (data.provider === 'other' && !isEditMode && !file) {
            return 'Private key file is required for custom certificates'
          }
          return null
        }
      },
      intermediateCertificateFile: {
        initialValue: null as File | null,
        required: false
      },
    },
    onSubmit: async (data) => {
      // Validate wildcard domains
      if (data.provider === 'letsencrypt' && !data.dnsChallenge) {
        const hasWildcard = data.domainNames.some((d: string) => d.includes('*'))
        if (hasWildcard) {
          throw new Error('Wildcard domains require DNS challenge to be enabled')
        }
      }

      const payload: CreateCertificate = {
        provider: data.provider,
        nice_name: data.niceName || undefined,
        domain_names: data.domainNames,
      }

      if (data.provider === 'letsencrypt') {
        payload.meta = {
          letsencrypt_email: data.letsencryptEmail,
          letsencrypt_agree: data.letsencryptAgree,
          dns_challenge: data.dnsChallenge,
        }

        if (data.dnsChallenge) {
          payload.meta.dns_provider = data.dnsProvider
          payload.meta.dns_provider_credentials = data.dnsProviderCredentials
          if (data.propagationSeconds) {
            payload.meta.propagation_seconds = data.propagationSeconds
          }
        }
      }

      if (isEditMode) {
        // Update existing certificate
        if (data.provider === 'letsencrypt') {
          await certificatesApi.update(certificate.id, {
            nice_name: payload.nice_name,
            meta: payload.meta,
          })
        } else {
          // For custom certificates, we can only update the nice name
          await certificatesApi.update(certificate.id, {
            nice_name: payload.nice_name,
          })
        }
      } else {
        // Create new certificate
        if (data.provider === 'letsencrypt') {
          await certificatesApi.create(payload)
        } else {
          // For custom certificates - validate and upload files
          if (!data.certificateFile || !data.certificateKeyFile) {
            throw new Error('Certificate and key files are required')
          }

          // Validate certificate files
          const validationResult = await certificatesApi.validateFiles({
            certificate: data.certificateFile,
            certificateKey: data.certificateKeyFile,
            intermediateCertificate: data.intermediateCertificateFile || undefined
          })

          if (!validationResult || (!validationResult.certificate && !validationResult.certificate_key)) {
            throw new Error('Invalid certificate files')
          }

          // Create certificate entry
          const newCert = await certificatesApi.create(payload)

          // Upload certificate files
          await certificatesApi.upload(newCert.id, {
            certificate: data.certificateFile,
            certificateKey: data.certificateKeyFile,
            intermediateCertificate: data.intermediateCertificateFile || undefined
          })
        }
      }

      onSave()
      onClose()
    },
    autoSave: {
      enabled: true,
      delay: 3000,
      onAutoSave: async (data) => {
        if (isEditMode && isDirty && data.provider === 'letsencrypt') {
          // Auto-save Let's Encrypt configuration
          console.log('Auto-saving certificate draft...', data)
        }
      }
    }
  })

  const handleTestDomains = async () => {
    if (!data || data.domainNames.length === 0) {
      return
    }
    
    setTestingDomains(true)
    setTestResult(null)
    
    try {
      const result = await certificatesApi.testHttpReachability(data.domainNames)
      setTestResult(result)
    } catch (err: any) {
      setTestResult({ 
        reachable: false, 
        error: err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to test domain reachability'
      })
    } finally {
      setTestingDomains(false)
    }
  }

  const tabs = [
    { 
      id: 'details', 
      label: 'Details', 
      icon: <InfoIcon />,
      hasError: Boolean(errors.domainNames || errors.niceName)
    },
    { 
      id: 'letsencrypt', 
      label: "Let's Encrypt",
      icon: <VpnKeyIcon />,
      disabled: data?.provider !== 'letsencrypt',
      hasError: Boolean(errors.letsencryptEmail || errors.letsencryptAgree || errors.dnsProvider || errors.dnsProviderCredentials)
    },
    { 
      id: 'custom', 
      label: 'Custom Certificate',
      icon: <UploadIcon />,
      disabled: data?.provider !== 'other',
      hasError: Boolean(errors.certificateFile || errors.certificateKeyFile)
    },
  ]

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Certificate' : 'Add SSL Certificate'}
      subtitle={data?.niceName || data?.domainNames?.[0] || 'SSL Certificate'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={loading}
      error={globalError || undefined}
      isDirty={isDirty}
      onSave={handleSubmit}
      saveDisabled={!isValid}
      saveText={isEditMode ? 'Save Changes' : 'Create Certificate'}
      confirmClose={isDirty}
      width={700}
    >
      <TabPanel value={activeTab} index={0}>
        <DetailsTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <LetsEncryptTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
          testingDomains={testingDomains}
          testResult={testResult}
          onTestDomains={handleTestDomains}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CustomCertificateTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
        />
      </TabPanel>
    </BaseDrawer>
  )
}

// Details Tab Component
interface DetailsTabProps {
  data: CertificateFormData
  setFieldValue: (field: keyof CertificateFormData, value: any) => void
  errors: Record<string, string>
}

function DetailsTab({ data, setFieldValue, errors }: DetailsTabProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormSection title="Certificate Details" required>
        <TextField
          label="Nice Name"
          value={data.niceName}
          onChange={(e) => setFieldValue('niceName', e.target.value)}
          placeholder="My SSL Certificate"
          fullWidth
          helperText="Optional friendly name for this certificate"
          sx={{ mb: 2 }}
        />

        <DomainInput
          value={data.domainNames}
          onChange={(domainNames) => setFieldValue('domainNames', domainNames)}
          helperText="Enter the domain names this certificate should cover. Wildcards (*.example.com) are supported."
          error={Boolean(errors.domainNames)}
          required
        />
        {errors.domainNames && (
          <Alert severity="error" sx={{ mt: 1 }}>{errors.domainNames}</Alert>
        )}
      </FormSection>

      <FormSection title="Certificate Provider" required>
        <FormControl component="fieldset">
          <FormLabel component="legend">Provider Type</FormLabel>
          <RadioGroup
            value={data.provider}
            onChange={(e) => setFieldValue('provider', e.target.value as 'letsencrypt' | 'other')}
          >
            <FormControlLabel 
              value="letsencrypt" 
              control={<Radio />} 
              label="Let's Encrypt (Free, Automated)" 
            />
            <FormControlLabel 
              value="other" 
              control={<Radio />} 
              label="Custom Certificate (Upload files)" 
            />
          </RadioGroup>
        </FormControl>

        {data.provider === 'letsencrypt' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Let's Encrypt certificates are free and automatically renewed. 
            Configure the settings in the Let's Encrypt tab.
          </Alert>
        )}

        {data.provider === 'other' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Upload your own certificate files. You'll need the certificate, 
            private key, and optionally an intermediate certificate.
          </Alert>
        )}
      </FormSection>
    </Box>
  )
}

// Let's Encrypt Tab Component
interface LetsEncryptTabProps {
  data: CertificateFormData
  setFieldValue: (field: keyof CertificateFormData, value: any) => void
  errors: Record<string, string>
  testingDomains: boolean
  testResult: { reachable: boolean; error?: string } | null
  onTestDomains: () => void
}

function LetsEncryptTab({ 
  data, 
  setFieldValue, 
  errors, 
  testingDomains, 
  testResult, 
  onTestDomains 
}: LetsEncryptTabProps) {
  if (data.provider !== 'letsencrypt') {
    return (
      <Alert severity="info">
        Select "Let's Encrypt" as the provider in the Details tab to configure these settings.
      </Alert>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormSection title="Account Settings" required>
        <TextField
          label="Email Address"
          type="email"
          value={data.letsencryptEmail}
          onChange={(e) => setFieldValue('letsencryptEmail', e.target.value)}
          error={Boolean(errors.letsencryptEmail)}
          helperText={errors.letsencryptEmail || "Used for important Let's Encrypt notifications"}
          required
          fullWidth
        />

        <FormControlLabel
          control={
            <Switch
              checked={data.letsencryptAgree}
              onChange={(e) => setFieldValue('letsencryptAgree', e.target.checked)}
            />
          }
          label="I agree to the Let's Encrypt Subscriber Agreement"
          sx={{ mt: 1 }}
        />
        {errors.letsencryptAgree && (
          <Alert severity="error" sx={{ mt: 1 }}>{errors.letsencryptAgree}</Alert>
        )}
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
          <Alert severity="info" sx={{ mt: 1 }}>
            DNS challenge allows wildcard certificates and works behind firewalls.
            Configure your DNS provider below.
          </Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ mt: 1 }}>
              HTTP challenge requires domains to be publicly accessible on port 80.
              Wildcard certificates are not supported with HTTP challenge.
            </Alert>
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={onTestDomains}
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

      {data.dnsChallenge && (
        <FormSection title="DNS Configuration" required>
          <DNSProviderSelector
            value={data.dnsProvider}
            onChange={(provider) => setFieldValue('dnsProvider', provider)}
            credentials={data.dnsProviderCredentials}
            onCredentialsChange={(credentials) => setFieldValue('dnsProviderCredentials', credentials)}
            error={errors.dnsProvider || errors.dnsProviderCredentials}
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
        </FormSection>
      )}
    </Box>
  )
}

// Custom Certificate Tab Component
interface CustomCertificateTabProps {
  data: CertificateFormData
  setFieldValue: (field: keyof CertificateFormData, value: any) => void
  errors: Record<string, string>
}

function CustomCertificateTab({ data, setFieldValue, errors }: CustomCertificateTabProps) {
  if (data.provider !== 'other') {
    return (
      <Alert severity="info">
        Select "Custom Certificate" as the provider in the Details tab to upload certificate files.
      </Alert>
    )
  }

  return (
    <FormSection title="Certificate Files">
      <Stack spacing={3}>
        <FileDropzone
          label="Certificate File (Public Certificate)"
          icon={<FileIcon color="action" />}
          file={data.certificateFile}
          onFileSelect={(file) => setFieldValue('certificateFile', file)}
          accept=".pem,.crt,.cer"
          required
          validateType="certificate"
          error={errors.certificateFile}
          helperText="The SSL certificate file (should start with -----BEGIN CERTIFICATE-----)"
        />

        <FileDropzone
          label="Private Key File"
          icon={<KeyIcon color="action" />}
          file={data.certificateKeyFile}
          onFileSelect={(file) => setFieldValue('certificateKeyFile', file)}
          accept=".key,.pem"
          required
          validateType="key"
          error={errors.certificateKeyFile}
          helperText="The private key file (should start with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----)"
        />

        <FileDropzone
          label="Intermediate Certificate File (optional)"
          icon={<ChainIcon color="action" />}
          file={data.intermediateCertificateFile}
          onFileSelect={(file) => setFieldValue('intermediateCertificateFile', file)}
          accept=".pem,.crt,.cer"
          helperText="Optional intermediate certificate for certificate chain validation"
        />
      </Stack>
    </FormSection>
  )
}