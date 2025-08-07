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
  InputAdornment,
} from '@mui/material'
import {
  Info as InfoIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { ProxyHost, CreateProxyHost, UpdateProxyHost, proxyHostsApi } from '../../../api/proxyHosts'
import { NAVIGATION_CONFIG } from '../../../constants/navigation'
import { AccessList, accessListsApi } from '../../../api/accessLists'
import { Certificate, certificatesApi } from '../../../api/certificates'
import BaseDrawer from '../../base/BaseDrawer'
import TabPanel from '../../shared/TabPanel'
import FormSection from '../../shared/FormSection'
import DomainInput from '../../DomainInput'
import CertificateSelector from '../../shared/CertificateSelector'
import { useDrawerForm } from '../../../hooks/useDrawerForm'
import { useToast } from '../../../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

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
  const { showSuccess, showError } = useToast()

  const isEditMode = !!host

  const {
    data,
    setFieldValue,
    loading,
    globalError,
    errors,
    handleSubmit,
    resetForm,
    markAsClean: _markAsClean,
    isDirty,
    isValid: _isValid,
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
    },
    onSuccess: (data) => {
      showSuccess('proxy-host', isEditMode ? 'updated' : 'created', data.domainNames[0] || `#${host?.id || 'new'}`)
    },
    onError: (error) => {
      showError('proxy-host', isEditMode ? 'update' : 'create', error.message, data.domainNames[0])
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
      
      // Sort certificates by name
      const sortedCertificates = [...certificatesData].sort((a, b) => {
        const nameA = a.nice_name || a.domain_names[0] || ''
        const nameB = b.nice_name || b.domain_names[0] || ''
        return nameA.localeCompare(nameB)
      })
      
      setCertificates(sortedCertificates)
    } catch (err) {
      showError('proxy-host', 'load data', err instanceof Error ? err.message : 'Unknown error')
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
      titleIcon={React.createElement(NAVIGATION_CONFIG.proxyHosts.icon, { sx: { color: NAVIGATION_CONFIG.proxyHosts.color } })}
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
          _loadingData={loadingData}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1} keepMounted animation="none">
        <SSLTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
          certificates={certificates}
          _loadingData={loadingData}
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
  _loadingData: boolean
}

const DetailsTab = React.memo(({ data, setFieldValue, errors, accessLists, _loadingData: __loadingData }: DetailsTabProps) => {
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

DetailsTab.displayName = 'DetailsTab'

// SSL Tab Component
interface SSLTabProps {
  data: ProxyHostFormData
  setFieldValue: (field: keyof ProxyHostFormData, value: any) => void
  errors: Record<string, string>
  certificates: Certificate[]
  _loadingData: boolean
}

const SSLTab = React.memo(({ data, setFieldValue, errors, certificates, _loadingData: __loadingData }: SSLTabProps) => {
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
            loading={__loadingData}
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

SSLTab.displayName = 'SSLTab'

// Advanced Tab Component
interface AdvancedTabProps {
  data: ProxyHostFormData
  setFieldValue: (field: keyof ProxyHostFormData, value: any) => void
  errors: Record<string, string>
}

const AdvancedTab = React.memo(({ data, setFieldValue, errors: _errors }: AdvancedTabProps) => {
  return (
    <FormSection title="Custom Configuration">
      <Alert severity="warning" sx={{ mb: 2 }}>
        Please note, that any add_header or set_header directives added here will not be 
        used by nginx. You will have to add a custom location &apos;/&apos; and add the header 
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

AdvancedTab.displayName = 'AdvancedTab'