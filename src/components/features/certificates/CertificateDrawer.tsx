import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TextField,
  FormControlLabel,
  // FormControl,
  Switch,
  Box,
  // RadioGroup,
  // Radio,
  Alert,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material'
import {
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Description as FileIcon,
  Key as KeyIcon,
  AccountTree as ChainIcon,
} from '@mui/icons-material'
import { Certificate, CreateCertificate, certificatesApi } from '../../../api/certificates'
import { getErrorMessage } from '../../../types/common'
import BaseDrawer from '../../base/BaseDrawer'
import FormSection from '../../shared/FormSection'
import DomainInput from '../../DomainInput'
import { useDrawerForm } from '../../../hooks/useDrawerForm'
import FileDropzone from './components/FileDropzone'
import DNSProviderSelector from './components/DNSProviderSelector'
import { useToast } from '../../../contexts/ToastContext'
import { NAVIGATION_CONFIG } from '../../../constants/navigation'

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

  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()

  const [testingDomains, setTestingDomains] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ reachable: boolean; error?: string } | null>(null)
  const [customError, setCustomError] = React.useState<string | null>(null)

  const isEditMode = !!certificate

  const {
    data,
    setFieldValue,
    loading,
    globalError,
    errors,
    handleSubmit,
    resetForm,
    isDirty,
    isValid,
    touched,
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
        required: true, initialValue: undefined,
      },
      niceName: {
        initialValue: '',
        required: false,
        validate: (name: string, formData: any) => {
          if (formData?.provider === 'other' && !name) {
            return 'Certificate name is required for custom certificates'
          }
          return null
        }
      },
      domainNames: {
        initialValue: [],
        required: false,
        validate: (domains: string[], formData: any) => {
          if (formData?.provider === 'letsencrypt' && domains.length === 0) {
            return 'At least one domain name is required for Let\'s Encrypt certificates'
          }
          return null
        }
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
        // validate: (provider: string, data: any) => {
        //   if (data.provider === 'letsencrypt' && data.dnsChallenge && !provider) {
        //     return 'DNS provider is required when DNS challenge is enabled'
        //   }
        //   return null
        // }
      },
      dnsProviderCredentials: {
        initialValue: '',
        // validate: (credentials: string, data: any) => {
        //   if (data.provider === 'letsencrypt' && data.dnsChallenge && data.dnsProvider && !credentials) {
        //     return 'DNS provider credentials are required'
        //   }
        //   return null
        // }
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
    onSuccess: (data) => {
      showSuccess('certificate', isEditMode ? 'updated' : 'created', data.niceName || data.domainNames[0])
    },
    onError: (error) => {
      showError('certificate', isEditMode ? 'update' : 'create', error.message, data.niceName || data.domainNames[0])
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
        domain_names: data.provider === 'letsencrypt' ? data.domainNames : [],
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

      try {
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
            // if (!data.certificateFile || !data.certificateKeyFile) {
            //   throw new Error('Certificate and key files are required')
            // }

            // Only validate and upload if files are provided
            if (data.certificateFile && data.certificateKeyFile) {
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
            } else {
              // Create certificate entry without files - let API handle validation
              await certificatesApi.create(payload)
            }
          }
        }

        onSave()
        onClose()
      } catch (error: any) {
        // Check if it's a 500 error with debug info
        if (error.response?.status === 500 && error.response?.data?.debug?.stack) {
          // Extract all lines from stack and format them
          const stack = error.response.data.debug.stack
          let errorMessage = 'Certificate creation failed:\n\n'
          
          // Join all stack lines with line breaks, filtering out empty lines and stack traces
          const stackLines = stack
            .filter((line: string) => {
              // Filter out empty lines
              if (line.trim() === '') return false
              // Filter out stack trace lines (lines that start with spaces followed by "at")
              if (line.match(/^\s+at\s/)) return false
              return true
            })
            .map((line: string) => line.replace('CommandError: ', ''))
            .join('\n')
          
          errorMessage += stackLines
          
          // Set custom error to display
          setCustomError(errorMessage)
          
          // Don't close the drawer on error - return early to prevent further processing
          return
        }
        
        // Re-throw other errors to be handled by the form
        throw error
      }
    },
    autoSave: {
      enabled: true,
      delay: 3000,
      onAutoSave: async (data) => {
        if (isEditMode && isDirty && data.provider === 'letsencrypt') {
          // Auto-save Let's Encrypt configuration
        }
      }
    }
  })

  // Memoize callbacks to prevent unnecessary re-renders in DNSProviderSelector
  const handleDnsProviderChange = React.useCallback((provider: string) => {
    setFieldValue('dnsProvider', provider)
  }, [setFieldValue])
  
  const handleDnsCredentialsChange = React.useCallback((credentials: string) => {
    setFieldValue('dnsProviderCredentials', credentials)
  }, [setFieldValue])

  // Update form data when certificate prop changes (for edit mode)
  React.useEffect(() => {
    if (certificate && open) {
      // Reset form with certificate data
      resetForm({
        provider: certificate.provider,
        niceName: certificate.nice_name || '',
        domainNames: certificate.domain_names || [],
        letsencryptEmail: certificate.meta?.letsencrypt_email || '',
        letsencryptAgree: certificate.meta?.letsencrypt_agree || false,
        dnsChallenge: certificate.meta?.dns_challenge || false,
        dnsProvider: certificate.meta?.dns_provider || '',
        dnsProviderCredentials: certificate.meta?.dns_provider_credentials || '',
        propagationSeconds: certificate.meta?.propagation_seconds || 120,
        certificateFile: null,
        certificateKeyFile: null,
        intermediateCertificateFile: null,
      })
    }
  }, [certificate, open, resetForm])

  // Update provider when initialProvider changes (e.g., switching between Let's Encrypt and Custom)
  React.useEffect(() => {
    if (!certificate && open) {
      setFieldValue('provider', initialProvider)
    }
  }, [initialProvider, certificate, open, setFieldValue])

  // Clear custom error when drawer closes
  React.useEffect(() => {
    if (!open) {
      setCustomError(null)
    }
  }, [open])

  const handleTestDomains = async () => {
    if (!data || data.domainNames.length === 0) {
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

  // Handle provider change and update route
  const _handleProviderChange = React.useCallback((newProvider: 'letsencrypt' | 'other') => {
    setFieldValue('provider', newProvider)
    
    // Update the route when provider changes
    if (!isEditMode) {
      const newPath = `/security/certificates/new/${newProvider === 'letsencrypt' ? 'letsencrypt' : 'other'}`
      navigate(newPath, { replace: true })
    }
  }, [setFieldValue, navigate, isEditMode])

  // Determine the current provider - use data if available, otherwise use initial values
  const currentProvider = data?.provider || certificate?.provider || initialProvider

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Certificate' : 'Add SSL Certificate'}
      titleIcon={React.createElement(NAVIGATION_CONFIG.certificates.icon, { sx: { color: NAVIGATION_CONFIG.certificates.color } })}
      subtitle={isEditMode ? (data?.niceName || data?.domainNames?.[0] || 'SSL Certificate') : (data?.domainNames?.[0] || 'SSL Certificate')}
      loading={loading}
      error={customError || globalError || undefined}
      isDirty={isDirty}
      onSave={handleSubmit}
      saveDisabled={!isValid}
      saveText={isEditMode ? 'Save Changes' : 'Create Certificate'}
      confirmClose={isDirty}
      width={600}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {isEditMode && (
          <Alert severity="info" icon={<InfoIcon />}>
            For existing certificates, only the name can be changed. Domain names and other certificate properties cannot be edited as the certificate is already signed.
          </Alert>
        )}

        {/* Domain Names Section - Only for Let's Encrypt */}
        {currentProvider === 'letsencrypt' && (
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
        )}


        {/* Let's Encrypt Configuration */}
        {currentProvider === 'letsencrypt' && !isEditMode && (
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

        {/* Custom Certificate Upload */}
        {currentProvider === 'other' && !isEditMode && (
          <>
            <FormSection title="Certificate Name" required>
              <TextField
                label="Certificate Name"
                value={data.niceName}
                onChange={(e) => setFieldValue('niceName', e.target.value)}
                placeholder="e.g. Production SSL Certificate"
                fullWidth
                required
                error={Boolean(errors.niceName && touched.niceName)}
                helperText={errors.niceName && touched.niceName ? errors.niceName : "A friendly name to identify this certificate"}
              />
            </FormSection>

            <FormSection title="Certificate Files" required>
              <Stack spacing={3}>
              <FileDropzone
                label="Certificate File"
                icon={<FileIcon color="action" />}
                file={data.certificateFile}
                onFileSelect={(file) => setFieldValue('certificateFile', file)}
                accept=".pem,.crt,.cer"
                required
                validateType="certificate"
                helperText="The SSL certificate file (should start with -----BEGIN CERTIFICATE-----)"
              />

              <FileDropzone
                label="Private Key"
                icon={<KeyIcon color="action" />}
                file={data.certificateKeyFile}
                onFileSelect={(file) => setFieldValue('certificateKeyFile', file)}
                accept=".key,.pem"
                required
                validateType="key"
                helperText="The private key file (should start with -----BEGIN PRIVATE KEY-----)"
              />

              <FileDropzone
                label="Intermediate Certificate (optional)"
                icon={<ChainIcon color="action" />}
                file={data.intermediateCertificateFile}
                onFileSelect={(file) => setFieldValue('intermediateCertificateFile', file)}
                accept=".pem,.crt,.cer"
                helperText="Optional intermediate certificate for certificate chain validation"
              />
              </Stack>
            </FormSection>
          </>
        )}

        {/* Nice Name - Show for Let's Encrypt (optional) and in edit mode */}
        {(currentProvider === 'letsencrypt' || isEditMode) && (
          <FormSection title="Certificate Name" required={false}>
            <TextField
              label="Nice Name"
              value={data.niceName}
              onChange={(e) => setFieldValue('niceName', e.target.value)}
              placeholder="Friendly name for this certificate"
              fullWidth
              helperText="Optional friendly name to identify this certificate"
            />
          </FormSection>
        )}
      </Box>
    </BaseDrawer>
  )
}