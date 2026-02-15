import { useState, useEffect } from 'react'
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
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import AdaptiveContainer from './AdaptiveContainer'
import TabPanel from './shared/TabPanel'
import CertificateInfoPanel from './features/certificates/CertificateInfoPanel'
import CertificateHostsPanel from './features/certificates/CertificateHostsPanel'
import CertificateActions from './features/certificates/CertificateActions'
import { NAVIGATION_COLORS } from '../constants/navigation'

interface CertificateDetailsDialogProps {
  open: boolean
  onClose: () => void
  certificate: Certificate | null
  onEdit?: (certificate: Certificate) => void
}

const CertificateDetailsDialog = ({
  open,
  onClose,
  certificate,
  onEdit,
}: CertificateDetailsDialogProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(0)
  const { copiedText, copyToClipboard } = useCopyToClipboard()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    domains: true,
    hosts: false,
  })

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
            <VpnKey sx={{ color: NAVIGATION_COLORS.success }} />
            <Typography variant="h6">SSL Certificate</Typography>
          </Box>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
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

        <TabPanel value={activeTab} index={0} animation="none" padding={0} sx={{ py: 2 }}>
          <CertificateInfoPanel
            certificate={certificate}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onCopyToClipboard={copyToClipboard}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1} animation="none" padding={0} sx={{ py: 2 }}>
          <CertificateHostsPanel
            certificate={certificate as CertificateWithHosts}
            onNavigateToHost={handleNavigateToHost}
          />
        </TabPanel>
      </Box>
    </AdaptiveContainer>
  );
}

export default CertificateDetailsDialog