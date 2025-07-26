import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Button,
  Badge,
} from '@mui/material'
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Language as LanguageIcon,
  TrendingFlat as RedirectIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  SwapHoriz as ProxyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { RedirectionHost } from '../api/redirectionHosts'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import ExportDialog from './ExportDialog'

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
      id={`redirection-host-tabpanel-${index}`}
      aria-labelledby={`redirection-host-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

interface RedirectionHostDetailsDialogProps {
  open: boolean
  onClose: () => void
  host: RedirectionHost | null
  onEdit: (host: RedirectionHost) => void
}

export default function RedirectionHostDetailsDialog({
  open,
  onClose,
  host,
  onEdit
}: RedirectionHostDetailsDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(0)
  const [linkedProxyHost, setLinkedProxyHost] = useState<ProxyHost | null>(null)
  const [loadingConnection, setLoadingConnection] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Parse tab from URL
  useEffect(() => {
    if (open && host) {
      const pathParts = location.pathname.split('/')
      const tabIndex = pathParts[pathParts.length - 1]
      switch (tabIndex) {
        case 'connections':
          setActiveTab(1)
          break
        default:
          setActiveTab(0)
          break
      }
    }
  }, [location.pathname, open, host])

  // Load connection when dialog opens
  useEffect(() => {
    if (open && host) {
      loadConnection()
    }
  }, [open, host])

  const loadConnection = async () => {
    if (!host) return
    
    setLoadingConnection(true)
    try {
      const proxyHosts = await proxyHostsApi.getAll()
      
      // Find proxy host that matches the forward domain
      const linkedHost = proxyHosts.find(proxy => 
        proxy.domain_names.some(domain => 
          domain.toLowerCase() === host.forward_domain_name.toLowerCase()
        )
      )
      
      setLinkedProxyHost(linkedHost || null)
    } catch (error) {
      console.error('Failed to load connection:', error)
    } finally {
      setLoadingConnection(false)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    if (host) {
      const tabs = ['overview', 'connections']
      navigate(`/hosts/redirection/${host.id}/view/${tabs[newValue]}`, { replace: true })
    }
  }

  if (!host) return null

  const getHttpStatusLabel = (code: number): string => {
    const statusMap: { [key: number]: string } = {
      300: '300 Multiple Choices',
      301: '301 Moved Permanently',
      302: '302 Found',
      303: '303 See Other',
      307: '307 Temporary Redirect',
      308: '308 Permanent Redirect',
    }
    return statusMap[code] || code.toString()
  }

  const getStatusColor = (enabled: boolean, online?: boolean) => {
    if (!enabled) return 'default'
    if (online === false) return 'error'
    return 'success'
  }

  const getStatusText = (enabled: boolean, online?: boolean) => {
    if (!enabled) return 'Disabled'
    if (online === false) return 'Offline'
    return 'Online'
  }

  const getDaysUntilExpiry = (expiresOn: string | null) => {
    if (!expiresOn) return null
    const expiryDate = new Date(expiresOn)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getCertificateStatus = () => {
    if (!host.certificate?.expires_on) return null
    const days = getDaysUntilExpiry(host.certificate.expires_on)
    if (!days || days < 0) return { color: 'error' as const, text: 'Expired' }
    if (days <= 7) return { color: 'error' as const, text: `Expires in ${days} days` }
    if (days <= 30) return { color: 'warning' as const, text: `Expires in ${days} days` }
    return { color: 'success' as const, text: `Valid for ${days} days` }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <RedirectIcon color="primary" />
            <Typography variant="h6">Redirection Host Details</Typography>
          </Box>
          <Box>
            <IconButton
              color="primary"
              onClick={() => onEdit(host)}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="redirection host details tabs">
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
          <Tab 
            label={
              <Badge badgeContent={linkedProxyHost ? 1 : 0} color="primary">
                <Typography>Connections</Typography>
              </Badge>
            } 
            icon={<LinkIcon />} 
            iconPosition="start" 
          />
        </Tabs>
      </Box>

      <DialogContent dividers>
        <TabPanel value={activeTab} index={0}>
          {/* Overview Tab */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Chip
                icon={host.enabled ? <CheckCircleIcon /> : <CancelIcon />}
                label={getStatusText(host.enabled, host.meta.nginx_online)}
                color={getStatusColor(host.enabled, host.meta.nginx_online)}
              />
              {host.meta.nginx_err && (
                <Alert severity="error" sx={{ flexGrow: 1 }}>
                  {host.meta.nginx_err}
                </Alert>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LanguageIcon color="primary" />
                <Typography variant="h6">Source Domains</Typography>
              </Box>
              <List dense>
                {host.domain_names.map((domain, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={domain} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <RedirectIcon color="primary" />
                <Typography variant="h6">Destination</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="URL"
                    secondary={`${host.forward_scheme}://${host.forward_domain_name}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="HTTP Status Code"
                    secondary={getHttpStatusLabel(host.forward_http_code)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Preserve Path"
                    secondary={host.preserve_path ? 'Yes' : 'No'}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LockIcon color="primary" />
                <Typography variant="h6">SSL Configuration</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {host.certificate_id ? <LockIcon /> : <LockOpenIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary="SSL Certificate"
                    secondary={
                      host.certificate ? (
                        <Box>
                          <Typography variant="body2">
                            {host.certificate.nice_name}
                          </Typography>
                          {getCertificateStatus() && (
                            <Chip
                              size="small"
                              label={getCertificateStatus()!.text}
                              color={getCertificateStatus()!.color}
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : 'None'
                    }
                  />
                </ListItem>
                {host.certificate_id > 0 && (
                  <>
                    <ListItem>
                      <ListItemText
                        primary="Force SSL"
                        secondary={host.ssl_forced ? 'Yes' : 'No'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="HTTP/2 Support"
                        secondary={host.http2_support ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="HSTS"
                        secondary={
                          host.hsts_enabled
                            ? `Enabled${host.hsts_subdomains ? ' (including subdomains)' : ''}`
                            : 'Disabled'
                        }
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Security</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ShieldIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Block Common Exploits"
                    secondary={host.block_exploits ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {host.advanced_config && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CodeIcon color="primary" />
                  <Typography variant="h6">Advanced Configuration</Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  {host.advanced_config}
                </Box>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <InfoIcon color="primary" />
                <Typography variant="h6">
                  Metadata
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(host.created_on).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Modified
                  </Typography>
                  <Typography variant="body1">
                    {new Date(host.modified_on).toLocaleString()}
                  </Typography>
                </Grid>
                {host.owner && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Owner
                    </Typography>
                    <Typography variant="body1">
                      {host.owner.name || host.owner.email}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {host.id}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Connections Tab */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <ProxyIcon color="primary" />
              <Typography variant="h6">Linked Proxy Host</Typography>
            </Box>
            
            {loadingConnection ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : linkedProxyHost ? (
              <Paper variant="outlined">
                <List>
                  <ListItem
                    button
                    onClick={() => {
                      onClose()
                      navigate(`/hosts/proxy/${linkedProxyHost.id}/view`)
                    }}
                  >
                    <ListItemIcon>
                      <ProxyIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">
                            {linkedProxyHost.domain_names.join(', ')}
                          </Typography>
                          {linkedProxyHost.enabled ? (
                            <Chip label="Active" size="small" color="success" />
                          ) : (
                            <Chip label="Disabled" size="small" color="default" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            → {linkedProxyHost.forward_scheme}://{linkedProxyHost.forward_host}:{linkedProxyHost.forward_port}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {linkedProxyHost.certificate_id ? 'SSL Enabled' : 'No SSL'}
                            {linkedProxyHost.caching_enabled && ' • Caching enabled'}
                            {linkedProxyHost.block_exploits && ' • Blocks exploits'}
                            {linkedProxyHost.allow_websocket_upgrade && ' • Websockets enabled'}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                        navigate(`/hosts/proxy/${linkedProxyHost.id}/edit`)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </ListItem>
                </List>
              </Paper>
            ) : (
              <Alert severity="info">
                This redirection does not point to any configured proxy host.
                {host.forward_domain_name && (
                  <Box mt={1}>
                    <Typography variant="body2">
                      Target domain: <strong>{host.forward_domain_name}</strong>
                    </Typography>
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button
          onClick={() => setExportDialogOpen(true)}
          startIcon={<DownloadIcon />}
        >
          Export
        </Button>
        <Box sx={{ flex: 1 }} />
        {onEdit && (
          <Button 
            onClick={() => {
              onClose()
              onEdit(host)
            }}
            startIcon={<EditIcon />}
            color="primary"
          >
            Edit Redirection Host
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      
      {/* Export Dialog */}
      {host && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={[host]}
          type="redirection_host"
          itemName="Redirection Host"
        />
      )}
    </Dialog>
  )
}