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
  Alert,
  FormHelperText,
} from '@mui/material'
import {
  Block as BlockIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { DeadHost, CreateDeadHost, UpdateDeadHost, deadHostsApi } from '../../../api/deadHosts'
import { Certificate, certificatesApi } from '../../../api/certificates'
import BaseDrawer from '../../base/BaseDrawer'
import TabPanel from '../../shared/TabPanel'
import FormSection from '../../shared/FormSection'
import DomainInput from '../../DomainInput'
import { useDrawerForm } from '../../../hooks/useDrawerForm'
import { useToast } from '../../../contexts/ToastContext'

interface DeadHostDrawerProps {
  open: boolean
  onClose: () => void
  host?: DeadHost | null
  onSave: () => void
}

interface DeadHostFormData {
  domainNames: string[]
  certificateId: number
  selectedCertificate: Certificate | null
  sslForced: boolean
  hstsEnabled: boolean
  hstsSubdomains: boolean
  http2Support: boolean
  advancedConfig: string
}

export default function DeadHostDrawer({ open, onClose, host, onSave }: DeadHostDrawerProps) {
  const [activeTab, setActiveTab] = React.useState(0)
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [loadingCertificates, setLoadingCertificates] = React.useState(false)
  const { showSuccess, showError } = useToast()
  
  const isEditMode = !!host

  const {
    data,
    setFieldValue,
    loading,
    globalError,
    errors,
    handleSubmit,
    isDirty,
    isValid,
    getFieldProps,
    resetForm,
  } = useDrawerForm<DeadHostFormData>({
    initialData: {
      domainNames: host?.domain_names || [],
      certificateId: host?.certificate_id || 0,
      selectedCertificate: null,
      sslForced: host?.ssl_forced ?? false,
      hstsEnabled: host?.hsts_enabled ?? false,
      hstsSubdomains: host?.hsts_subdomains ?? false,
      http2Support: host?.http2_support ?? false,
      advancedConfig: host?.advanced_config || '',
    },
    validate: (data) => {
      const errors: Partial<Record<keyof DeadHostFormData, string>> = {}
      
      // Domain names validation
      if (!data.domainNames || data.domainNames.length === 0) {
        errors.domainNames = 'At least one domain name is required'
      }
      
      return Object.keys(errors).length > 0 ? errors : null
    },
    onSubmit: async (formData) => {
      const dataToSend: CreateDeadHost | UpdateDeadHost = {
        domain_names: formData.domainNames,
        certificate_id: formData.certificateId || 0,
        ssl_forced: formData.sslForced,
        hsts_enabled: formData.hstsEnabled,
        hsts_subdomains: formData.hstsSubdomains,
        http2_support: formData.http2Support,
        advanced_config: formData.advancedConfig,
      }

      if (isEditMode) {
        await deadHostsApi.update(host.id, dataToSend as UpdateDeadHost)
      } else {
        await deadHostsApi.create(dataToSend)
      }

      onSave()
      onClose()
    },
    onSuccess: (data) => {
      showSuccess('dead-host', isEditMode ? 'updated' : 'created', data.domainNames[0] || `#${host?.id || 'new'}`)
    },
    onError: (error) => {
      showError('dead-host', isEditMode ? 'update' : 'create', error.message, data.domainNames[0])
    },
  })

  // Reset form when host prop changes
  React.useEffect(() => {
    if (host && open) {
      resetForm({
        domainNames: host.domain_names || [],
        certificateId: host.certificate_id || 0,
        selectedCertificate: null,
        sslForced: host.ssl_forced ?? false,
        hstsEnabled: host.hsts_enabled ?? false,
        hstsSubdomains: host.hsts_subdomains ?? false,
        http2Support: host.http2_support ?? false,
        advancedConfig: host.advanced_config || '',
      })
    }
  }, [host?.id, open, resetForm])

  // Load certificates when drawer opens
  React.useEffect(() => {
    if (open) {
      loadCertificates()
      // Switch to advanced tab if host has advanced config
      if (host?.advanced_config) {
        setActiveTab(1)
      } else {
        setActiveTab(0)
      }
    }
  }, [open, host])

  const loadCertificates = async () => {
    try {
      setLoadingCertificates(true)
      const certs = await certificatesApi.getAll()
      setCertificates(certs)
    } catch (err: unknown) {
      console.error('Failed to load certificates:', err)
    } finally {
      setLoadingCertificates(false)
    }
  }

  const handleCertificateChange = (certificateId: number) => {
    setFieldValue('certificateId', certificateId)
    const cert = certificates.find(c => c.id === certificateId)
    setFieldValue('selectedCertificate', cert || null)
    
    // Reset SSL options if no certificate
    if (!certificateId || certificateId === 0) {
      setFieldValue('sslForced', false)
      setFieldValue('hstsEnabled', false)
      setFieldValue('hstsSubdomains', false)
      setFieldValue('http2Support', false)
    }
  }

  const tabs = [
    { 
      id: 'general', 
      label: 'General', 
      icon: <SettingsIcon />,
      hasError: Boolean(errors.domainNames)
    },
    { 
      id: 'advanced', 
      label: 'Advanced',
      icon: <CodeIcon />,
      hasError: false
    },
  ]

  const title = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {isEditMode ? 'Edit 404 Host' : 'Create 404 Host'}
    </Box>
  )

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={title}
      titleIcon={<BlockIcon sx={{ color: '#cd201f' }} />}
      subtitle={data.domainNames.length > 0 ? data.domainNames.join(', ') : '404 Host Configuration'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={loading}
      error={globalError}
      isDirty={isDirty}
      onSave={handleSubmit}
      saveDisabled={!isValid}
      saveText={isEditMode ? 'Save Changes' : 'Create 404 Host'}
      confirmClose={isDirty}
      width={600}
    >
      <TabPanel value={activeTab} index={0} keepMounted animation="none">
        <GeneralTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
          certificates={certificates}
          loadingCertificates={loadingCertificates}
          onCertificateChange={handleCertificateChange}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1} keepMounted animation="none">
        <AdvancedTab
          data={data}
          setFieldValue={setFieldValue}
          getFieldProps={getFieldProps}
        />
      </TabPanel>
    </BaseDrawer>
  )
}

// General Tab Component
interface GeneralTabProps {
  data: DeadHostFormData
  setFieldValue: (field: keyof DeadHostFormData, value: any) => void
  errors: Partial<Record<keyof DeadHostFormData, string>>
  certificates: Certificate[]
  loadingCertificates: boolean
  onCertificateChange: (certificateId: number) => void
}

function GeneralTab({ 
  data, 
  setFieldValue, 
  errors, 
  certificates, 
  loadingCertificates, 
  onCertificateChange 
}: GeneralTabProps) {
  const hasCertificate = data.certificateId && data.certificateId !== 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormSection title="Domain Configuration" required>
        <DomainInput
          value={data.domainNames}
          onChange={(domains) => setFieldValue('domainNames', domains)}
          error={!!errors.domainNames}
          helperText={errors.domainNames || 'Enter domain names that should return a 404 page'}
          placeholder="example.com, *.example.com"
          required
        />
      </FormSection>

      <FormSection title="SSL Certificate" icon={<SecurityIcon />}>
        <FormControl fullWidth>
          <InputLabel>SSL Certificate</InputLabel>
          <Select
            value={data.certificateId || 0}
            onChange={(e) => onCertificateChange(e.target.value as number)}
            label="SSL Certificate"
            disabled={loadingCertificates}
          >
            <MenuItem value={0}>No Certificate</MenuItem>
            {certificates.map(cert => (
              <MenuItem key={cert.id} value={cert.id}>
                {cert.nice_name || cert.domain_names.join(', ')}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Select a certificate to enable SSL</FormHelperText>
        </FormControl>

        {hasCertificate && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.sslForced}
                  onChange={(e) => setFieldValue('sslForced', e.target.checked)}
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

            {data.sslForced && (
              <>
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
                  <Box sx={{ ml: 4 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={data.hstsSubdomains}
                          onChange={(e) => setFieldValue('hstsSubdomains', e.target.checked)}
                        />
                      }
                      label="HSTS Subdomains"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </FormSection>
    </Box>
  )
}

// Advanced Tab Component
interface AdvancedTabProps {
  data: DeadHostFormData
  setFieldValue: (field: keyof DeadHostFormData, value: any) => void
  getFieldProps: (field: keyof DeadHostFormData) => any
}

function AdvancedTab({ data, setFieldValue, getFieldProps }: AdvancedTabProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert severity="info">
        Custom Nginx configuration for this 404 host. Use advanced configuration carefully.
      </Alert>

      <FormSection title="Custom Nginx Configuration">
        <TextField
          fullWidth
          multiline
          rows={15}
          value={data.advancedConfig}
          onChange={(e) => setFieldValue('advancedConfig', e.target.value)}
          placeholder="# Custom Nginx Configuration"
          sx={{ fontFamily: 'monospace' }}
          helperText="Custom Nginx configuration for this 404 host"
        />
      </FormSection>
    </Box>
  )
}