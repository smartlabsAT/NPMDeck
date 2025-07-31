import React from 'react'
import {
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  RadioGroup,
  Radio,
  FormLabel,
  Alert,
  Button,
  Autocomplete,
  Typography,
  Chip,
  InputAdornment,
} from '@mui/material'
import {
  Info as InfoIcon,
  Lock as LockIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { ProxyHost, CreateProxyHost, UpdateProxyHost, proxyHostsApi } from '../../../api/proxyHosts'
import { AccessList, accessListsApi } from '../../../api/accessLists'
import { Certificate, certificatesApi } from '../../../api/certificates'
import BaseDrawer from '../../base/BaseDrawer'
import TabPanel from '../../shared/TabPanel'
import FormSection from '../../shared/FormSection'
import DomainInput from '../../DomainInput'
import { useDrawerForm } from '../../../hooks/useDrawerForm'

interface ProxyHostDrawerProps {
  open: boolean
  onClose: () => void
  host?: ProxyHost | null
  onSave: () => void
}

interface ProxyHostFormData {
  domainNames: string[]
  forwardScheme: 'http' | 'https'
  forwardHost: string
  forwardPort: number
  cacheAssets: boolean
  blockExploits: boolean
  websocketSupport: boolean
  accessListId: number
  sslEnabled: boolean
  certificateId: number
  selectedCertificate: Certificate | null
  forceSSL: boolean
  http2Support: boolean
  hstsEnabled: boolean
  hstsSubdomains: boolean
  advancedConfig: string
}

export default function ProxyHostDrawer({ open, onClose, host, onSave }: ProxyHostDrawerProps) {
  const [activeTab, setActiveTab] = React.useState(0)
  const [accessLists, setAccessLists] = React.useState<AccessList[]>([])
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [loadingData, setLoadingData] = React.useState(false)

  const isEditMode = !!host

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

  const {
    data,
    setFieldValue,
    loading,
    globalError,
    errors,
    handleSubmit,
    resetForm,
    markAsClean,
    isDirty,
    isValid,
  } = useDrawerForm<ProxyHostFormData>({
    initialData: {
      domainNames: host?.domain_names || [],
      forwardScheme: host?.forward_scheme || 'http',
      forwardHost: host?.forward_host || '',
      forwardPort: host?.forward_port || 80,
      cacheAssets: host?.caching_enabled || false,
      blockExploits: host?.block_exploits || false,
      websocketSupport: host?.allow_websocket_upgrade || false,
      accessListId: host?.access_list_id || 0,
      sslEnabled: (host?.certificate_id || 0) > 0,
      certificateId: host?.certificate_id || 0,
      selectedCertificate: null, // Will be set after certificates load
      forceSSL: host?.ssl_forced || false,
      http2Support: host?.http2_support || false,
      hstsEnabled: host?.hsts_enabled || false,
      hstsSubdomains: host?.hsts_subdomains || false,
      advancedConfig: host?.advanced_config || '',
    },
    validate: (data) => {
      const errors: Partial<Record<keyof ProxyHostFormData, string>> = {}
      
      // Domain names validation
      if (!data.domainNames || data.domainNames.length === 0) {
        errors.domainNames = 'At least one domain name is required'
      }
      
      // Forward host validation
      if (!data.forwardHost || data.forwardHost.trim() === '') {
        errors.forwardHost = 'Forward host is required'
      }
      
      // Forward port validation
      if (!data.forwardPort || data.forwardPort < 1 || data.forwardPort > 65535) {
        errors.forwardPort = 'Port must be between 1 and 65535'
      }
      
      // SSL certificate validation
      if (data.sslEnabled && !data.certificateId) {
        errors.certificateId = 'SSL certificate is required when SSL is enabled'
      }
      
      return Object.keys(errors).length > 0 ? errors : null
    },
    onSubmit: async (data) => {
      const payload: CreateProxyHost | UpdateProxyHost = {
        domain_names: data.domainNames,
        forward_scheme: data.forwardScheme,
        forward_host: data.forwardHost,
        forward_port: data.forwardPort,
        caching_enabled: data.cacheAssets,
        block_exploits: data.blockExploits,
        allow_websocket_upgrade: data.websocketSupport,
        access_list_id: data.accessListId || undefined,
        certificate_id: data.sslEnabled ? data.certificateId : undefined,
        ssl_forced: data.sslEnabled && data.forceSSL,
        http2_support: data.sslEnabled && data.http2Support,
        hsts_enabled: data.sslEnabled && data.hstsEnabled,
        hsts_subdomains: data.sslEnabled && data.hstsSubdomains,
        advanced_config: data.advancedConfig,
      }

      if (isEditMode) {
        await proxyHostsApi.update(host.id, payload as UpdateProxyHost)
      } else {
        await proxyHostsApi.create(payload)
      }

      onSave()
      onClose()
    }
  })

  // Load access lists and certificates when drawer opens
  React.useEffect(() => {
    if (open) {
      loadSelectorData()
      // Reset form when opening with different host or new host
      resetForm({
        domainNames: host?.domain_names || [],
        forwardScheme: host?.forward_scheme || 'http',
        forwardHost: host?.forward_host || '',
        forwardPort: host?.forward_port || 80,
        cacheAssets: host?.caching_enabled || false,
        blockExploits: host?.block_exploits || false,
        websocketSupport: host?.allow_websocket_upgrade || false,
        accessListId: host?.access_list_id || 0,
        sslEnabled: (host?.certificate_id || 0) > 0,
        certificateId: host?.certificate_id || 0,
        selectedCertificate: null,
        forceSSL: host?.ssl_forced || false,
        http2Support: host?.http2_support || false,
        hstsEnabled: host?.hsts_enabled || false,
        hstsSubdomains: host?.hsts_subdomains || false,
        advancedConfig: host?.advanced_config || '',
      })
    }
  }, [open, host, resetForm])

  // Set selected certificate after certificates load
  React.useEffect(() => {
    if (data.certificateId && certificates.length > 0) {
      const cert = certificates.find(c => c.id === data.certificateId)
      if (cert && cert !== data.selectedCertificate) {
        setFieldValue('selectedCertificate', cert)
      }
    }
  }, [data.certificateId, certificates, data.selectedCertificate, setFieldValue])

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

  const tabs = React.useMemo(() => {
    // Check which fields belong to which tab
    const detailsErrors = ['domainNames', 'forwardHost', 'forwardPort', 'accessListId'];
    const sslErrors = ['certificateId'];
    
    const hasDetailsError = detailsErrors.some(field => errors[field as keyof ProxyHostFormData]);
    const hasSslError = data.sslEnabled && sslErrors.some(field => errors[field as keyof ProxyHostFormData]);
    
    return [
      { 
        id: 'details', 
        label: 'Details', 
        icon: <InfoIcon />,
        hasError: hasDetailsError
      },
      { 
        id: 'ssl', 
        label: 'SSL',
        icon: <LockIcon />,
        badge: data.sslEnabled ? 1 : 0,
        hasError: hasSslError
      },
      { 
        id: 'advanced', 
        label: 'Advanced',
        icon: <CodeIcon />
      },
    ];
  }, [data.sslEnabled, errors])

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Proxy Host' : 'New Proxy Host'}
      subtitle={data.domainNames?.[0] || 'Proxy host configuration'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={loading}
      error={globalError || undefined}
      isDirty={isDirty}
      onSave={handleSubmit}
      saveDisabled={false}
      saveText={isEditMode ? 'Save Changes' : 'Create'}
      confirmClose={isDirty}
      width={600}
    >
      <TabPanel value={activeTab} index={0} keepMounted animation="none">
        <DetailsTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
          accessLists={accessLists}
          loadingData={loadingData}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1} keepMounted animation="none">
        <SSLTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
          certificates={certificates}
          loadingData={loadingData}
          getCertificateStatus={getCertificateStatus}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2} keepMounted animation="none">
        <AdvancedTab
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
  data: ProxyHostFormData
  setFieldValue: (field: keyof ProxyHostFormData, value: any) => void
  errors: Record<string, string>
  accessLists: AccessList[]
  loadingData: boolean
}

const DetailsTab = React.memo(({ data, setFieldValue, errors, accessLists, loadingData }: DetailsTabProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormSection title="Host Details" required>
        <DomainInput
          value={data.domainNames}
          onChange={(domainNames) => setFieldValue('domainNames', domainNames)}
          helperText={errors.domainNames || "Press Enter after each domain or paste multiple domains. Wildcards are supported."}
          error={!!errors.domainNames}
          required
        />
      </FormSection>

      <FormSection title="Forward Configuration" required>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Scheme</FormLabel>
          <RadioGroup
            row
            value={data.forwardScheme}
            onChange={(e) => setFieldValue('forwardScheme', e.target.value as 'http' | 'https')}
          >
            <FormControlLabel value="http" control={<Radio />} label="HTTP" />
            <FormControlLabel value="https" control={<Radio />} label="HTTPS" />
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Forward Hostname / IP"
            value={data.forwardHost}
            onChange={(e) => setFieldValue('forwardHost', e.target.value)}
            placeholder="192.168.1.1 or example.com"
            error={!!errors.forwardHost}
            helperText={errors.forwardHost}
            required
            sx={{ flex: 1 }}
          />
          <TextField
            label="Forward Port"
            value={data.forwardPort}
            onChange={(e) => setFieldValue('forwardPort', parseInt(e.target.value) || 0)}
            type="number"
            InputProps={{
              inputProps: { min: 1, max: 65535 }
            }}
            error={!!errors.forwardPort}
            helperText={errors.forwardPort}
            required
            sx={{ width: 120 }}
          />
        </Box>
      </FormSection>

      <FormSection title="Options">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={data.cacheAssets}
                onChange={(e) => setFieldValue('cacheAssets', e.target.checked)}
              />
            }
            label="Cache Assets"
          />
          <FormControlLabel
            control={
              <Switch
                checked={data.blockExploits}
                onChange={(e) => setFieldValue('blockExploits', e.target.checked)}
              />
            }
            label="Block Common Exploits"
          />
          <FormControlLabel
            control={
              <Switch
                checked={data.websocketSupport}
                onChange={(e) => setFieldValue('websocketSupport', e.target.checked)}
              />
            }
            label="Websockets Support"
          />
        </Box>
      </FormSection>

      <FormSection title="Access Control">
        <FormControl fullWidth>
          <InputLabel>Access List</InputLabel>
          <Select
            value={data.accessListId}
            onChange={(e) => setFieldValue('accessListId', Number(e.target.value))}
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
            {accessLists.map((list) => (
              <MenuItem key={list.id} value={list.id}>
                {list.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FormSection>
    </Box>
  )
})

// SSL Tab Component
interface SSLTabProps {
  data: ProxyHostFormData
  setFieldValue: (field: keyof ProxyHostFormData, value: any) => void
  errors: Record<string, string>
  certificates: Certificate[]
  loadingData: boolean
  getCertificateStatus: (cert: Certificate) => { color: 'error' | 'warning' | 'success', text: string, icon: any }
}

const SSLTab = React.memo(({ data, setFieldValue, errors, certificates, loadingData, getCertificateStatus }: SSLTabProps) => {
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
          <>
            <Autocomplete
              fullWidth
              value={data.selectedCertificate}
              onChange={(_, newValue) => {
                setFieldValue('selectedCertificate', newValue)
                setFieldValue('certificateId', newValue?.id || 0)
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
                  error={!!errors.certificateId}
                  helperText={errors.certificateId}
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
              noOptionsText={loadingData ? "Loading certificates..." : "No certificates found"}
            />
            
            {data.selectedCertificate && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  This certificate covers: {data.selectedCertificate.domain_names.join(', ')}
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
          </>
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

// Advanced Tab Component
interface AdvancedTabProps {
  data: ProxyHostFormData
  setFieldValue: (field: keyof ProxyHostFormData, value: any) => void
  errors: Record<string, string>
}

const AdvancedTab = React.memo(({ data, setFieldValue, errors }: AdvancedTabProps) => {
  return (
    <FormSection title="Custom Configuration">
      <Alert severity="warning" sx={{ mb: 2 }}>
        Please note, that any add_header or set_header directives added here will not be 
        used by nginx. You will have to add a custom location '/' and add the header 
        directives there.
      </Alert>
      
      <TextField
        label="Custom Nginx Configuration"
        multiline
        rows={10}
        value={data.advancedConfig}
        onChange={(e) => setFieldValue('advancedConfig', e.target.value)}
        placeholder="# Add your custom Nginx configuration here"
        fullWidth
        sx={{
          '& .MuiInputBase-root': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }
        }}
      />
    </FormSection>
  )
})