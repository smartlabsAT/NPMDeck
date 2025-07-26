import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Close as CloseIcon,
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
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
  Terminal as LogIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  TrendingFlat as RedirectIcon,
} from '@mui/icons-material'
import { ProxyHost } from '../api/proxyHosts'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'

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
  const [activeTab, setActiveTab] = useState(0)
  const [copiedText, setCopiedText] = useState<string>('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    config: true,
    ssl: false,
    access: false,
  })
  const [linkedRedirections, setLinkedRedirections] = useState<RedirectionHost[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)

  // Parse tab from URL
  useEffect(() => {
    if (open && host) {
      const pathParts = location.pathname.split('/')
      const tabIndex = pathParts[pathParts.length - 1]
      switch (tabIndex) {
        case 'logs':
          setActiveTab(1)
          break
        case 'advanced':
          setActiveTab(2)
          break
        case 'connections':
          setActiveTab(3)
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
      const tabs = ['overview', 'logs', 'advanced', 'connections']
      navigate(`/hosts/proxy/${host.id}/view/${tabs[newValue]}`, { replace: true })
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <LanguageIcon color="primary" />
            <Typography variant="h6">
              {host.domain_names[0] || 'Proxy Host Details'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="proxy host details tabs">
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
          <Tab label="Logs" icon={<LogIcon />} iconPosition="start" />
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
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ overflow: 'auto' }}>
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
                    <Typography variant="body2" fontWeight="medium">
                      {host.access_list?.name || 'Public'}
                    </Typography>
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
                  
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                      Access List
                    </Typography>
                    <Typography variant="body2">
                      {host.access_list.name}
                    </Typography>
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
          {/* Logs Tab */}
          <Alert severity="info">
            Logs functionality will be implemented soon. This will show access logs, error logs, and other relevant information for this proxy host.
          </Alert>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
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

        <TabPanel value={activeTab} index={3}>
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
      </DialogContent>
      
      <DialogActions>
        {onEdit && (
          <Button 
            onClick={() => {
              onClose()
              onEdit(host)
            }}
            startIcon={<EditIcon />}
            color="primary"
          >
            Edit Proxy Host
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProxyHostDetailsDialog