import React, { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  VpnKey,
  Info as InfoIcon,
  WebAsset as HostsIcon,
} from '@mui/icons-material'
import { Certificate } from '../api/certificates'
import { CertificateWithHosts } from '../types/common'
// import ExportDialog from './ExportDialog'
import { usePermissions } from '../hooks/usePermissions'
import AdaptiveContainer from './AdaptiveContainer'
import CertificateInfoPanel from './features/certificates/CertificateInfoPanel'
import CertificateHostsPanel from './features/certificates/CertificateHostsPanel'
import CertificateActions from './features/certificates/CertificateActions'

interface CertificateDetailsDialogProps {
  open: boolean
  onClose: () => void
  certificate: Certificate | null
  onEdit?: (certificate: Certificate) => void
}

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
      id={`certificate-tabpanel-${index}`}
      aria-labelledby={`certificate-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

const CertificateDetailsDialog: React.FC<CertificateDetailsDialogProps> = ({
  open,
  onClose,
  certificate,
  onEdit,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { } = usePermissions()
  const [activeTab, setActiveTab] = useState(0)
  const [copiedText, setCopiedText] = useState<string>('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    domains: true,
    hosts: false,
  })
  // const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Parse tab from URL
  useEffect(() => {
    if (open && certificate) {
      const pathParts = location.pathname.split('/')
      const tabIndex = pathParts[pathParts.length - 1]
      switch (tabIndex) {
        case 'hosts':
          setActiveTab(1)
          break
        default:
          setActiveTab(0)
          break
      }
    }
  }, [location.pathname, open, certificate])

  if (!certificate) return null

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label || text)
    setTimeout(() => setCopiedText(''), 2000)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleNavigateToHost = (hostType: string, hostId: number) => {
    onClose()
    navigate(`/hosts/${hostType}/${hostId}/view`)
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    if (certificate) {
      const tabs = ['overview', 'hosts']
      navigate(`/security/certificates/${certificate.id}/view/${tabs[newValue]}`, { replace: true })
    }
  }

  return (
    <AdaptiveContainer
      open={open}
      onClose={onClose}
      entity="certificates"
      operation="view"
      title={
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <VpnKey sx={{ color: '#5eba00' }} />
            <Typography variant="h6">SSL Certificate</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {certificate?.nice_name || certificate?.domain_names.join(', ') || 'Details'}
          </Typography>
        </Box>
      }
      maxWidth="md"
      fullWidth
      actions={
        <CertificateActions
          certificate={certificate}
          onClose={onClose}
          onEdit={onEdit}
        />
      }
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="certificate details tabs">
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
          <Tab label="Hosts" icon={<HostsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <Box sx={{ overflow: 'auto' }}>
        {copiedText && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Copied {copiedText} to clipboard!
          </Alert>
        )}

        <TabPanel value={activeTab} index={0}>
          <CertificateInfoPanel
            certificate={certificate}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onCopyToClipboard={copyToClipboard}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <CertificateHostsPanel
            certificate={certificate as CertificateWithHosts}
            onNavigateToHost={handleNavigateToHost}
          />
        </TabPanel>
      </Box>
      
      {/* Export Dialog */}
      {/* {certificate && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={[certificate]}
          type="certificate"
          itemName="Certificate"
        />
      )} */}
    </AdaptiveContainer>
  )
}

export default CertificateDetailsDialog