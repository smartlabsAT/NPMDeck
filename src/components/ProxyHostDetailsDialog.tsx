import { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  Badge,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  SwapHoriz as SwapHorizIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { ProxyHost } from '../api/proxyHosts'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { AccessList, accessListsApi } from '../api/accessLists'
import logger from '../utils/logger'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import AdaptiveContainer from './AdaptiveContainer'
import TabPanel from './shared/TabPanel'
import ProxyHostInfoPanel from './features/proxy-hosts/ProxyHostInfoPanel'
import ProxyHostSSLPanel from './features/proxy-hosts/ProxyHostSSLPanel'
import ProxyHostAdvancedPanel from './features/proxy-hosts/ProxyHostAdvancedPanel'
import ProxyHostConnectionsPanel from './features/proxy-hosts/ProxyHostConnectionsPanel'
import ProxyHostAccessPanel from './features/proxy-hosts/ProxyHostAccessPanel'
import ProxyHostActions from './features/proxy-hosts/ProxyHostActions'
import { NAVIGATION_COLORS } from '../constants/navigation'

interface ProxyHostDetailsDialogProps {
  open: boolean
  onClose: () => void
  host: ProxyHost | null
  onEdit?: (host: ProxyHost) => void
}

const ProxyHostDetailsDialog = ({
  open,
  onClose,
  host,
  onEdit,
}: ProxyHostDetailsDialogProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(0)
  const { copiedText, copyToClipboard } = useCopyToClipboard()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    config: true,
    ssl: false,
    access: false,
  })
  const [linkedRedirections, setLinkedRedirections] = useState<RedirectionHost[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [connectionsError, setConnectionsError] = useState<string | null>(null)
  const [fullAccessList, setFullAccessList] = useState<AccessList | null>(null)
  const [loadingAccessList, setLoadingAccessList] = useState(false)
  const [accessListError, setAccessListError] = useState<string | null>(null)

  // Parse tab from URL
  useEffect(() => {
    if (open && host) {
      const pathParts = location.pathname.split('/')
      const tabIndex = pathParts[pathParts.length - 1]
      switch (tabIndex) {
        case 'ssl':
          setActiveTab(1)
          break
        case 'advanced':
          setActiveTab(2)
          break
        case 'connections':
          setActiveTab(3)
          break
        case 'access':
          if (host?.access_list) {
            setActiveTab(4)
          }
          break
        default:
          setActiveTab(0)
          break
      }
    }
  }, [location.pathname, open, host])

  // Load connections when dialog opens or host changes
  useEffect(() => {
    if (open && host) {
      loadConnections()
    }
  }, [open, host])

  // Load access list details when access tab is active
  useEffect(() => {
    if (activeTab === 4 && open && host?.access_list?.id) {
      loadAccessListDetails()
    }
  }, [activeTab, open, host?.access_list?.id])

  const loadConnections = async () => {
    if (!host) return

    setLoadingConnections(true)
    setConnectionsError(null)
    try {
      const redirections = await redirectionHostsApi.getAll()

      // Filter redirections that point to any of this host's domains
      const linkedRedirects = redirections.filter(redirect => {
        const targetDomain = redirect.forward_domain_name.toLowerCase()
        return host.domain_names.some(domain => domain.toLowerCase() === targetDomain)
      })

      setLinkedRedirections(linkedRedirects)
    } catch (error) {
      logger.error('Failed to load connections:', error)
      setConnectionsError('Failed to load connected redirections.')
    } finally {
      setLoadingConnections(false)
    }
  }

  const loadAccessListDetails = async () => {
    if (!host?.access_list?.id) return

    try {
      setLoadingAccessList(true)
      setAccessListError(null)
      const data = await accessListsApi.getById(host.access_list.id, ['items', 'clients', 'owner'])
      setFullAccessList(data)
    } catch (error) {
      logger.error('Failed to load access list details:', error)
      setAccessListError('Failed to load access list details.')
    } finally {
      setLoadingAccessList(false)
    }
  }

  if (!host) return null

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleNavigateToAccess = () => {
    setActiveTab(4)
    navigate(`/hosts/proxy/${host!.id}/view/access`, { replace: true })
  }

  const handleNavigateToCertificate = () => {
    onClose()
    navigate(`/security/certificates/${host!.certificate_id}/view`)
  }

  const handleNavigateToFullAccessList = () => {
    onClose()
    navigate(`/security/access-lists/${host!.access_list!.id}/view`)
  }

  const handleNavigateToRedirection = (redirectionId: number) => {
    onClose()
    navigate(`/hosts/redirection/${redirectionId}/view`)
  }

  const handleEditRedirection = (redirectionId: number) => {
    onClose()
    navigate(`/hosts/redirection/${redirectionId}/edit`)
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    if (host) {
      const tabs = ['overview', 'ssl', 'advanced', 'connections']
      if (host.access_list) {
        tabs.push('access')
      }
      navigate(`/hosts/proxy/${host.id}/view/${tabs[newValue]}`, { replace: true })
    }
  }

  return (
    <AdaptiveContainer
      open={open}
      onClose={onClose}
      entity="proxy_hosts"
      operation="view"
      title={
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <SwapHorizIcon sx={{ color: NAVIGATION_COLORS.success }} />
            <Typography variant="h6">Proxy Host</Typography>
          </Box>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {host?.domain_names.join(', ') || 'Details'}
          </Typography>
        </Box>
      }
      maxWidth="md"
      fullWidth
      actions={
        <ProxyHostActions
          host={host}
          onClose={onClose}
          onEdit={onEdit}
        />
      }
    >
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="proxy host details tabs">
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
          <Tab label="SSL Certificate" icon={<LockIcon />} iconPosition="start" />
          <Tab label="Advanced" icon={<SettingsIcon />} iconPosition="start" />
          <Tab 
            label={
              <Badge badgeContent={linkedRedirections.length} color="primary" max={99}>
                <Typography>Connections</Typography>
              </Badge>
            } 
            icon={<LinkIcon />} 
            iconPosition="start" 
          />
          {host.access_list && (
            <Tab label="Access Control" icon={<SecurityIcon />} iconPosition="start" />
          )}
        </Tabs>
      </Box>
      {/* Content */}
      <Box sx={{ overflow: 'auto' }}>
        {copiedText && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Copied {copiedText} to clipboard!
          </Alert>
        )}

        <TabPanel value={activeTab} index={0} animation="none" padding={0} sx={{ py: 2 }}>
          <ProxyHostInfoPanel
            host={host}
            expandedSections={expandedSections}
            copiedText={copiedText}
            onToggleSection={toggleSection}
            onCopyToClipboard={copyToClipboard}
            onNavigateToAccess={handleNavigateToAccess}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1} animation="none" padding={0} sx={{ py: 2 }}>
          <ProxyHostSSLPanel
            host={host}
            onNavigateToCertificate={handleNavigateToCertificate}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2} animation="none" padding={0} sx={{ py: 2 }}>
          <ProxyHostAdvancedPanel host={host} />
        </TabPanel>

        <TabPanel value={activeTab} index={3} animation="none" padding={0} sx={{ py: 2 }}>
          <ProxyHostConnectionsPanel
            linkedRedirections={linkedRedirections}
            loadingConnections={loadingConnections}
            error={connectionsError}
            onNavigateToRedirection={handleNavigateToRedirection}
            onEditRedirection={handleEditRedirection}
          />
        </TabPanel>

        {host.access_list && (
          <TabPanel value={activeTab} index={4} animation="none" padding={0} sx={{ py: 2 }}>
            <ProxyHostAccessPanel
              host={host}
              fullAccessList={fullAccessList}
              loadingAccessList={loadingAccessList}
              error={accessListError}
              onNavigateToFullAccessList={handleNavigateToFullAccessList}
            />
          </TabPanel>
        )}
      </Box>
    </AdaptiveContainer>
  );
}

export default ProxyHostDetailsDialog