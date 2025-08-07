import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Code as CodeIcon,
  TrendingFlat as RedirectIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { RedirectionHost, CreateRedirectionHost, redirectionHostsApi } from '../api/redirectionHosts'
import { Certificate, certificatesApi } from '../api/certificates'
import BaseDrawer, { Tab } from './base/BaseDrawer'
import { useDrawerForm } from '../hooks/useDrawerForm'
import CertificateDrawer from './features/certificates/CertificateDrawer'
import DomainInput from './DomainInput'
import FormSection from './shared/FormSection'
import TabPanel from './shared/TabPanel'
import CertificateSelector from './shared/CertificateSelector'
import { useToast } from '../contexts/ToastContext'
import { NAVIGATION_CONFIG } from '../constants/navigation'

interface RedirectionHostDrawerProps {
  open: boolean
  onClose: () => void
  host?: RedirectionHost | null
  onSave: () => void
}

interface RedirectionHostFormData {
  domain_names: string[]
  forward_scheme: string
  forward_domain_name: string
  forward_http_code: number
  preserve_path: boolean
  block_exploits: boolean
  certificate_id: number | string
  ssl_forced: boolean
  hsts_enabled: boolean
  hsts_subdomains: boolean
  http2_support: boolean
  advanced_config: string
  enabled: boolean
  use_lets_encrypt: boolean
  letsencrypt_email: string
  letsencrypt_agree: boolean
  dns_challenge: boolean
  dns_provider: string
  dns_provider_credentials: string
  propagation_seconds: string
}

export default function RedirectionHostDrawer({ open, onClose, host, onSave }: RedirectionHostDrawerProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certificateDrawerOpen, setCertificateDrawerOpen] = useState(false)
  const { showSuccess, showError } = useToast()
  
  // Form management with useDrawerForm
  const form = useDrawerForm<RedirectionHostFormData>({
    initialData: {
      domain_names: host?.domain_names || [],
      forward_scheme: host?.forward_scheme || 'http',
      forward_domain_name: host?.forward_domain_name || '',
      forward_http_code: host?.forward_http_code || 301,
      preserve_path: host?.preserve_path ?? true,
      block_exploits: host?.block_exploits ?? false,
      certificate_id: host?.certificate_id || 0,
      ssl_forced: host?.ssl_forced ?? false,
      hsts_enabled: host?.hsts_enabled ?? false,
      hsts_subdomains: host?.hsts_subdomains ?? false,
      http2_support: host?.http2_support ?? false,
      advanced_config: host?.advanced_config || '',
      enabled: host?.enabled ?? true,
      use_lets_encrypt: false,
      letsencrypt_email: host?.meta?.letsencrypt_email || '',
      letsencrypt_agree: false,
      dns_challenge: host?.meta?.dns_challenge ?? false,
      dns_provider: host?.meta?.dns_provider || '',
      dns_provider_credentials: host?.meta?.dns_provider_credentials || '',
      propagation_seconds: host?.meta?.propagation_seconds?.toString() || '',
    },
    fields: {
      domain_names: { initialValue: [], required: true },
      forward_scheme: { initialValue: 'http' },
      forward_domain_name: { initialValue: '', required: true },
      forward_http_code: { initialValue: 301 },
      preserve_path: { initialValue: true },
      block_exploits: { initialValue: true },
      certificate_id: { initialValue: 0 },
      ssl_forced: { initialValue: false },
      hsts_enabled: { initialValue: false },
      hsts_subdomains: { initialValue: false },
      http2_support: { initialValue: false },
      advanced_config: { initialValue: '' },
      use_lets_encrypt: { initialValue: false },
      letsencrypt_email: { 
        initialValue: '', 
        validate: (value, formData) => {
          if (formData?.use_lets_encrypt && !value) return 'Email is required for Let\'s Encrypt'
          return null
        }
      },
      letsencrypt_agree: { initialValue: false },
      dns_challenge: { initialValue: false },
      dns_provider: { initialValue: '' },
      dns_provider_credentials: { initialValue: '' },
      propagation_seconds: { initialValue: '' },
      enabled: { initialValue: true },
    },
    onSubmit: async (data) => {
      const payload: CreateRedirectionHost = {
        domain_names: data.domain_names,
        forward_scheme: data.forward_scheme,
        forward_domain_name: data.forward_domain_name,
        forward_http_code: data.forward_http_code,
        preserve_path: data.preserve_path,
        block_exploits: data.block_exploits,
        ssl_forced: data.ssl_forced,
        hsts_enabled: data.hsts_enabled,
        hsts_subdomains: data.hsts_subdomains,
        http2_support: data.http2_support,
        advanced_config: data.advanced_config,
      }
      
      if (data.certificate_id === 'new' && data.use_lets_encrypt) {
        payload.meta = {
          letsencrypt_email: data.letsencrypt_email,
          letsencrypt_agree: data.letsencrypt_agree,
          dns_challenge: data.dns_challenge,
        }
        if (data.dns_challenge) {
          payload.meta.dns_provider = data.dns_provider
          payload.meta.dns_provider_credentials = data.dns_provider_credentials
          if (data.propagation_seconds) {
            payload.meta.propagation_seconds = parseInt(data.propagation_seconds)
          }
        }
      } else if (data.certificate_id && data.certificate_id !== 0) {
        payload.certificate_id = parseInt(data.certificate_id.toString())
      }
      
      if (host) {
        await redirectionHostsApi.update({ ...payload, id: host.id })
      } else {
        await redirectionHostsApi.create(payload)
      }
      
      onSave()
      onClose()
    },
    onSuccess: (data) => {
      showSuccess('redirection-host', host ? 'updated' : 'created', data.domain_names[0] || `#${host?.id || 'new'}`)
    },
    onError: (error) => {
      showError('redirection-host', host ? 'update' : 'create', error.message, form.data.domain_names[0])
    },
  })

  useEffect(() => {
    if (open) {
      loadCertificates()
      setActiveTab(0)
      if (host) {
        form.resetForm({
          domain_names: host.domain_names,
          forward_scheme: host.forward_scheme,
          forward_domain_name: host.forward_domain_name,
          forward_http_code: host.forward_http_code,
          preserve_path: host.preserve_path,
          block_exploits: host.block_exploits,
          certificate_id: host.certificate_id || 0,
          ssl_forced: host.ssl_forced,
          hsts_enabled: host.hsts_enabled,
          hsts_subdomains: host.hsts_subdomains,
          http2_support: host.http2_support,
          advanced_config: host.advanced_config,
          enabled: host.enabled,
          use_lets_encrypt: false,
          letsencrypt_email: host.meta?.letsencrypt_email || '',
          letsencrypt_agree: false,
          dns_challenge: host.meta?.dns_challenge ?? false,
          dns_provider: host.meta?.dns_provider || '',
          dns_provider_credentials: host.meta?.dns_provider_credentials || '',
          propagation_seconds: host.meta?.propagation_seconds?.toString() || '',
        })
      }
    }
  }, [open, host])

  const loadCertificates = async () => {
    try {
      const certs = await certificatesApi.getAll()
      setCertificates(certs)
    } catch (err: unknown) {
      console.error('Failed to load certificates:', err)
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
  ]

  const tabs: Tab[] = [
    {
      id: 'details',
      label: 'Details',
      icon: <RedirectIcon />,
      hasError: Boolean(form.errors.domain_names || form.errors.forward_domain_name),
    },
    {
      id: 'ssl',
      label: 'SSL',
      icon: <LockIcon />,
      hasError: Boolean(form.errors.letsencrypt_email),
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <CodeIcon />,
    },
  ]

  return (
    <>
      <BaseDrawer
        open={open}
        onClose={onClose}
        title={host ? 'Edit Redirection Host' : 'Add Redirection Host'}
        titleIcon={React.createElement(NAVIGATION_CONFIG.redirectionHosts.icon, { sx: { color: NAVIGATION_CONFIG.redirectionHosts.color } })}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={form.loading}
        error={form.globalError || undefined}
        onSave={form.handleSubmit}
        isDirty={form.isDirty}
        saveDisabled={!form.isValid}
        saveText={host ? 'Save Changes' : 'Create'}
      >
        <TabPanel value={activeTab} index={0} keepMounted animation="none">
          <FormSection title="Source">
            <DomainInput
              value={form.data.domain_names}
              onChange={(value) => form.setFieldValue('domain_names', value)}
              required
              error={Boolean(form.errors.domain_names && form.touched.domain_names)}
              helperText={form.touched.domain_names ? form.errors.domain_names : undefined}
            />
          </FormSection>

          <FormSection title="Destination">
            <FormControl fullWidth margin="normal">
              <InputLabel>Forward Scheme</InputLabel>
              <Select
                value={form.data.forward_scheme}
                onChange={(e) => form.setFieldValue('forward_scheme', e.target.value)}
                label="Forward Scheme"
              >
                <MenuItem value="http">HTTP</MenuItem>
                <MenuItem value="https">HTTPS</MenuItem>
              </Select>
              <FormHelperText>Choose the scheme for the redirect destination</FormHelperText>
            </FormControl>

            <TextField
              {...form.getFieldProps('forward_domain_name')}
              fullWidth
              label="Forward Domain"
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
                value={form.data.forward_http_code}
                onChange={(e) => form.setFieldValue('forward_http_code', Number(e.target.value))}
                label="HTTP Status Code"
              >
                {httpStatusCodes.map(code => (
                  <MenuItem key={code.value} value={code.value}>
                    {code.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FormSection>

          <FormSection title="Options">
            <FormControlLabel
              control={
                <Switch
                  checked={form.data.preserve_path}
                  onChange={(e) => form.setFieldValue('preserve_path', e.target.checked)}
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
                  checked={form.data.block_exploits}
                  onChange={(e) => form.setFieldValue('block_exploits', e.target.checked)}
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
                  checked={form.data.enabled}
                  onChange={(e) => form.setFieldValue('enabled', e.target.checked)}
                />
              }
              label="Enabled"
            />
          </FormSection>
        </TabPanel>

        <TabPanel value={activeTab} index={1} keepMounted animation="none">
          <CertificateSelector
            value={certificates.find(c => c.id === form.data.certificate_id) || null}
            onChange={(newValue) => {
              if (newValue) {
                form.setFieldValue('certificate_id', newValue.id)
                form.setFieldValue('use_lets_encrypt', false)
              } else {
                form.setFieldValue('certificate_id', 0)
                form.setFieldValue('use_lets_encrypt', false)
              }
            }}
            certificates={certificates}
            loading={false}
            helperText="Choose an existing certificate or request a new one"
            showDomainInfo={false}
            showAddButton={true}
            onAddClick={() => setCertificateDrawerOpen(true)}
            includeNewOption={true}
            onNewOptionSelect={() => {
              form.setFieldValue('certificate_id', 'new')
              form.setFieldValue('use_lets_encrypt', true)
            }}
          />

          {(form.data.certificate_id !== 0 && form.data.certificate_id !== 'new') && (
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.data.ssl_forced}
                    onChange={(e) => form.setFieldValue('ssl_forced', e.target.checked)}
                  />
                }
                label="Force SSL"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2, display: 'block' }}>
                Redirect all HTTP traffic to HTTPS
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={form.data.http2_support}
                    onChange={(e) => form.setFieldValue('http2_support', e.target.checked)}
                  />
                }
                label="HTTP/2 Support"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={form.data.hsts_enabled}
                    onChange={(e) => form.setFieldValue('hsts_enabled', e.target.checked)}
                    disabled={!form.data.ssl_forced}
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
                    checked={form.data.hsts_subdomains}
                    onChange={(e) => form.setFieldValue('hsts_subdomains', e.target.checked)}
                    disabled={!form.data.hsts_enabled}
                  />
                }
                label="HSTS Subdomains"
                sx={{ ml: 4 }}
              />
            </Box>
          )}

          {form.data.use_lets_encrypt && form.data.certificate_id === 'new' && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                A new Let&apos;s Encrypt certificate will be requested when you save
              </Alert>

              <TextField
                {...form.getFieldProps('letsencrypt_email')}
                fullWidth
                label="Email Address"
                type="email"
                margin="normal"
                required
                helperText="For Let's Encrypt notifications"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={form.data.dns_challenge}
                    onChange={(e) => form.setFieldValue('dns_challenge', e.target.checked)}
                  />
                }
                label="Use DNS Challenge"
                sx={{ mt: 2 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2, display: 'block' }}>
                Required for wildcard certificates
              </Typography>

              {form.data.dns_challenge && (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>DNS Provider</InputLabel>
                    <Select
                      value={form.data.dns_provider}
                      onChange={(e) => form.setFieldValue('dns_provider', e.target.value)}
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
                    value={form.data.dns_provider_credentials}
                    onChange={(e) => form.setFieldValue('dns_provider_credentials', e.target.value)}
                    margin="normal"
                    helperText="Provider-specific API credentials"
                  />

                  <TextField
                    fullWidth
                    label="Propagation Seconds"
                    type="number"
                    value={form.data.propagation_seconds}
                    onChange={(e) => form.setFieldValue('propagation_seconds', e.target.value)}
                    margin="normal"
                    helperText="Time to wait for DNS propagation (default: provider-specific)"
                  />
                </>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={form.data.letsencrypt_agree}
                    onChange={(e) => form.setFieldValue('letsencrypt_agree', e.target.checked)}
                  />
                }
                label="I agree to the Let's Encrypt Terms of Service"
                sx={{ mt: 2 }}
                required
              />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2} keepMounted animation="none">
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
            value={form.data.advanced_config}
            onChange={(e) => form.setFieldValue('advanced_config', e.target.value)}
            margin="normal"
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
            }}
            helperText="Add custom Nginx directives here"
          />
        </TabPanel>
      </BaseDrawer>

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