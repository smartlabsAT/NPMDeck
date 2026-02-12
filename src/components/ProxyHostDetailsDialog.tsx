import React, { useState, useEffect } from 'react'
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
// import ExportDialog from './ExportDialog'
import { usePermissions } from '../hooks/usePermissions'
import AdaptiveContainer from './AdaptiveContainer'
import ProxyHostInfoPanel from './features/proxy-hosts/ProxyHostInfoPanel'
import ProxyHostSSLPanel from './features/proxy-hosts/ProxyHostSSLPanel'
import ProxyHostAdvancedPanel from './features/proxy-hosts/ProxyHostAdvancedPanel'
import ProxyHostConnectionsPanel from './features/proxy-hosts/ProxyHostConnectionsPanel'
import ProxyHostAccessPanel from './features/proxy-hosts/ProxyHostAccessPanel'
import ProxyHostActions from './features/proxy-hosts/ProxyHostActions'

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
      id={`proxy-host-tabpanel-${index}`}
      aria-labelledby={`proxy-host-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

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
  const { } = usePermissions() // eslint-disable-line no-empty-pattern
  const [activeTab, setActiveTab] = useState(0)
  const [copiedText, setCopiedText] = useState<string>('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    config: true,
    ssl: false,
    access: false,
  })
  const [linkedRedirections, setLinkedRedirections] = useState<RedirectionHost[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  // const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [fullAccessList, setFullAccessList] = useState<AccessList | null>(null)
  const [loadingAccessList, setLoadingAccessList] = useState(false)

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
    try {
      const redirections = await redirectionHostsApi.getAll()
      
      // Filter redirections that point to any of this host's domains
      const linkedRedirects = redirections.filter(redirect => {
        const targetDomain = redirect.forward_domain_name.toLowerCase()
        return host.domain_names.some(domain => domain.toLowerCase() === targetDomain)
      })
      
      setLinkedRedirections(linkedRedirects)
    } catch (error) {
      console.error('Failed to load connections:', error)
    } finally {
      setLoadingConnections(false)
    }
  }

  const loadAccessListDetails = async () => {
    if (!host?.access_list?.id) return
    
    try {
      setLoadingAccessList(true)
      const data = await accessListsApi.getById(host.access_list.id, ['items', 'clients', 'owner'])
      setFullAccessList(data)
    } catch (error) {
      console.error('Failed to load access list details:', error)
    } finally {
      setLoadingAccessList(false)
    }
  }

  if (!host) return null

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
            <SwapHorizIcon sx={{ color: '#5eba00' }} />
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

        <TabPanel value={activeTab} index={0}>
          <ProxyHostInfoPanel
            host={host}
            expandedSections={expandedSections}
            copiedText={copiedText}
            onToggleSection={toggleSection}
            onCopyToClipboard={copyToClipboard}
            onNavigateToAccess={handleNavigateToAccess}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ProxyHostSSLPanel
            host={host}
            onNavigateToCertificate={handleNavigateToCertificate}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ProxyHostAdvancedPanel host={host} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <ProxyHostConnectionsPanel
            linkedRedirections={linkedRedirections}
            loadingConnections={loadingConnections}
            onNavigateToRedirection={handleNavigateToRedirection}
            onEditRedirection={handleEditRedirection}
          />
        </TabPanel>

        {host.access_list && (
          <TabPanel value={activeTab} index={4}>
            <ProxyHostAccessPanel
              host={host}
              fullAccessList={fullAccessList}
              loadingAccessList={loadingAccessList}
              onNavigateToFullAccessList={handleNavigateToFullAccessList}
            />
          </TabPanel>
        )}
      </Box>
      {/* Export Button for Admin */}
      {/* {isAdmin && (
        <Box sx={{ mt: 2 }}>
          <Button
            onClick={() => setExportDialogOpen(true)}
            startIcon={<DownloadIcon />}
            variant="outlined"
            fullWidth
          >
            Export
          </Button>
        </Box>
      )} */}
      {/* Export Dialog */}
      {/* {host && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={[host]}
          type="proxy_host"
          itemName="Proxy Host"
        />
      )} */}
    </AdaptiveContainer>
  );
}

export default ProxyHostDetailsDialog