import { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
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
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  Language as LanguageIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { ProxyHost, CreateProxyHost, UpdateProxyHost, proxyHostsApi } from '../api/proxyHosts'
import { AccessList, accessListsApi } from '../api/accessLists'
import { Certificate, certificatesApi } from '../api/certificates'
import DomainInput from './DomainInput'

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
      id={`proxy-host-tabpanel-${index}`}
      aria-labelledby={`proxy-host-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

interface ProxyHostDrawerProps {
  open: boolean
  onClose: () => void
  host?: ProxyHost | null
  onSave: () => void
}

export default function ProxyHostDrawer({ open, onClose, host, onSave }: ProxyHostDrawerProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
  const [forwardScheme, setForwardScheme] = useState<'http' | 'https'>('http')
  const [forwardHost, setForwardHost] = useState('')
  const [forwardPort, setForwardPort] = useState('80')
  const [cacheAssets, setCacheAssets] = useState(false)
  const [blockExploits, setBlockExploits] = useState(false)
  const [websocketSupport, setWebsocketSupport] = useState(false)
  const [accessListId, setAccessListId] = useState(0)
  
  // SSL settings
  const [sslEnabled, setSslEnabled] = useState(false)
  const [forceSSL, setForceSSL] = useState(false)
  const [http2Support, setHttp2Support] = useState(false)
  const [hstsEnabled, setHstsEnabled] = useState(false)
  const [hstsSubdomains, setHstsSubdomains] = useState(false)
  const [certificateId, setCertificateId] = useState(0)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  
  // Advanced
  const [advancedConfig, setAdvancedConfig] = useState('')

  // Data for selectors
  const [accessLists, setAccessLists] = useState<AccessList[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const isEditMode = !!host

  useEffect(() => {
    if (host) {
      // Load existing host data
      setDomainNames(host.domain_names)
      setForwardScheme(host.forward_scheme)
      setForwardHost(host.forward_host)
      setForwardPort(host.forward_port.toString())
      setCacheAssets(host.caching_enabled)
      setBlockExploits(host.block_exploits)
      setWebsocketSupport(host.allow_websocket_upgrade)
      setAccessListId(host.access_list_id)
      setSslEnabled(host.certificate_id > 0)
      setForceSSL(host.ssl_forced)
      setHttp2Support(host.http2_support)
      setHstsEnabled(host.hsts_enabled)
      setHstsSubdomains(host.hsts_subdomains)
      setCertificateId(host.certificate_id)
      setAdvancedConfig(host.advanced_config)
      // Set selected certificate after certificates are loaded
      if (host.certificate_id && certificates.length > 0) {
        const cert = certificates.find(c => c.id === host.certificate_id)
        setSelectedCertificate(cert || null)
      }
    } else {
      // Reset form for new host
      setDomainNames([])
      setForwardScheme('http')
      setForwardHost('')
      setForwardPort('80')
      setCacheAssets(false)
      setBlockExploits(false)
      setWebsocketSupport(false)
      setAccessListId(0)
      setSslEnabled(false)
      setForceSSL(false)
      setHttp2Support(false)
      setHstsEnabled(false)
      setHstsSubdomains(false)
      setCertificateId(0)
      setSelectedCertificate(null)
      setAdvancedConfig('')
      setActiveTab(0)
    }
    setError(null)
  }, [host, certificates])

  // Load access lists and certificates when drawer opens
  useEffect(() => {
    if (open) {
      loadSelectorData()
    }
  }, [open])

  const loadSelectorData = async () => {
    try {
      setLoadingData(true)
      const [accessListsData, certificatesData] = await Promise.all([
        accessListsApi.getAll(),
        certificatesApi.getAll()
      ])
      setAccessLists(accessListsData)
      
      // Sort certificates by expiry status and name
      const sortedCertificates = [...certificatesData].sort((a, b) => {
        const daysA = getDaysUntilExpiry(a.expires_on) || 0
        const daysB = getDaysUntilExpiry(b.expires_on) || 0
        
        // First sort by expiry status (expired/expiring soon first)
        if ((daysA <= 0) !== (daysB <= 0)) return daysA <= 0 ? -1 : 1
        if ((daysA <= 30) !== (daysB <= 30)) return daysA <= 30 ? -1 : 1
        
        // Then by name
        const nameA = a.nice_name || a.domain_names[0] || ''
        const nameB = b.nice_name || b.domain_names[0] || ''
        return nameA.localeCompare(nameB)
      })
      
      setCertificates(sortedCertificates)
    } catch (err) {
      console.error('Failed to load selector data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate
      if (domainNames.length === 0) {
        throw new Error('At least one domain name is required')
      }
      if (!forwardHost) {
        throw new Error('Forward host is required')
      }
      const port = parseInt(forwardPort)
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('Forward port must be between 1 and 65535')
      }

      // Additional SSL validation
      if (sslEnabled && certificateId <= 0) {
        throw new Error('Please select an SSL certificate')
      }

      const data: CreateProxyHost | UpdateProxyHost = {
        domain_names: domainNames,
        forward_scheme: forwardScheme,
        forward_host: forwardHost,
        forward_port: port,
        caching_enabled: cacheAssets,
        block_exploits: blockExploits,
        allow_websocket_upgrade: websocketSupport,
        access_list_id: accessListId || undefined,
        certificate_id: sslEnabled ? certificateId : undefined,
        ssl_forced: sslEnabled && forceSSL,
        http2_support: sslEnabled && http2Support,
        hsts_enabled: sslEnabled && hstsEnabled,
        hsts_subdomains: sslEnabled && hstsSubdomains,
        advanced_config: advancedConfig,
      }

      if (isEditMode) {
        await proxyHostsApi.update(host.id, data as UpdateProxyHost)
      } else {
        await proxyHostsApi.create(data)
      }

      onSave()
      onClose()
    } catch (err: any) {
      // Check for error in different response formats
      const errorMessage = err.response?.data?.error?.message || 
                         err.response?.data?.message || 
                         err.message || 
                         'Failed to save proxy host'
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 600 } }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon color="primary" />
            <Typography variant="h6">
              {isEditMode ? 'Edit Proxy Host' : 'New Proxy Host'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab 
              label="Details" 
              icon={<InfoIcon />} 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              label="SSL" 
              icon={<LockIcon />} 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              label="Advanced" 
              icon={<CodeIcon />} 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <TabPanel value={activeTab} index={0}>
            {/* Details Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <DomainInput
                value={domainNames}
                onChange={setDomainNames}
                helperText="Press Enter after each domain or paste multiple domains. Wildcards are supported."
                required
              />

              <FormControl component="fieldset">
                <FormLabel component="legend">Scheme</FormLabel>
                <RadioGroup
                  row
                  value={forwardScheme}
                  onChange={(e) => setForwardScheme(e.target.value as 'http' | 'https')}
                >
                  <FormControlLabel value="http" control={<Radio />} label="HTTP" />
                  <FormControlLabel value="https" control={<Radio />} label="HTTPS" />
                </RadioGroup>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Forward Hostname / IP"
                  value={forwardHost}
                  onChange={(e) => setForwardHost(e.target.value)}
                  placeholder="192.168.1.1 or example.com"
                  required
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Forward Port"
                  value={forwardPort}
                  onChange={(e) => setForwardPort(e.target.value)}
                  type="number"
                  InputProps={{
                    inputProps: { min: 1, max: 65535 }
                  }}
                  required
                  sx={{ width: 120 }}
                />
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cacheAssets}
                      onChange={(e) => setCacheAssets(e.target.checked)}
                    />
                  }
                  label="Cache Assets"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={blockExploits}
                      onChange={(e) => setBlockExploits(e.target.checked)}
                    />
                  }
                  label="Block Common Exploits"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={websocketSupport}
                      onChange={(e) => setWebsocketSupport(e.target.checked)}
                    />
                  }
                  label="Websockets Support"
                />
              </Box>

              <Divider />

              <FormControl fullWidth>
                <InputLabel>Access List</InputLabel>
                <Select
                  value={accessListId}
                  onChange={(e) => setAccessListId(Number(e.target.value))}
                  label="Access List"
                  startAdornment={
                    <InputAdornment position="start">
                      <SecurityIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value={0}>
                    <em>Publicly Accessible</em>
                  </MenuItem>
                  {loadingData ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} />
                    </MenuItem>
                  ) : (
                    accessLists.map((list) => (
                      <MenuItem key={list.id} value={list.id}>
                        {list.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* SSL Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={sslEnabled}
                    onChange={(e) => setSslEnabled(e.target.checked)}
                  />
                }
                label="SSL"
              />

              {sslEnabled && (
                <>
                  <Autocomplete
                    fullWidth
                    value={selectedCertificate}
                    onChange={(event, newValue) => {
                      setSelectedCertificate(newValue)
                      setCertificateId(newValue?.id || 0)
                    }}
                    options={certificates}
                    loading={loadingData}
                    getOptionLabel={(option) => option.nice_name || option.domain_names.join(', ')}
                    renderOption={(props, option) => {
                      const status = getCertificateStatus(option)
                      const StatusIcon = status.icon
                      
                      return (
                        <Box component="li" {...props}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="body2">
                                {option.nice_name || option.domain_names.join(', ')}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <StatusIcon fontSize="small" color={status.color} />
                                <Typography variant="caption" color={`${status.color}.main`}>
                                  {status.text}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={option.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom'} 
                                size="small" 
                                color={option.provider === 'letsencrypt' ? 'primary' : 'default'}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {option.domain_names.slice(0, 2).join(', ')}
                                {option.domain_names.length > 2 && ` +${option.domain_names.length - 2} more`}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="SSL Certificate"
                        placeholder="Search for a certificate..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <LockIcon />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    filterOptions={(options, { inputValue }) => {
                      const filtered = options.filter(option => {
                        const searchValue = inputValue.toLowerCase()
                        const niceName = option.nice_name?.toLowerCase() || ''
                        const domains = option.domain_names.map(d => d.toLowerCase())
                        
                        return niceName.includes(searchValue) || 
                               domains.some(domain => domain.includes(searchValue))
                      })
                      
                      return filtered
                    }}
                    noOptionsText={loadingData ? "Loading certificates..." : "No certificates found"}
                  />
                  
                  {selectedCertificate && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        This certificate covers: {selectedCertificate.domain_names.join(', ')}
                      </Typography>
                    </Alert>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="text"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => window.location.href = '/security/certificates'}
                    >
                      Request a new SSL Certificate
                    </Button>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={forceSSL}
                        onChange={(e) => setForceSSL(e.target.checked)}
                      />
                    }
                    label="Force SSL"
                  />

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
                      />
                    }
                    label="HSTS Enabled"
                  />

                  {hstsEnabled && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={hstsSubdomains}
                          onChange={(e) => setHstsSubdomains(e.target.checked)}
                        />
                      }
                      label="HSTS Subdomains"
                      sx={{ ml: 4 }}
                    />
                  )}
                </>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {/* Advanced Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning">
                Please note, that any add_header or set_header directives added here will not be 
                used by nginx. You will have to add a custom location '/' and add the header 
                directives there.
              </Alert>
              
              <TextField
                label="Custom Nginx Configuration"
                multiline
                rows={10}
                value={advancedConfig}
                onChange={(e) => setAdvancedConfig(e.target.value)}
                placeholder="# Add your custom Nginx configuration here"
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }
                }}
              />
            </Box>
          </TabPanel>
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}