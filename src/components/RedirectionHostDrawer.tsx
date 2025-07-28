import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Select,
  MenuItem,
  InputLabel,
  Autocomplete,
  FormHelperText,
} from '@mui/material'
import {
  
  Add as AddIcon,
  Lock as LockIcon,
  Code as CodeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingFlat as RedirectIcon,
} from '@mui/icons-material'
import { RedirectionHost, CreateRedirectionHost, redirectionHostsApi } from '../api/redirectionHosts'
import { Certificate, certificatesApi } from '../api/certificates'
import CertificateDrawer from './CertificateDrawer'
import DomainInput from './DomainInput'
import AdaptiveContainer from './AdaptiveContainer'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`redirection-host-tabpanel-${index}`}
      aria-labelledby={`redirection-host-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

interface RedirectionHostDrawerProps {
  open: boolean
  onClose: () => void
  host?: RedirectionHost | null
  onSave: () => void
}

export default function RedirectionHostDrawer({ open, onClose, host, onSave }: RedirectionHostDrawerProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certificateDrawerOpen, setCertificateDrawerOpen] = useState(false)
  
  // Helper functions for certificate status
  const getDaysUntilExpiry = (expiresOn: string | null) => {
    if (!expiresOn) return null
    const expiryDate = new Date(expiresOn)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  const getCertificateStatus = (cert: Certificate) => {
    const days = getDaysUntilExpiry(cert.expires_on)
    if (!days || days < 0) return { color: 'error' as const, text: 'Expired', icon: WarningIcon }
    if (days <= 7) return { color: 'error' as const, text: `${days} days`, icon: WarningIcon }
    if (days <= 30) return { color: 'warning' as const, text: `${days} days`, icon: WarningIcon }
    return { color: 'success' as const, text: `${days} days`, icon: CheckCircleIcon }
  }
  
  // Form state
  const [domainNames, setDomainNames] = useState<string[]>([])
  const [forwardScheme, setForwardScheme] = useState<string>('http')
  const [forwardDomainName, setForwardDomainName] = useState('')
  const [forwardHttpCode, setForwardHttpCode] = useState(301)
  const [preservePath, setPreservePath] = useState(true)
  const [blockExploits, setBlockExploits] = useState(false)
  const [certificateId, setCertificateId] = useState<number | string>(0)
  const [sslForced, setSslForced] = useState(false)
  const [hstsEnabled, setHstsEnabled] = useState(false)
  const [hstsSubdomains, setHstsSubdomains] = useState(false)
  const [http2Support, setHttp2Support] = useState(false)
  const [advancedConfig, setAdvancedConfig] = useState('')
  const [enabled, setEnabled] = useState(true)
  
  // Let's Encrypt options
  const [useLetsEncrypt, setUseLetsEncrypt] = useState(false)
  const [letsencryptEmail, setLetsencryptEmail] = useState('')
  const [letsencryptAgree, setLetsencryptAgree] = useState(false)
  const [dnsChallenge, setDnsChallenge] = useState(false)
  const [dnsProvider, setDnsProvider] = useState('')
  const [dnsProviderCredentials, setDnsProviderCredentials] = useState('')
  const [propagationSeconds, setPropagationSeconds] = useState('')

  useEffect(() => {
    if (open) {
      loadCertificates()
      if (host) {
        // Populate form with existing host data
        setDomainNames(host.domain_names)
        setForwardScheme(host.forward_scheme)
        setForwardDomainName(host.forward_domain_name)
        setForwardHttpCode(host.forward_http_code)
        setPreservePath(host.preserve_path)
        setBlockExploits(host.block_exploits)
        setCertificateId(host.certificate_id || 0)
        setSslForced(host.ssl_forced)
        setHstsEnabled(host.hsts_enabled)
        setHstsSubdomains(host.hsts_subdomains)
        setHttp2Support(host.http2_support)
        setAdvancedConfig(host.advanced_config)
        setEnabled(host.enabled)
        setUseLetsEncrypt(false)
        
        // Meta fields
        if (host.meta) {
          setDnsChallenge(host.meta.dns_challenge || false)
          setDnsProvider(host.meta.dns_provider || '')
          setDnsProviderCredentials(host.meta.dns_provider_credentials || '')
          setPropagationSeconds(host.meta.propagation_seconds?.toString() || '')
          setLetsencryptEmail(host.meta.letsencrypt_email || '')
        }
      } else {
        // Reset form for new host
        resetForm()
      }
      setActiveTab(0)
      setError(null)
    }
  }, [open, host])

  const resetForm = () => {
    setDomainNames([])
    setForwardScheme('http')
    setForwardDomainName('')
    setForwardHttpCode(301)
    setPreservePath(true)
    setBlockExploits(false)
    setCertificateId(0)
    setSslForced(false)
    setHstsEnabled(false)
    setHstsSubdomains(false)
    setHttp2Support(false)
    setAdvancedConfig('')
    setEnabled(true)
    setUseLetsEncrypt(false)
    setLetsencryptEmail('')
    setLetsencryptAgree(false)
    setDnsChallenge(false)
    setDnsProvider('')
    setDnsProviderCredentials('')
    setPropagationSeconds('')
  }

  const loadCertificates = async () => {
    try {
      const certs = await certificatesApi.getAll()
      setCertificates(certs)
    } catch (err: any) {
      console.error('Failed to load certificates:', err)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate required fields
      if (domainNames.length === 0) {
        setError('Domain names are required')
        setActiveTab(0)
        return
      }

      if (!forwardDomainName.trim()) {
        setError('Forward domain is required')
        setActiveTab(0)
        return
      }
      
      // Prepare data
      const data: CreateRedirectionHost = {
        domain_names: domainNames,
        forward_scheme: forwardScheme,
        forward_domain_name: forwardDomainName,
        forward_http_code: forwardHttpCode,
        preserve_path: preservePath,
        block_exploits: blockExploits,
        ssl_forced: sslForced,
        hsts_enabled: hstsEnabled,
        hsts_subdomains: hstsSubdomains,
        http2_support: http2Support,
        advanced_config: advancedConfig,
      }

      // Handle certificate
      if (certificateId === 'new' && useLetsEncrypt) {
        if (!letsencryptEmail) {
          setError('Let\'s Encrypt email is required')
          setActiveTab(1)
          return
        }
        if (!letsencryptAgree) {
          setError('You must agree to Let\'s Encrypt terms')
          setActiveTab(1)
          return
        }
        
        data.certificate_id = undefined
        data.meta = {
          letsencrypt_email: letsencryptEmail,
          letsencrypt_agree: letsencryptAgree,
          dns_challenge: dnsChallenge,
        }
        
        if (dnsChallenge) {
          if (!dnsProvider) {
            setError('DNS provider is required for DNS challenge')
            setActiveTab(1)
            return
          }
          data.meta.dns_provider = dnsProvider
          data.meta.dns_provider_credentials = dnsProviderCredentials
          if (propagationSeconds) {
            data.meta.propagation_seconds = parseInt(propagationSeconds)
          }
        }
      } else if (certificateId && certificateId !== 0) {
        data.certificate_id = parseInt(certificateId.toString())
      }

      if (host) {
        // Update existing host
        await redirectionHostsApi.update({ ...data, id: host.id })
      } else {
        // Create new host
        await redirectionHostsApi.create(data)
      }

      onSave()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to save redirection host')
    } finally {
      setLoading(false)
    }
  }

  const httpStatusCodes = [
    { value: 300, label: '300 Multiple Choices' },
    { value: 301, label: '301 Moved Permanently' },
    { value: 302, label: '302 Found' },
    { value: 303, label: '303 See Other' },
    { value: 307, label: '307 Temporary Redirect' },
    { value: 308, label: '308 Permanent Redirect' },
  ]

  const dnsProviders = [
    { value: 'cloudflare', label: 'Cloudflare' },
    { value: 'digitalocean', label: 'DigitalOcean' },
    { value: 'duckdns', label: 'DuckDNS' },
    { value: 'godaddy', label: 'GoDaddy' },
    { value: 'google', label: 'Google' },
    { value: 'hetzner', label: 'Hetzner' },
    { value: 'linode', label: 'Linode' },
    { value: 'route53', label: 'AWS Route53' },
    // Add more providers as needed
  ]

  const operation = host ? 'edit' : 'create'
  const title = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <RedirectIcon sx={{ color: '#f1c40f' }} />
      <Typography variant="h6">
        {host ? 'Edit Redirection Host' : 'Add Redirection Host'}
      </Typography>
    </Box>
  )

  return (
    <>
      <AdaptiveContainer
        open={open}
        onClose={onClose}
        entity="redirection_hosts"
        operation={operation}
        title={title}
        actions={
          <>
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {host ? 'Save Changes' : 'Create'}
            </Button>
          </>
        }
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab 
              icon={<RedirectIcon />} 
              label="Details" 
              iconPosition="start"
            />
            <Tab 
              icon={<LockIcon />} 
              label="SSL" 
              iconPosition="start"
            />
            <Tab 
              icon={<CodeIcon />} 
              label="Advanced" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ px: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Source
                </Typography>
                
                <DomainInput
                  value={domainNames}
                  onChange={setDomainNames}
                  required
                />

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Destination
                </Typography>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Forward Scheme</InputLabel>
                  <Select
                    value={forwardScheme}
                    onChange={(e) => setForwardScheme(e.target.value)}
                    label="Forward Scheme"
                  >
                    <MenuItem value="http">HTTP</MenuItem>
                    <MenuItem value="https">HTTPS</MenuItem>
                  </Select>
                  <FormHelperText>Choose the scheme for the redirect destination</FormHelperText>
                </FormControl>

                <TextField
                  fullWidth
                  label="Forward Domain"
                  value={forwardDomainName}
                  onChange={(e) => setForwardDomainName(e.target.value)}
                  placeholder="example.com or example.com/path"
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <RedirectIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel>HTTP Status Code</InputLabel>
                  <Select
                    value={forwardHttpCode}
                    onChange={(e) => setForwardHttpCode(Number(e.target.value))}
                    label="HTTP Status Code"
                  >
                    {httpStatusCodes.map(code => (
                      <MenuItem key={code.value} value={code.value}>
                        {code.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Options
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={preservePath}
                      onChange={(e) => setPreservePath(e.target.checked)}
                    />
                  }
                  label="Preserve Path"
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2, display: 'block' }}>
                  Append the request path to the forward domain
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={blockExploits}
                      onChange={(e) => setBlockExploits(e.target.checked)}
                    />
                  }
                  label="Block Common Exploits"
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2, display: 'block' }}>
                  Prevent common exploits like SQL injection attempts
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                    />
                  }
                  label="Enabled"
                />
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ px: 2 }}>
                <Autocomplete
                  value={certificates.find(c => c.id === certificateId) || null}
                  onChange={(_, newValue) => {
                    if (newValue === 'new' as any) {
                      setCertificateId('new')
                      setUseLetsEncrypt(true)
                    } else if (newValue) {
                      setCertificateId(newValue.id)
                      setUseLetsEncrypt(false)
                    } else {
                      setCertificateId(0)
                      setUseLetsEncrypt(false)
                    }
                  }}
                  options={[
                    ...(certificates || []),
                    { id: 'new', nice_name: 'Request a new SSL Certificate', provider: 'letsencrypt' } as any
                  ]}
                  getOptionLabel={(option: any) => option.nice_name || ''}
                  renderOption={(props, option: any) => (
                    <Box component="li" {...props}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            {option.nice_name}
                          </Typography>
                          {option.id !== 'new' && option.expires_on && (() => {
                            const status = getCertificateStatus(option)
                            const IconComponent = status.icon
                            return (
                              <Chip
                                size="small"
                                label={status.text}
                                color={status.color}
                                icon={<IconComponent />}
                              />
                            )
                          })()}
                        </Box>
                        {option.domain_names && (
                          <Typography variant="caption" color="text.secondary">
                            {option.domain_names.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="SSL Certificate"
                      margin="normal"
                      helperText="Choose an existing certificate or request a new one"
                    />
                  )}
                />

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setCertificateDrawerOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Add Certificate
                </Button>

                {(certificateId !== 0 && certificateId !== 'new') && (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={sslForced}
                          onChange={(e) => setSslForced(e.target.checked)}
                        />
                      }
                      label="Force SSL"
                      sx={{ mt: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2, display: 'block' }}>
                      Redirect all HTTP traffic to HTTPS
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={http2Support}
                          onChange={(e) => setHttp2Support(e.target.checked)}
                        />
                      }
                      label="HTTP/2 Support"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={hstsEnabled}
                          onChange={(e) => setHstsEnabled(e.target.checked)}
                          disabled={!sslForced}
                        />
                      }
                      label="HSTS Enabled"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2, display: 'block' }}>
                      HTTP Strict Transport Security
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={hstsSubdomains}
                          onChange={(e) => setHstsSubdomains(e.target.checked)}
                          disabled={!hstsEnabled}
                        />
                      }
                      label="HSTS Subdomains"
                      sx={{ ml: 4 }}
                    />
                  </>
                )}

                {useLetsEncrypt && certificateId === 'new' && (
                  <Box sx={{ mt: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      A new Let's Encrypt certificate will be requested when you save
                    </Alert>

                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={letsencryptEmail}
                      onChange={(e) => setLetsencryptEmail(e.target.value)}
                      margin="normal"
                      required
                      helperText="For Let's Encrypt notifications"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={dnsChallenge}
                          onChange={(e) => setDnsChallenge(e.target.checked)}
                        />
                      }
                      label="Use DNS Challenge"
                      sx={{ mt: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2, display: 'block' }}>
                      Required for wildcard certificates
                    </Typography>

                    {dnsChallenge && (
                      <>
                        <FormControl fullWidth margin="normal">
                          <InputLabel>DNS Provider</InputLabel>
                          <Select
                            value={dnsProvider}
                            onChange={(e) => setDnsProvider(e.target.value)}
                            label="DNS Provider"
                            required
                          >
                            {dnsProviders.map(provider => (
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
                          value={dnsProviderCredentials}
                          onChange={(e) => setDnsProviderCredentials(e.target.value)}
                          margin="normal"
                          helperText="Provider-specific API credentials"
                        />

                        <TextField
                          fullWidth
                          label="Propagation Seconds"
                          type="number"
                          value={propagationSeconds}
                          onChange={(e) => setPropagationSeconds(e.target.value)}
                          margin="normal"
                          helperText="Time to wait for DNS propagation (default: provider-specific)"
                        />
                      </>
                    )}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={letsencryptAgree}
                          onChange={(e) => setLetsencryptAgree(e.target.checked)}
                        />
                      }
                      label="I agree to the Let's Encrypt Terms of Service"
                      sx={{ mt: 2 }}
                      required
                    />
                  </Box>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ px: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Advanced configuration allows you to add custom Nginx directives.
                    Be careful, as invalid configuration can break your redirection host.
                  </Typography>
                </Alert>

                <TextField
                  fullWidth
                  label="Custom Nginx Configuration"
                  multiline
                  rows={15}
                  value={advancedConfig}
                  onChange={(e) => setAdvancedConfig(e.target.value)}
                  margin="normal"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    },
                  }}
                  helperText="Add custom Nginx directives here"
                />
              </Box>
            </TabPanel>
        </Box>
      </AdaptiveContainer>

      <CertificateDrawer
        open={certificateDrawerOpen}
        onClose={() => setCertificateDrawerOpen(false)}
        certificate={null}
        onSave={() => {
          loadCertificates()
          setCertificateDrawerOpen(false)
        }}
      />
    </>
  )
}