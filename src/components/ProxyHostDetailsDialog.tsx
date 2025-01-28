import React, { useState, useEffect } from 'react'
import {
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Paper,
  Collapse,
  ListItemButton,
  Tabs,
  Tab,
  CircularProgress,
  ListItemIcon,
  Badge,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Edit as EditIcon,
  SwapHoriz as SwapHorizIcon,
  Block as BlockIcon,
  Speed as SpeedIcon,
  Wifi as WebSocketIcon,
  Https as HttpsIcon,
  Http as HttpIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  NetworkCheck as NetworkCheckIcon,
  Cancel as CancelIcon,
  TrendingFlat as RedirectIcon,
} from '@mui/icons-material'
import { ProxyHost } from '../api/proxyHosts'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { AccessList, accessListsApi } from '../api/accessLists'
// import ExportDialog from './ExportDialog'
import PermissionButton from './PermissionButton'
import { usePermissions } from '../hooks/usePermissions'
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

const ProxyHostDetailsDialog: React.FC<ProxyHostDetailsDialogProps> = ({
  open,
  onClose,
  host,
  onEdit,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { } = usePermissions()
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
        case 'advanced':
          setActiveTab(1)
          break
        case 'connections':
          setActiveTab(2)
          break
        case 'access':
          if (host?.access_list) {
            setActiveTab(3)
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
    if (activeTab === 3 && open && host?.access_list?.id) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    if (host) {
      const tabs = ['overview', 'advanced', 'connections']
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
          <Typography variant="body2" color="text.secondary">
            {host?.domain_names.join(', ') || 'Details'}
          </Typography>
        </Box>
      }
      maxWidth="md"
      fullWidth
      actions={
        <>
          <Button onClick={onClose}>Close</Button>
          {onEdit && (
            <PermissionButton
              resource="proxy_hosts"
              permissionAction="edit"
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => onEdit(host!)}
            >
              Edit
            </PermissionButton>
          )}
        </>
      }
    >
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="proxy host details tabs">
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
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
          {/* Overview Tab */}
          {/* Status Overview */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  {host.enabled ? (
                    host.meta.nginx_online !== false ? (
                      <CheckIcon color="success" />
                    ) : (
                      <WarningIcon color="error" />
                    )
                  ) : (
                    <BlockIcon color="disabled" />
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Status</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {!host.enabled ? 'Disabled' : host.meta.nginx_online === false ? 'Error' : 'Online'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  {host.certificate_id ? <HttpsIcon color="primary" /> : <HttpIcon color="action" />}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">SSL</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {host.certificate_id ? (host.ssl_forced ? 'Forced' : 'Enabled') : 'Disabled'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SecurityIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Access</Typography>
                    {host.access_list ? (
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        sx={{ 
                          cursor: 'pointer',
                          color: 'primary.main',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => {
                          setActiveTab(3)
                          navigate(`/hosts/proxy/${host.id}/view/access`, { replace: true })
                        }}
                      >
                        {host.access_list.name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" fontWeight="medium">
                        Public
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SwapHorizIcon color="primary" />
                <Typography variant="h6">Basic Information</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                    Host ID
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontFamily="monospace">
                      #{host.id}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(host.id.toString(), 'Host ID')}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                    Forward Destination
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {host.forward_scheme}://{host.forward_host}:{host.forward_port}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(host.created_on)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                    Last Modified
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(host.modified_on)}
                  </Typography>
                </Grid>

                {host.owner_user_id && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                      Owner
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        User #{host.owner_user_id}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Domain Names */}
            <Grid item xs={12}>
              <ListItemButton onClick={() => toggleSection('domains')} sx={{ pl: 0, pr: 1 }}>
                <ListItemText 
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <LanguageIcon color="primary" />
                      <Typography variant="h6">
                        Domain Names ({host.domain_names.length})
                      </Typography>
                    </Box>
                  }
                />
                {expandedSections.domains ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={expandedSections.domains} timeout="auto" unmountOnExit>
                <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, mt: 1 }}>
                  {host.domain_names.map((domain, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => copyToClipboard(domain, domain)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={domain} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Grid>

            {/* Configuration */}
            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">Configuration</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <SpeedIcon fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                      Cache Assets
                    </Typography>
                  </Box>
                  <Chip 
                    label={host.caching_enabled ? "Enabled" : "Disabled"} 
                    size="small" 
                    color={host.caching_enabled ? "success" : "default"}
                    icon={host.caching_enabled ? <CheckIcon /> : undefined}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <BlockIcon fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                      Block Common Exploits
                    </Typography>
                  </Box>
                  <Chip 
                    label={host.block_exploits ? "Enabled" : "Disabled"} 
                    size="small" 
                    color={host.block_exploits ? "success" : "default"}
                    icon={host.block_exploits ? <CheckIcon /> : undefined}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <WebSocketIcon fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                      WebSocket Support
                    </Typography>
                  </Box>
                  <Chip 
                    label={host.allow_websocket_upgrade ? "Enabled" : "Disabled"} 
                    size="small" 
                    color={host.allow_websocket_upgrade ? "success" : "default"}
                    icon={host.allow_websocket_upgrade ? <CheckIcon /> : undefined}
                  />
                </Grid>

                {host.http2_support !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <SpeedIcon fontSize="small" />
                      <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                        HTTP/2 Support
                      </Typography>
                    </Box>
                    <Chip 
                      label={host.http2_support ? "Enabled" : "Disabled"} 
                      size="small" 
                      color={host.http2_support ? "success" : "default"}
                      icon={host.http2_support ? <CheckIcon /> : undefined}
                    />
                  </Grid>
                )}

                {host.hsts_enabled !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <SecurityIcon fontSize="small" />
                      <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                        HSTS
                      </Typography>
                    </Box>
                    <Chip 
                      label={host.hsts_enabled ? (host.hsts_subdomains ? "Enabled + Subdomains" : "Enabled") : "Disabled"} 
                      size="small" 
                      color={host.hsts_enabled ? "success" : "default"}
                      icon={host.hsts_enabled ? <CheckIcon /> : undefined}
                    />
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* SSL Certificate Info */}
            {host.certificate_id && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <LockIcon color="primary" />
                    <Typography variant="h6">SSL Certificate</Typography>
                  </Box>
                  
                  {host.certificate && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                            Certificate Name
                          </Typography>
                          <Typography variant="body2">
                            {host.certificate.nice_name || host.certificate.domain_names.join(', ')}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                            Provider
                          </Typography>
                          <Chip 
                            label={host.certificate.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom'} 
                            size="small" 
                            color={host.certificate.provider === 'letsencrypt' ? 'primary' : 'default'}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => {
                              onClose()
                              navigate(`/security/certificates/${host.certificate_id}/view`)
                            }}
                          >
                            View Certificate Details
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}
                </Grid>
              </>
            )}

            {/* Access List Info */}
            {host.access_list_id && host.access_list && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6">Access Control</Typography>
                  </Box>
                  
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => {
                      setActiveTab(3)
                      navigate(`/hosts/proxy/${host.id}/view/access`, { replace: true })
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                          Access List
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {host.access_list.name}
                        </Typography>
                      </Box>
                      <LinkIcon color="action" />
                    </Box>
                  </Paper>
                </Grid>
              </>
            )}

            {/* Nginx Error */}
            {host.meta.nginx_online === false && host.meta.nginx_err && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Nginx Configuration Error
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ whiteSpace: 'pre-wrap' }}>
                      {host.meta.nginx_err}
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Advanced Tab */}
          {host.advanced_config ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                Custom Nginx Configuration
              </Typography>
              <Typography 
                variant="body2" 
                fontFamily="monospace" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  backgroundColor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                  mt: 1
                }}
              >
                {host.advanced_config}
              </Typography>
            </Paper>
          ) : (
            <Alert severity="info">
              No custom Nginx configuration defined for this proxy host.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Connections Tab */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <RedirectIcon color="primary" />
              <Typography variant="h6">Linked Redirections</Typography>
            </Box>
            
            {loadingConnections ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : linkedRedirections.length === 0 ? (
              <Alert severity="info">
                No redirections are pointing to this proxy host.
              </Alert>
            ) : (
              <Paper variant="outlined">
                <List>
                  {linkedRedirections.map((redirect, index) => (
                    <React.Fragment key={redirect.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        button
                        onClick={() => {
                          onClose()
                          navigate(`/hosts/redirection/${redirect.id}/view`)
                        }}
                      >
                        <ListItemIcon>
                          <RedirectIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1">
                                {redirect.domain_names.join(', ')}
                              </Typography>
                              {redirect.enabled ? (
                                <Chip label="Active" size="small" color="success" />
                              ) : (
                                <Chip label="Disabled" size="small" color="default" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                → {redirect.forward_scheme}://{redirect.forward_domain_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                HTTP {redirect.forward_http_code} • 
                                {redirect.preserve_path ? ' Preserves path' : ' Does not preserve path'}
                                {redirect.ssl_forced && ' • SSL Forced'}
                              </Typography>
                            </Box>
                          }
                        />
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                            navigate(`/hosts/redirection/${redirect.id}/edit`)
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {host.access_list && (
          <TabPanel value={activeTab} index={3}>
            {/* Access Control Tab */}
            {loadingAccessList ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading access list details...</Typography>
              </Box>
            ) : (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">{(fullAccessList || host.access_list).name}</Typography>
              </Box>

              {/* Access List Information */}
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Access List Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">ID</Typography>
                        <Typography variant="body2">#{(fullAccessList || host.access_list).id}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Created</Typography>
                        <Typography variant="body2">
                          {new Date((fullAccessList || host.access_list).created_on).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Modified</Typography>
                        <Typography variant="body2">
                          {new Date((fullAccessList || host.access_list).modified_on).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Owner</Typography>
                        <Typography variant="body2">
                          {(fullAccessList || host.access_list).owner ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <PersonIcon fontSize="small" />
                              {(fullAccessList || host.access_list).owner.name || (fullAccessList || host.access_list).owner.email || `User #${(fullAccessList || host.access_list).owner_user_id}`}
                            </Box>
                          ) : (
                            `User #${(fullAccessList || host.access_list).owner_user_id}`
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Configuration */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Configuration
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Satisfy Mode</Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <Chip 
                            label={(fullAccessList || host.access_list).satisfy_any ? 'Any' : 'All'} 
                            size="small" 
                            color={(fullAccessList || host.access_list).satisfy_any ? 'primary' : 'secondary'}
                          />
                          <Typography variant="body2">
                            {(fullAccessList || host.access_list).satisfy_any 
                              ? 'Access granted if ANY rule matches'
                              : 'Access granted if ALL rules match'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Pass Authentication to Host</Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          {(fullAccessList || host.access_list).pass_auth ? (
                            <CheckIcon color="success" fontSize="small" />
                          ) : (
                            <CancelIcon color="disabled" fontSize="small" />
                          )}
                          <Typography variant="body2">
                            {(fullAccessList || host.access_list).pass_auth 
                              ? 'Authorization headers are forwarded to the proxied host'
                              : 'Authorization headers are not forwarded'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Summary
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {(fullAccessList || host.access_list).items && (fullAccessList || host.access_list).items.length > 0 && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {(fullAccessList || host.access_list).items.length} authorized user{(fullAccessList || host.access_list).items.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                      {(fullAccessList || host.access_list).clients && (fullAccessList || host.access_list).clients.length > 0 && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <NetworkCheckIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {(fullAccessList || host.access_list).clients.length} IP rule{(fullAccessList || host.access_list).clients.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                      {(!(fullAccessList || host.access_list).items || (fullAccessList || host.access_list).items.length === 0) && 
                       (!(fullAccessList || host.access_list).clients || (fullAccessList || host.access_list).clients.length === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          No rules configured
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Authorization Users */}
                {host.access_list.items && host.access_list.items.length > 0 && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <PersonIcon color="action" />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Authorization - HTTP Basic Auth ({host.access_list.items.length} users)
                        </Typography>
                      </Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Users must provide username and password to access this host.
                        Passwords are not shown for security reasons.
                      </Alert>
                      <List>
                        {(fullAccessList || host.access_list).items!.map((item: any, index: number) => (
                          <ListItem key={item.id || index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            <ListItemIcon>
                              <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {item.username}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    (ID: #{item.id})
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Protected with password • Password: ••••••••
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(item.created_on).toLocaleString()}
                                  </Typography>
                                  {item.modified_on !== item.created_on && (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                      Modified: {new Date(item.modified_on).toLocaleString()}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}

                {/* Access Rules */}
                {host.access_list.clients && host.access_list.clients.length > 0 && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <NetworkCheckIcon color="action" />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Access Control - IP Based Rules ({host.access_list.clients.length} rules)
                        </Typography>
                      </Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Access is controlled based on client IP addresses. Rules are processed in order.
                      </Alert>
                      <List>
                        {(fullAccessList || host.access_list).clients!.map((client: any, index: number) => (
                          <ListItem key={client.id || index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            <ListItemIcon>
                              {client.directive === 'allow' ? (
                                <CheckIcon color="success" fontSize="small" />
                              ) : (
                                <CancelIcon color="error" fontSize="small" />
                              )}
                            </ListItemIcon>
                            <ListItemText 
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body1" fontFamily="monospace">
                                    {client.address}
                                  </Typography>
                                  <Chip 
                                    label={client.directive.toUpperCase()} 
                                    size="small" 
                                    color={client.directive === 'allow' ? 'success' : 'error'}
                                    variant="outlined"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    (ID: #{client.id})
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {client.directive === 'allow' ? 'Access allowed from this address' : 'Access denied from this address'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(client.created_on).toLocaleString()}
                                  </Typography>
                                  {client.modified_on !== client.created_on && (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                      Modified: {new Date(client.modified_on).toLocaleString()}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}

                {/* Meta Information */}
                {(fullAccessList || host.access_list).meta && Object.keys((fullAccessList || host.access_list).meta).length > 0 && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        Additional Metadata
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <pre style={{ 
                          margin: 0, 
                          fontSize: '0.875rem',
                          backgroundColor: 'background.paper',
                          padding: '8px',
                          borderRadius: '4px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify((fullAccessList || host.access_list).meta, null, 2)}
                        </pre>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {/* Link to full Access List */}
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center">
                    <Button
                      variant="outlined"
                      startIcon={<LinkIcon />}
                      onClick={() => {
                        onClose()
                        navigate(`/security/access-lists/${host.access_list!.id}/view`)
                      }}
                    >
                      View Full Access List Details
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            )}
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
  )
}

export default ProxyHostDetailsDialog