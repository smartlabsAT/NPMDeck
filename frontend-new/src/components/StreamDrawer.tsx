import { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  FormHelperText,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Stream as StreamIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { Stream, CreateStream, UpdateStream, streamsApi } from '../api/streams'
import { Certificate, certificatesApi } from '../api/certificates'

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
      id={`stream-tabpanel-${index}`}
      aria-labelledby={`stream-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

interface StreamDrawerProps {
  open: boolean
  onClose: () => void
  stream?: Stream | null
  onSave: () => void
}

export default function StreamDrawer({ open, onClose, stream, onSave }: StreamDrawerProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loadingCertificates, setLoadingCertificates] = useState(false)
  
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
  const [incomingPort, setIncomingPort] = useState('')
  const [forwardingHost, setForwardingHost] = useState('')
  const [forwardingPort, setForwardingPort] = useState('')
  const [tcpForwarding, setTcpForwarding] = useState(true)
  const [udpForwarding, setUdpForwarding] = useState(false)
  const [certificateId, setCertificateId] = useState<number>(0)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)

  const isEditMode = !!stream

  useEffect(() => {
    if (stream) {
      // Load existing stream data
      setIncomingPort(stream.incoming_port.toString())
      setForwardingHost(stream.forwarding_host)
      setForwardingPort(stream.forwarding_port.toString())
      setTcpForwarding(stream.tcp_forwarding)
      setUdpForwarding(stream.udp_forwarding)
      setCertificateId(stream.certificate_id || 0)
      // Set selected certificate after certificates are loaded
      if (stream.certificate_id && certificates.length > 0) {
        const cert = certificates.find(c => c.id === stream.certificate_id)
        setSelectedCertificate(cert || null)
      }
    } else {
      // Reset form for new stream
      setIncomingPort('')
      setForwardingHost('')
      setForwardingPort('')
      setTcpForwarding(true)
      setUdpForwarding(false)
      setCertificateId(0)
      setSelectedCertificate(null)
      setActiveTab(0)
    }
    setError(null)
  }, [stream, certificates])

  // Load certificates when drawer opens
  useEffect(() => {
    if (open) {
      loadCertificates()
    }
  }, [open])

  const loadCertificates = async () => {
    try {
      setLoadingCertificates(true)
      const certs = await certificatesApi.getAll()
      setCertificates(certs)
    } catch (err: any) {
      console.error('Failed to load certificates:', err)
    } finally {
      setLoadingCertificates(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate
      if (!incomingPort) {
        throw new Error('Incoming port is required')
      }
      if (!forwardingHost) {
        throw new Error('Forwarding host is required')
      }
      if (!forwardingPort) {
        throw new Error('Forwarding port is required')
      }
      if (!tcpForwarding && !udpForwarding) {
        throw new Error('At least one forwarding type (TCP or UDP) must be enabled')
      }
      
      const inPort = parseInt(incomingPort)
      const fwdPort = parseInt(forwardingPort)
      
      if (isNaN(inPort) || inPort < 1 || inPort > 65535) {
        throw new Error('Incoming port must be between 1 and 65535')
      }
      if (isNaN(fwdPort) || fwdPort < 1 || fwdPort > 65535) {
        throw new Error('Forwarding port must be between 1 and 65535')
      }

      if (isEditMode) {
        const updateData: UpdateStream = {
          incoming_port: inPort,
          forwarding_host: forwardingHost,
          forwarding_port: fwdPort,
          tcp_forwarding: tcpForwarding,
          udp_forwarding: udpForwarding,
          certificate_id: certificateId || undefined,
        }
        await streamsApi.update(stream.id, updateData)
      } else {
        const createData: CreateStream = {
          incoming_port: inPort,
          forwarding_host: forwardingHost,
          forwarding_port: fwdPort,
          tcp_forwarding: tcpForwarding,
          udp_forwarding: udpForwarding,
          certificate_id: certificateId || undefined,
        }
        await streamsApi.create(createData)
      }

      onSave()
      onClose()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 
                         err.response?.data?.message || 
                         err.message || 
                         'Failed to save stream'
      
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
            <StreamIcon color="primary" />
            <Typography variant="h6">
              {isEditMode ? 'Edit Stream' : 'New Stream'}
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
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <TabPanel value={activeTab} index={0}>
            {/* Details Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                Streams allow you to forward TCP and/or UDP traffic from one port to another host and port.
              </Alert>

              <TextField
                label="Incoming Port"
                value={incomingPort}
                onChange={(e) => setIncomingPort(e.target.value)}
                type="number"
                required
                fullWidth
                helperText="The port that will receive incoming connections"
                InputProps={{
                  inputProps: { min: 1, max: 65535 }
                }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Forwarding Hostname / IP"
                  value={forwardingHost}
                  onChange={(e) => setForwardingHost(e.target.value)}
                  placeholder="192.168.1.1 or example.com"
                  required
                  sx={{ flex: 1 }}
                  helperText="The destination host"
                />
                <TextField
                  label="Forwarding Port"
                  value={forwardingPort}
                  onChange={(e) => setForwardingPort(e.target.value)}
                  type="number"
                  InputProps={{
                    inputProps: { min: 1, max: 65535 }
                  }}
                  required
                  sx={{ width: 150 }}
                  helperText="The destination port"
                />
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Forwarding Type *
                </Typography>
                <FormHelperText sx={{ mb: 1 }}>
                  Select at least one protocol to forward
                </FormHelperText>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tcpForwarding}
                        onChange={(e) => setTcpForwarding(e.target.checked)}
                      />
                    }
                    label="TCP Forwarding"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={udpForwarding}
                        onChange={(e) => setUdpForwarding(e.target.checked)}
                      />
                    }
                    label="UDP Forwarding"
                  />
                </Box>
                {!tcpForwarding && !udpForwarding && (
                  <FormHelperText error>
                    At least one forwarding type must be enabled
                  </FormHelperText>
                )}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* SSL Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                SSL certificates can be used to encrypt TCP connections. This is useful for protocols like HTTPS.
              </Alert>

              <Autocomplete
                fullWidth
                value={selectedCertificate}
                onChange={(_, newValue) => {
                  setSelectedCertificate(newValue)
                  setCertificateId(newValue?.id || 0)
                }}
                options={certificates}
                loading={loadingCertificates}
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
                    label="SSL Certificate (Optional)"
                    placeholder="No certificate"
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
                noOptionsText={loadingCertificates ? "Loading certificates..." : "No certificates found"}
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
            disabled={loading || (!tcpForwarding && !udpForwarding)}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}