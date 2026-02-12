import React from 'react'
import {
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  FormHelperText,
} from '@mui/material'
import {
  Info as InfoIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { Stream, CreateStream, UpdateStream, streamsApi } from '../../../api/streams'
import { Certificate, certificatesApi } from '../../../api/certificates'
import BaseDrawer from '../../base/BaseDrawer'
import TabPanel from '../../shared/TabPanel'
import FormSection from '../../shared/FormSection'
import CertificateSelector from '../../shared/CertificateSelector'
import { useDrawerForm } from '../../../hooks/useDrawerForm'
import { useToast } from '../../../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import { NAVIGATION_CONFIG } from '../../../constants/navigation'

interface StreamDrawerProps {
  open: boolean
  onClose: () => void
  stream?: Stream | null
  onSave: () => void
}

interface StreamFormData {
  incomingPort: number | string
  forwardingHost: string
  forwardingPort: number | string
  tcpForwarding: boolean
  udpForwarding: boolean
  certificateId: number
  selectedCertificate: Certificate | null
}

export default function StreamDrawer({ open, onClose, stream, onSave }: StreamDrawerProps) {
  const [activeTab, setActiveTab] = React.useState(0)
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [loadingCertificates, setLoadingCertificates] = React.useState(false)
  const { showSuccess, showError } = useToast()
  
  const isEditMode = !!stream

  // Helper functions for certificate status

  const {
    data,
    setFieldValue,
    loading,
    globalError,
    errors,
    handleSubmit,
    isDirty,
    isValid: _isValid,
    getFieldProps,
    resetForm,
  } = useDrawerForm<StreamFormData>({
    initialData: {
      incomingPort: stream?.incoming_port || '',
      forwardingHost: stream?.forwarding_host || '',
      forwardingPort: stream?.forwarding_port || '',
      tcpForwarding: stream?.tcp_forwarding ?? true,
      udpForwarding: stream?.udp_forwarding ?? false,
      certificateId: stream?.certificate_id || 0,
      selectedCertificate: null,
    },
    fields: {
      incomingPort: {
        initialValue: stream?.incoming_port || '',
      },
      forwardingHost: {
        initialValue: stream?.forwarding_host || '',
      },
      forwardingPort: {
        initialValue: stream?.forwarding_port || '',
      },
      certificateId: {
        initialValue: stream?.certificate_id || 0,
      },
      selectedCertificate: {
        initialValue: null as Certificate | null,
      },
      tcpForwarding: {
        initialValue: stream?.tcp_forwarding ?? true,
      },
      udpForwarding: {
        initialValue: stream?.udp_forwarding ?? false,
      },
    },
    validate: (data) => {
      const errors: Partial<Record<keyof StreamFormData, string>> = {}
      
      // Incoming port validation
      if (!data.incomingPort) {
        errors.incomingPort = 'Incoming port is required'
      } else {
        const port = typeof data.incomingPort === 'string' 
          ? parseInt(data.incomingPort, 10) 
          : data.incomingPort
        if (isNaN(port) || port < 1 || port > 65535) {
          errors.incomingPort = 'Port must be between 1 and 65535'
        }
      }
      
      // Forwarding host validation
      if (!data.forwardingHost) {
        errors.forwardingHost = 'Forwarding host is required'
      }
      
      // Forwarding port validation
      if (!data.forwardingPort) {
        errors.forwardingPort = 'Forwarding port is required'
      } else {
        const port = typeof data.forwardingPort === 'string' 
          ? parseInt(data.forwardingPort, 10) 
          : data.forwardingPort
        if (isNaN(port) || port < 1 || port > 65535) {
          errors.forwardingPort = 'Port must be between 1 and 65535'
        }
      }
      
      // At least one protocol must be selected
      if (!data.tcpForwarding && !data.udpForwarding) {
        errors.tcpForwarding = 'At least one protocol must be selected'
        errors.udpForwarding = 'At least one protocol must be selected'
      }
      
      return Object.keys(errors).length > 0 ? errors : null
    },
    onSubmit: async (formData) => {
      const inPort = typeof formData.incomingPort === 'string' 
        ? parseInt(formData.incomingPort, 10) 
        : formData.incomingPort
      const fwdPort = typeof formData.forwardingPort === 'string' 
        ? parseInt(formData.forwardingPort, 10) 
        : formData.forwardingPort

      if (isEditMode) {
        const updateData: UpdateStream = {
          incoming_port: inPort,
          forwarding_host: formData.forwardingHost,
          forwarding_port: fwdPort,
          tcp_forwarding: formData.tcpForwarding,
          udp_forwarding: formData.udpForwarding,
          certificate_id: formData.certificateId || undefined,
        }
        await streamsApi.update(stream.id, updateData)
      } else {
        const createData: CreateStream = {
          incoming_port: inPort,
          forwarding_host: formData.forwardingHost,
          forwarding_port: fwdPort,
          tcp_forwarding: formData.tcpForwarding,
          udp_forwarding: formData.udpForwarding,
          certificate_id: formData.certificateId || undefined,
        }
        await streamsApi.create(createData)
      }

      onSave()
      onClose()
    },
    onSuccess: (data) => {
      const streamName = `${data.incomingPort}/${data.tcpForwarding ? 'TCP' : ''}${data.udpForwarding ? 'UDP' : ''}`
      showSuccess('stream', isEditMode ? 'updated' : 'created', streamName)
    },
    onError: (error) => {
      const streamName = data.incomingPort ? `${data.incomingPort}/${data.tcpForwarding ? 'TCP' : ''}${data.udpForwarding ? 'UDP' : ''}` : 'Stream'
      showError('stream', isEditMode ? 'update' : 'create', error.message, streamName)
    },
    autoSave: {
      enabled: true,
      delay: 3000,
      onAutoSave: async (_formData) => {
        if (isEditMode && isDirty) {

          // Auto-saving stream draft...
        }
      }
    }
  })

  // Load certificates when drawer opens
  React.useEffect(() => {
    if (open) {
      loadCertificates()
      // Reset form when opening with different stream or new stream
      resetForm({
        incomingPort: stream?.incoming_port || '',
        forwardingHost: stream?.forwarding_host || '',
        forwardingPort: stream?.forwarding_port || '',
        tcpForwarding: stream?.tcp_forwarding ?? true,
        udpForwarding: stream?.udp_forwarding ?? false,
        certificateId: stream?.certificate_id || 0,
        selectedCertificate: null,
      })
    }
  }, [open, stream, resetForm])

  // Set selected certificate after certificates are loaded
  React.useEffect(() => {
    if (data.certificateId && certificates.length > 0) {
      const cert = certificates.find(c => c.id === data.certificateId)
      if (cert && cert !== data.selectedCertificate) {
        setFieldValue('selectedCertificate', cert)
      }
    }
  }, [data.certificateId, certificates, data.selectedCertificate, setFieldValue])

  const loadCertificates = async () => {
    try {
      setLoadingCertificates(true)
      const certs = await certificatesApi.getAll()
      setCertificates(certs)
    } catch {
      // Error loading certificates
    } finally {
      setLoadingCertificates(false)
    }
  }

  const handleCertificateChange = (newValue: Certificate | null) => {
    setFieldValue('selectedCertificate', newValue)
    setFieldValue('certificateId', newValue?.id || 0)
  }

  const tabs = [
    { 
      id: 'details', 
      label: 'Details', 
      icon: <InfoIcon />,
      hasError: Boolean(errors.incomingPort || errors.forwardingHost || errors.forwardingPort || errors.tcpForwarding || errors.udpForwarding)
    },
    { 
      id: 'ssl', 
      label: 'SSL',
      icon: <LockIcon />,
      hasError: false
    },
  ]

  const titleContent = `${stream ? 'Edit Stream' : 'New Stream'}`

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={titleContent}
      titleIcon={React.createElement(NAVIGATION_CONFIG.streams.icon, { sx: { color: NAVIGATION_CONFIG.streams.color } })}
      subtitle={data?.forwardingHost ? `${data.incomingPort} → ${data.forwardingHost}:${data.forwardingPort}` : 'Stream Configuration'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={loading}
      error={globalError}
      isDirty={isDirty}
      onSave={handleSubmit}
      saveDisabled={false}
      saveText={isEditMode ? 'Save Changes' : 'Create Stream'}
      confirmClose={isDirty}
      width={600}
    >
      <TabPanel value={activeTab} index={0} keepMounted animation="none">
        <DetailsTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
          getFieldProps={getFieldProps}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1} keepMounted animation="none">
        <SSLTab
          data={data}
          setFieldValue={setFieldValue}
          certificates={certificates}
          loadingCertificates={loadingCertificates}
          onCertificateChange={handleCertificateChange}
        />
      </TabPanel>
    </BaseDrawer>
  )
}

// Details Tab Component
interface DetailsTabProps {
  data: StreamFormData
  setFieldValue: (field: keyof StreamFormData, value: any) => void
  errors: Partial<Record<keyof StreamFormData, string>>
  getFieldProps: (field: keyof StreamFormData) => any
}

function DetailsTab({ data, setFieldValue, errors, getFieldProps }: DetailsTabProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert severity="info">
        Streams allow you to forward TCP and/or UDP traffic from one port to another host and port.
      </Alert>
      <FormSection title="Port Configuration" required>
        <TextField
          {...getFieldProps('incomingPort')}
          label="Incoming Port"
          type="number"
          required
          fullWidth
          error={!!errors.incomingPort}
          helperText={errors.incomingPort || "The port that will receive incoming connections"}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              inputProps: { min: 1, max: 65535 }
            }
          }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            {...getFieldProps('forwardingHost')}
            label="Forwarding Hostname / IP"
            placeholder="192.168.1.1 or example.com"
            required
            sx={{ flex: 1 }}
            error={!!errors.forwardingHost}
            helperText={errors.forwardingHost || "The destination host"}
          />
          <TextField
            {...getFieldProps('forwardingPort')}
            label="Forwarding Port"
            type="number"
            required
            sx={{ width: 150 }}
            error={!!errors.forwardingPort}
            helperText={errors.forwardingPort || "The destination port"}
            slotProps={{
              input: {
                inputProps: { min: 1, max: 65535 }
              }
            }}
          />
        </Box>
      </FormSection>
      <FormSection title="Forwarding Type" required>
        <FormHelperText sx={{ mb: 2, color: errors.tcpForwarding ? 'error.main' : 'text.secondary' }}>
          {errors.tcpForwarding || 'Select at least one protocol to forward'}
        </FormHelperText>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={data.tcpForwarding}
                onChange={(e) => setFieldValue('tcpForwarding', e.target.checked)}
              />
            }
            label="TCP Forwarding"
          />
          <FormControlLabel
            control={
              <Switch
                checked={data.udpForwarding}
                onChange={(e) => setFieldValue('udpForwarding', e.target.checked)}
              />
            }
            label="UDP Forwarding"
          />
        </Box>
      </FormSection>
    </Box>
  );
}

// SSL Tab Component
interface SSLTabProps {
  data: StreamFormData
  setFieldValue: (field: keyof StreamFormData, value: any) => void
  certificates: Certificate[]
  loadingCertificates: boolean
  onCertificateChange: (cert: Certificate | null) => void
}

function SSLTab({ 
  data, 
  certificates, 
  loadingCertificates, 
  onCertificateChange 
}: SSLTabProps) {
  const navigate = useNavigate()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert severity="info">
        SSL certificates can be used to encrypt TCP connections. This is useful for protocols like HTTPS.
      </Alert>

      <FormSection title="Certificate Selection">
        <CertificateSelector
          value={data.selectedCertificate}
          onChange={onCertificateChange}
          certificates={certificates}
          loading={loadingCertificates}
          label="SSL Certificate (Optional)"
          placeholder="No certificate"
          showDomainInfo={true}
          showAddButton={true}
          onAddClick={() => navigate('/security/certificates/new/letsencrypt')}
        />
      </FormSection>
    </Box>
  )
}