import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  FormHelperText,
  Input,
  Stack,
  Paper,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Description as FileIcon,
  Key as KeyIcon,
  AccountTree as ChainIcon,
  VpnKey,
} from '@mui/icons-material'
import { certificatesApi, Certificate, CreateCertificate } from '../api/certificates'
import DomainInput from './DomainInput'
import AdaptiveContainer from './AdaptiveContainer'

interface CertificateDrawerProps {
  open: boolean
  onClose: () => void
  certificate: Certificate | null
  onSave: () => void
  initialProvider?: 'letsencrypt' | 'other'
}

// DNS providers - subset of most common providers from backend/global/certbot-dns-plugins.json
const DNS_PROVIDERS: Record<string, { name: string; credentials: string | false }> = {
  'cloudflare': { name: 'Cloudflare', credentials: '# Cloudflare API token\ndns_cloudflare_api_token=0123456789abcdef0123456789abcdef01234567' },
  'digitalocean': { name: 'DigitalOcean', credentials: 'dns_digitalocean_token = 0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff' },
  'dnsimple': { name: 'DNSimple', credentials: 'dns_dnsimple_token = MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' },
  'dnsmadeeasy': { name: 'DNS Made Easy', credentials: 'dns_dnsmadeeasy_api_key = 1c1a3c91-4770-4ce7-96f4-54c0eb0e457a\ndns_dnsmadeeasy_secret_key = c9b5625f-9834-4ff8-baba-4ed5f32cae55' },
  'google': { name: 'Google', credentials: '{\n"type": "service_account",\n...\n}' },
  'godaddy': { name: 'GoDaddy', credentials: 'dns_godaddy_secret = 0123456789abcdef0123456789abcdef01234567\ndns_godaddy_key = abcdef0123456789abcdef01234567abcdef0123' },
  'hetzner': { name: 'Hetzner', credentials: 'dns_hetzner_api_token = 0123456789abcdef0123456789abcdef' },
  'linode': { name: 'Linode', credentials: 'dns_linode_key = 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ64\ndns_linode_version = [<blank>|3|4]' },
  'namecheap': { name: 'Namecheap', credentials: 'dns_namecheap_username  = 123456\ndns_namecheap_api_key      = 0123456789abcdef0123456789abcdef01234567' },
  'ovh': { name: 'OVH', credentials: 'dns_ovh_endpoint = ovh-eu\ndns_ovh_application_key = MDAwMDAwMDAwMDAw\ndns_ovh_application_secret = MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw\ndns_ovh_consumer_key = MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' },
  'route53': { name: 'Route 53 (Amazon)', credentials: '[default]\naws_access_key_id=AKIAIOSFODNN7EXAMPLE\naws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
  'vultr': { name: 'Vultr', credentials: 'dns_vultr_key = YOUR_VULTR_API_KEY' },
  'gandi': { name: 'Gandi Live DNS', credentials: '# Gandi personal access token\ndns_gandi_token=PERSONAL_ACCESS_TOKEN' },
  'azure': { name: 'Azure', credentials: '# Using a service principal (option 1)\ndns_azure_sp_client_id = 912ce44a-0156-4669-ae22-c16a17d34ca5\ndns_azure_sp_client_secret = E-xqXU83Y-jzTI6xe9fs2YC~mck3ZzUih9\ndns_azure_tenant_id = ed1090f3-ab18-4b12-816c-599af8a88cf7\n\n# Zones (at least one always required)\ndns_azure_zone1 = example.com:/subscriptions/c135abce-d87d-48df-936c-15596c6968a5/resourceGroups/dns1' },
}

const CertificateDrawer: React.FC<CertificateDrawerProps> = ({
  open,
  onClose,
  certificate,
  onSave,
  initialProvider = 'letsencrypt',
}) => {
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [testingDomains, setTestingDomains] = useState(false)
  const [testResult, setTestResult] = useState<{ reachable: boolean; error?: string } | null>(null)
  
  // Form fields
  const [provider, setProvider] = useState<'letsencrypt' | 'other'>('letsencrypt')
  const [niceName, setNiceName] = useState('')
  const [domainNames, setDomainNames] = useState<string[]>([])
  const [letsencryptEmail, setLetsencryptEmail] = useState('')
  const [letsencryptAgree, setLetsencryptAgree] = useState(false)
  const [dnsChallenge, setDnsChallenge] = useState(false)
  const [dnsProvider, setDnsProvider] = useState('')
  const [dnsProviderCredentials, setDnsProviderCredentials] = useState('')
  const [propagationSeconds, setPropagationSeconds] = useState('')
  
  // Custom certificate files
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificateKeyFile, setCertificateKeyFile] = useState<File | null>(null)
  const [intermediateCertificateFile, setIntermediateCertificateFile] = useState<File | null>(null)
  
  // File input refs
  const certificateInputRef = useRef<HTMLInputElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)
  const intermediateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (certificate) {
      setProvider(certificate.provider)
      setNiceName(certificate.nice_name || '')
      setDomainNames(certificate.domain_names || [])
      setLetsencryptEmail(certificate.meta?.letsencrypt_email || '')
      setLetsencryptAgree(certificate.meta?.letsencrypt_agree || false)
      setDnsChallenge(certificate.meta?.dns_challenge || false)
      setDnsProvider(certificate.meta?.dns_provider || '')
      setDnsProviderCredentials(certificate.meta?.dns_provider_credentials || '')
      setPropagationSeconds(certificate.meta?.propagation_seconds?.toString() || '')
    } else {
      // Reset form for new certificate
      setProvider(initialProvider)
      setNiceName('')
      setDomainNames([])
      setLetsencryptEmail('')
      setLetsencryptAgree(false)
      setDnsChallenge(false)
      setDnsProvider('')
      setDnsProviderCredentials('')
      setPropagationSeconds('')
      setCertificateFile(null)
      setCertificateKeyFile(null)
      setIntermediateCertificateFile(null)
    }
    setError(null)
    setTestResult(null)
  }, [certificate, open, initialProvider])

  useEffect(() => {
    // Update credentials template when provider changes
    if (dnsProvider && DNS_PROVIDERS[dnsProvider]?.credentials) {
      setDnsProviderCredentials(DNS_PROVIDERS[dnsProvider].credentials as string)
    }
  }, [dnsProvider])

  const handleTestDomains = async () => {
    if (domainNames.length === 0) {
      setError('Please enter at least one domain name')
      return
    }
    
    setTestingDomains(true)
    setTestResult(null)
    
    try {
      const result = await certificatesApi.testHttpReachability(domainNames)
      setTestResult(result)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to test domain reachability')
    } finally {
      setTestingDomains(false)
    }
  }

  const handleSubmit = async () => {
    if (provider === 'letsencrypt' && !letsencryptAgree) {
      setError('You must agree to the Let\'s Encrypt Subscriber Agreement')
      return
    }
    
    if (domainNames.length === 0) {
      setError('Please enter at least one domain name')
      return
    }
    
    // Check for wildcard domains without DNS challenge
    if (provider === 'letsencrypt' && !dnsChallenge) {
      const hasWildcard = domains.some(d => d.includes('*'))
      if (hasWildcard) {
        setError('Wildcard domains require DNS challenge to be enabled')
        return
      }
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data: CreateCertificate = {
        provider,
        nice_name: niceName || undefined,
        domain_names: domainNames,
      }
      
      if (provider === 'letsencrypt') {
        data.meta = {
          letsencrypt_email: letsencryptEmail,
          letsencrypt_agree: letsencryptAgree,
          dns_challenge: dnsChallenge,
        }
        
        if (dnsChallenge) {
          data.meta.dns_provider = dnsProvider
          data.meta.dns_provider_credentials = dnsProviderCredentials
          if (propagationSeconds) {
            data.meta.propagation_seconds = parseInt(propagationSeconds)
          }
        }
      } else {
        // For custom certificates, validate files first
        if (!certificateFile || !certificateKeyFile) {
          setError('Certificate and key files are required')
          setLoading(false)
          return
        }
        
        // First validate the certificate files
        setLoadingMessage('Validating certificate files...')
        
        try {
          const validationResult = await certificatesApi.validateFiles({
            certificate: certificateFile,
            certificateKey: certificateKeyFile,
            intermediateCertificate: intermediateCertificateFile || undefined
          })
          
          // Backend returns certificate info on successful validation
          // If we get here without an error, validation was successful
          if (!validationResult || (!validationResult.certificate && !validationResult.certificate_key)) {
            setError('Invalid certificate files')
            setLoading(false)
            setLoadingMessage('')
            return
          }
        } catch (err: any) {
          setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to validate certificate files')
          setLoading(false)
          setLoadingMessage('')
          return
        }
      }
      
      if (certificate) {
        // Update existing certificate
        if (provider === 'letsencrypt') {
          await certificatesApi.update(certificate.id, {
            nice_name: data.nice_name,
            meta: data.meta,
          })
        } else {
          // For custom certificates, we can only update the nice name
          await certificatesApi.update(certificate.id, {
            nice_name: data.nice_name,
          })
        }
      } else {
        // Create new certificate
        if (provider === 'letsencrypt') {
          await certificatesApi.create(data)
        } else {
          // For custom certificates:
          // 1. Create certificate entry
          setLoadingMessage('Creating certificate entry...')
          const newCert = await certificatesApi.create(data)
          
          // 2. Upload certificate files
          setLoadingMessage('Uploading certificate files...')
          await certificatesApi.upload(newCert.id, {
            certificate: certificateFile!,
            certificateKey: certificateKeyFile!,
            intermediateCertificate: intermediateCertificateFile || undefined
          })
        }
      }
      
      onSave()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to save certificate')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  // Validate file content helper
  const validateFileContent = async (file: File, type: 'certificate' | 'key'): Promise<boolean> => {
    const text = await file.text()
    const preview = text.substring(0, 100)
    
    if (type === 'certificate') {
      if (!text.includes('-----BEGIN CERTIFICATE-----')) {
        setError(`${file.name} does not appear to be a certificate file. Certificate files should start with "-----BEGIN CERTIFICATE-----"`)
        return false
      }
    } else if (type === 'key') {
      if (!text.includes('-----BEGIN') || !text.includes('KEY-----')) {
        setError(`${file.name} does not appear to be a private key file. Key files should start with "-----BEGIN PRIVATE KEY-----" or "-----BEGIN RSA PRIVATE KEY-----"`)
        return false
      }
    }
    
    return true
  }

  // Dropzone component
  const FileDropzone = ({ 
    label, 
    icon, 
    file, 
    onFileSelect, 
    inputRef, 
    accept,
    required = false,
    validateType
  }: {
    label: string
    icon: React.ReactNode
    file: File | null
    onFileSelect: (file: File) => void
    inputRef: React.RefObject<HTMLInputElement>
    accept: string
    required?: boolean
    validateType?: 'certificate' | 'key'
  }) => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label} {required && '*'}
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderWidth: 2,
          backgroundColor: 'background.default',
          transition: 'all 0.3s',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'primary.main',
          },
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) {
              if (validateType) {
                const isValid = await validateFileContent(file, validateType)
                if (!isValid) {
                  e.target.value = '' // Reset input
                  return
                }
              }
              onFileSelect(file)
            }
          }}
        />
        {file ? (
          <Box display="flex" alignItems="center" gap={2} width="100%">
            <CheckIcon color="success" sx={{ fontSize: 28 }} />
            <Box flex={1}>
              <Typography variant="body2" color="text.primary" noWrap>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={2} width="100%">
            <Box sx={{ '& > svg': { fontSize: 28 } }}>
              {icon}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Click to select file
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {accept.replace(/\./g, '').toUpperCase()} files
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  )

  const operation = certificate ? 'edit' : 'create'
  const title = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <VpnKey sx={{ color: '#467fcf' }} />
      <Typography variant="h6">
        {certificate ? 'Edit Certificate' : 'Add SSL Certificate'}
      </Typography>
    </Box>
  )

  return (
    <AdaptiveContainer
      open={open}
      onClose={onClose}
      entity="certificates"
      operation={operation}
      title={title}
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading && loadingMessage ? loadingMessage : `${certificate ? 'Update' : 'Create'} Certificate`}
          </Button>
        </>
      }
    >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Provider Selection (only for new certificates) */}
            {!certificate && (
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'letsencrypt' | 'other')}
                  label="Provider"
                >
                  <MenuItem value="letsencrypt">Let's Encrypt</MenuItem>
                  <MenuItem value="other">Custom</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Certificate Name */}
            <TextField
              fullWidth
              label="Certificate Name"
              value={niceName}
              onChange={(e) => setNiceName(e.target.value)}
              helperText="A friendly name to identify this certificate"
            />

            {/* Domain Names */}
            <DomainInput
              value={domainNames}
              onChange={setDomainNames}
              helperText="Press Enter after each domain or paste multiple domains (e.g., example.com, *.example.com)"
              required
            />

            {provider === 'letsencrypt' ? (
              <>
                {/* Let's Encrypt Email */}
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Let's Encrypt Email"
                  value={letsencryptEmail}
                  onChange={(e) => setLetsencryptEmail(e.target.value)}
                  helperText="Email for Let's Encrypt notifications"
                />

                {/* Let's Encrypt Agreement */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={letsencryptAgree}
                      onChange={(e) => setLetsencryptAgree(e.target.checked)}
                    />
                  }
                  label="I agree to the Let's Encrypt Subscriber Agreement"
                />

                {/* DNS Challenge */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={dnsChallenge}
                      onChange={(e) => setDnsChallenge(e.target.checked)}
                    />
                  }
                  label="Use DNS Challenge"
                />

                {dnsChallenge ? (
                  <>
                    {/* DNS Provider */}
                    <FormControl fullWidth required>
                      <InputLabel>DNS Provider</InputLabel>
                      <Select
                        value={dnsProvider}
                        onChange={(e) => setDnsProvider(e.target.value)}
                        label="DNS Provider"
                      >
                        <MenuItem value="">Select a provider</MenuItem>
                        {Object.entries(DNS_PROVIDERS).map(([key, provider]) => (
                          <MenuItem key={key} value={key}>
                            {provider.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* DNS Provider Credentials */}
                    {dnsProvider && DNS_PROVIDERS[dnsProvider]?.credentials && (
                      <TextField
                        fullWidth
                        required
                        label="DNS Provider Credentials"
                        value={dnsProviderCredentials}
                        onChange={(e) => setDnsProviderCredentials(e.target.value)}
                        multiline
                        rows={4}
                        helperText="Enter your DNS provider credentials in the format shown"
                        sx={{ fontFamily: 'monospace' }}
                      />
                    )}

                    {/* Propagation Seconds */}
                    <TextField
                      fullWidth
                      type="number"
                      label="Propagation Seconds"
                      value={propagationSeconds}
                      onChange={(e) => setPropagationSeconds(e.target.value)}
                      helperText="Time to wait for DNS propagation (default: provider specific)"
                    />
                  </>
                ) : (
                  /* Test Domains Button */
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={handleTestDomains}
                      disabled={testingDomains || !domainNames}
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
                )}
              </>
            ) : (
              /* Custom Certificate Upload */
              <Stack spacing={2}>
                <FileDropzone
                  label="Certificate File (Public Certificate)"
                  icon={<FileIcon color="action" />}
                  file={certificateFile}
                  onFileSelect={setCertificateFile}
                  inputRef={certificateInputRef}
                  accept=".pem,.crt,.cer"
                  required
                  validateType="certificate"
                />
                <FormHelperText>
                  The SSL certificate file (should start with -----BEGIN CERTIFICATE-----)
                </FormHelperText>

                <FileDropzone
                  label="Private Key File"
                  icon={<KeyIcon color="action" />}
                  file={certificateKeyFile}
                  onFileSelect={setCertificateKeyFile}
                  inputRef={keyInputRef}
                  accept=".key,.pem"
                  required
                  validateType="key"
                />
                <FormHelperText>
                  The private key file (should start with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----)
                </FormHelperText>

                <FileDropzone
                  label="Intermediate Certificate File (optional)"
                  icon={<ChainIcon color="action" />}
                  file={intermediateCertificateFile}
                  onFileSelect={setIntermediateCertificateFile}
                  inputRef={intermediateInputRef}
                  accept=".pem,.crt,.cer"
                />
              </Stack>
            )}
          </Stack>
    </AdaptiveContainer>
  )
}

export default CertificateDrawer