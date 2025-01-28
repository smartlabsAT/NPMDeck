import React, { useState, useEffect } from 'react'
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
  Alert,
  FormHelperText,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Code as CodeIcon,
  Block,
} from '@mui/icons-material'
import { deadHostsApi, DeadHost, CreateDeadHost, UpdateDeadHost } from '../api/deadHosts'
import { certificatesApi } from '../api/certificates'
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
      id={`dead-host-tabpanel-${index}`}
      aria-labelledby={`dead-host-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

interface DeadHostDrawerProps {
  open: boolean
  onClose: () => void
  host: DeadHost | null
  onSave: () => void
}

const DeadHostDrawer: React.FC<DeadHostDrawerProps> = ({ open, onClose, host, onSave }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState<CreateDeadHost>({
    domain_names: [],
    certificate_id: 0,
    ssl_forced: false,
    hsts_enabled: false,
    hsts_subdomains: false,
    http2_support: false,
    advanced_config: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [certificates, setCertificates] = useState<any[]>([])
  const [loadingCertificates, setLoadingCertificates] = useState(false)

  useEffect(() => {
    if (open) {
      loadCertificates()
      if (host) {
        // Editing existing host
        setFormData({
          domain_names: host.domain_names,
          certificate_id: host.certificate_id,
          ssl_forced: host.ssl_forced,
          hsts_enabled: host.hsts_enabled,
          hsts_subdomains: host.hsts_subdomains,
          http2_support: host.http2_support,
          advanced_config: host.advanced_config,
        })
        // If host has advanced config, switch to advanced tab
        setActiveTab(host.advanced_config ? 1 : 0)
      } else {
        // Creating new host
        setFormData({
          domain_names: [],
          certificate_id: 0,
          ssl_forced: false,
          hsts_enabled: false,
          hsts_subdomains: false,
          http2_support: false,
          advanced_config: '',
        })
        setActiveTab(0)
      }
      setErrors({})
    }
  }, [open, host])

  const loadCertificates = async () => {
    setLoadingCertificates(true)
    try {
      const certs = await certificatesApi.getAll()
      setCertificates(certs)
    } catch (error) {
      console.error('Failed to load certificates:', error)
    } finally {
      setLoadingCertificates(false)
    }
  }

  const handleChange = (field: keyof CreateDeadHost, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Handle dependent fields
    if (field === 'certificate_id') {
      const hasCert = value && value !== 0 && value !== 'new'
      if (!hasCert) {
        setFormData(prev => ({
          ...prev,
          ssl_forced: false,
          hsts_enabled: false,
          hsts_subdomains: false,
          http2_support: false,
        }))
      }
    } else if (field === 'ssl_forced' && !value) {
      setFormData(prev => ({
        ...prev,
        hsts_enabled: false,
        hsts_subdomains: false,
      }))
    } else if (field === 'hsts_enabled' && !value) {
      setFormData(prev => ({
        ...prev,
        hsts_subdomains: false,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.domain_names || formData.domain_names.length === 0) {
      newErrors.domain_names = 'At least one domain name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      return
    }

    setSaving(true)
    try {
      const dataToSend: CreateDeadHost | UpdateDeadHost = {
        ...formData,
        certificate_id: formData.certificate_id || 0,
      }

      if (host) {
        // Update existing host
        await deadHostsApi.update(host.id, dataToSend as UpdateDeadHost)
      } else {
        // Create new host
        await deadHostsApi.create(dataToSend)
      }
      
      onSave()
      onClose()
    } catch (error: any) {
      // Check for error in different response formats
      const errorMessage = error.response?.data?.error?.message || 
                         error.response?.data?.message || 
                         error.message || 
                         'Failed to save 404 host'
      
      setErrors({
        submit: errorMessage
      })
    } finally {
      setSaving(false)
    }
  }

  const hasCertificate = formData.certificate_id && formData.certificate_id !== 0
  const operation = host ? 'edit' : 'create'
  const title = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Block sx={{ color: '#cd201f' }} />
      <Typography variant="h6">
        {host ? 'Edit 404 Host' : 'Create 404 Host'}
      </Typography>
    </Box>
  )

  return (
    <AdaptiveContainer
      open={open}
      onClose={onClose}
      entity="dead_hosts"
      operation={operation}
      title={title}
      actions={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : (host ? 'Save Changes' : 'Create 404 Host')}
          </Button>
        </>
      }
    >
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="General" icon={<SettingsIcon />} iconPosition="start" value={0} />
          <Tab label="Advanced" icon={<CodeIcon />} iconPosition="start" value={1} />
        </Tabs>
      </Box>

      {/* Form Content */}
      <Box sx={{ mt: 2 }}>
          {errors.submit && (
            <Alert severity="error" sx={{ m: 2 }} onClose={() => setErrors(prev => ({ ...prev, submit: '' }))}>
              {errors.submit}
            </Alert>
          )}

          <TabPanel value={activeTab} index={0}>
            {/* General Tab */}
            <Box sx={{ p: 2 }}>
              {/* Domain Names */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Domain Names *
                </Typography>
                <DomainInput
                  value={formData.domain_names}
                  onChange={(domains) => handleChange('domain_names', domains)}
                  error={!!errors.domain_names}
                  helperText={errors.domain_names || 'Enter domain names that should return a 404 page'}
                  placeholder="example.com, *.example.com"
                />
              </Box>

              {/* SSL Certificate */}
              <Box mb={3}>
                <FormControl fullWidth>
                  <InputLabel>SSL Certificate</InputLabel>
                  <Select
                    value={formData.certificate_id || 0}
                    onChange={(e) => handleChange('certificate_id', e.target.value)}
                    label="SSL Certificate"
                    disabled={loadingCertificates}
                    renderValue={(value) => {
                      if (value === 0) return 'No Certificate'
                      const cert = certificates.find(c => c.id === value)
                      return cert ? (cert.nice_name || cert.domain_names.join(', ')) : ''
                    }}
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
              </Box>

              {/* SSL Options */}
              {hasCertificate && (
                <>
                  <Box mb={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.ssl_forced}
                          onChange={(e) => handleChange('ssl_forced', e.target.checked)}
                        />
                      }
                      label="Force SSL"
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                      Redirect all HTTP requests to HTTPS
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.http2_support}
                          onChange={(e) => handleChange('http2_support', e.target.checked)}
                        />
                      }
                      label="HTTP/2 Support"
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                      Enable HTTP/2 protocol support
                    </Typography>
                  </Box>

                  {formData.ssl_forced && (
                    <>
                      <Box mb={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.hsts_enabled}
                              onChange={(e) => handleChange('hsts_enabled', e.target.checked)}
                            />
                          }
                          label="HSTS Enabled"
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                          Enable HTTP Strict Transport Security
                        </Typography>
                      </Box>

                      {formData.hsts_enabled && (
                        <Box mb={2} ml={4}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.hsts_subdomains}
                                onChange={(e) => handleChange('hsts_subdomains', e.target.checked)}
                              />
                            }
                            label="HSTS Subdomains"
                          />
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                            Apply HSTS to all subdomains
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* Advanced Tab */}
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={formData.advanced_config}
                onChange={(e) => handleChange('advanced_config', e.target.value)}
                placeholder="# Custom Nginx Configuration"
                sx={{ fontFamily: 'monospace' }}
                helperText="Custom Nginx configuration for this 404 host"
              />
            </Box>
          </TabPanel>
      </Box>
    </AdaptiveContainer>
  )
}

export default DeadHostDrawer