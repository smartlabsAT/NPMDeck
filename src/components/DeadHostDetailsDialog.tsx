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
  Tabs,
  Tab,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  Language as LanguageIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Https as HttpsIcon,
  Http as HttpIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { DeadHost } from '../api/deadHosts'
// import ExportDialog from './ExportDialog'
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
      id={`dead-host-tabpanel-${index}`}
      aria-labelledby={`dead-host-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

interface DeadHostDetailsDialogProps {
  open: boolean
  onClose: () => void
  host: DeadHost | null
  onEdit?: (host: DeadHost) => void
}

const DeadHostDetailsDialog: React.FC<DeadHostDetailsDialogProps> = ({
  open,
  onClose,
  host,
  onEdit,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(0)
  const [copiedText, setCopiedText] = useState<string>('')
  // const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Parse tab from URL
  useEffect(() => {
    if (open && host) {
      const pathParts = location.pathname.split('/')
      const tabIndex = pathParts[pathParts.length - 1]
      switch (tabIndex) {
        case 'advanced':
          setActiveTab(1)
          break
        default:
          setActiveTab(0)
          break
      }
    }
  }, [location.pathname, open, host])

  if (!host) return null

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label || text)
    setTimeout(() => setCopiedText(''), 2000)
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
      const tabs = ['overview', 'advanced']
      navigate(`/hosts/404/${host.id}/view/${tabs[newValue]}`, { replace: true })
    }
  }

  return (
    <AdaptiveContainer
      open={open}
      onClose={onClose}
      entity="dead_hosts"
      operation="view"
      title={
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BlockIcon sx={{ color: '#cd201f' }} />
            <Typography variant="h6">404 Host</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {host.domain_names.join(', ') || 'Details'}
          </Typography>
        </Box>
      }
      maxWidth="md"
      fullWidth
      actions={
        <>
          {/* <Button
            onClick={() => setExportDialogOpen(true)}
            startIcon={<DownloadIcon />}
          >
            Export
          </Button> */}
          {onEdit && (
            <Button 
              onClick={() => {
                onClose()
                onEdit(host)
              }}
              startIcon={<EditIcon />}
              color="primary"
            >
              Edit 404 Host
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="dead host details tabs">
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
          <Tab label="Advanced" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

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
                  <BlockIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">Type</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      404 Host
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
                <InfoIcon color="primary" />
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
                    Response
                  </Typography>
                  <Typography variant="body2">
                    404 Not Found
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
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LanguageIcon color="primary" />
                <Typography variant="h6">
                  Domain Names ({host.domain_names.length})
                </Typography>
              </Box>
              
              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
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
                {host.http2_support !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
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
              No custom Nginx configuration defined for this 404 host.
            </Alert>
          )}
        </TabPanel>
      </Box>
      
      {/* Export Dialog */}
      {/* {host && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={[host]}
          type="dead_host"
          itemName="404 Host"
        />
      )} */}
    </AdaptiveContainer>
  )
}

export default DeadHostDetailsDialog