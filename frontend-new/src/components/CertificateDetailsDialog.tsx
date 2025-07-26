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
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Close as CloseIcon,
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  Fingerprint as FingerprintIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Language as DomainIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon,
  Dns as DnsIcon,
  Language as LanguageIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon,
  WebAsset as HostsIcon,
  Settings as AdvancedIcon,
} from '@mui/icons-material'
import { Certificate } from '../api/certificates'

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
  const [activeTab, setActiveTab] = useState(0)
  const [copiedText, setCopiedText] = useState<string>('')
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
        case 'advanced':
          setActiveTab(2)
          break
        default:
          setActiveTab(0)
          break
      }
    }
  }, [location.pathname, open, certificate])

  if (!certificate) return null

  const getDaysUntilExpiry = (expiresOn: string | null) => {
    if (!expiresOn) return null
    const expiryDate = new Date(expiresOn)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

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

  const daysUntilExpiry = getDaysUntilExpiry(certificate.expires_on)
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30

  // Calculate additional certificate info
  const totalHosts = 
    ((certificate as any).proxy_hosts?.length || 0) +
    ((certificate as any).redirection_hosts?.length || 0) +
    ((certificate as any).dead_hosts?.length || 0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    if (certificate) {
      const tabs = ['overview', 'hosts', 'advanced']
      navigate(`/security/certificates/${certificate.id}/view/${tabs[newValue]}`, { replace: true })
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
            <LockIcon color="primary" />
            <Typography variant="h6">
              {certificate.nice_name || certificate.domain_names[0] || 'Certificate Details'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="certificate details tabs">
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
          <Tab label="Hosts" icon={<HostsIcon />} iconPosition="start" />
          <Tab label="Advanced" icon={<AdvancedIcon />} iconPosition="start" />
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
                <SecurityIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Provider</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {certificate.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon color={isExpired ? 'error' : isExpiringSoon ? 'warning' : 'success'} />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Validity</Typography>
                  <Typography variant="body2" fontWeight="medium" color={isExpired ? 'error' : 'inherit'}>
                    {isExpired ? 'Expired' : `${daysUntilExpiry} days left`}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <DomainIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Domains</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {certificate.domain_names.length} domain{certificate.domain_names.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Certificate Information */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <FingerprintIcon color="primary" />
              <Typography variant="h6">Certificate Information</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                  Certificate ID
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontFamily="monospace">
                    #{certificate.id}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(certificate.id.toString(), 'Certificate ID')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>

              {certificate.meta?.certificate_id && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                    Let's Encrypt Certificate ID
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontFamily="monospace">
                      {certificate.meta.certificate_id}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(certificate.meta.certificate_id!, 'LE Certificate ID')}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(certificate.created_on)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                  Last Modified
                </Typography>
                <Typography variant="body2">
                  {formatDate(certificate.modified_on)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                  Expires
                </Typography>
                <Typography variant="body2" color={isExpired ? 'error' : 'inherit'}>
                  {formatDate(certificate.expires_on)}
                </Typography>
              </Grid>

              {certificate.owner_user_id && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                    Owner
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      User #{certificate.owner_user_id}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Domain Names - Expandable */}
          <Grid item xs={12}>
            <ListItemButton onClick={() => toggleSection('domains')} sx={{ pl: 0, pr: 1 }}>
              <ListItemText 
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <DomainIcon color="primary" />
                    <Typography variant="h6">
                      Domain Names ({certificate.domain_names.length})
                    </Typography>
                  </Box>
                }
              />
              {expandedSections.domains ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            
            <Collapse in={expandedSections.domains} timeout="auto" unmountOnExit>
              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, mt: 1 }}>
                {certificate.domain_names.map((domain, index) => (
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
                    <ListItemText 
                      primary={domain}
                      secondary={domain.startsWith('*.') ? 'Wildcard certificate' : null}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Grid>

          {/* Let's Encrypt Configuration */}
          {certificate.provider === 'letsencrypt' && certificate.meta && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CloudIcon color="primary" />
                  <Typography variant="h6">Let's Encrypt Configuration</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                      Email
                    </Typography>
                    <Typography variant="body2">
                      {certificate.meta.letsencrypt_email || 'Not specified'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                      Challenge Type
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {certificate.meta.dns_challenge ? <DnsIcon fontSize="small" /> : null}
                      <Typography variant="body2">
                        {certificate.meta.dns_challenge ? 'DNS Challenge' : 'HTTP Challenge'}
                      </Typography>
                    </Box>
                  </Grid>

                  {certificate.meta.dns_challenge && (
                    <>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                          DNS Provider
                        </Typography>
                        <Typography variant="body2">
                          {certificate.meta.dns_provider || 'Not specified'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                          Propagation Seconds
                        </Typography>
                        <Typography variant="body2">
                          {certificate.meta.propagation_seconds || 'Default'}
                        </Typography>
                      </Grid>

                      {certificate.meta.dns_provider_credentials && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                            DNS Credentials Configured
                          </Typography>
                          <Chip 
                            label="Yes" 
                            size="small" 
                            color="success" 
                            icon={<CheckIcon />}
                          />
                        </Grid>
                      )}
                    </>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                      Agreement Status
                    </Typography>
                    <Chip 
                      label={certificate.meta.letsencrypt_agree ? "Agreed" : "Not Agreed"} 
                      size="small" 
                      color={certificate.meta.letsencrypt_agree ? "success" : "default"}
                      icon={certificate.meta.letsencrypt_agree ? <CheckIcon /> : undefined}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}

          {/* Host usage summary */}
          {totalHosts > 0 && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LanguageIcon color="primary" />
                  <Typography variant="h6">Host Usage Summary</Typography>
                </Box>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    {(certificate as any).proxy_hosts?.length > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                          Proxy Hosts
                        </Typography>
                        <Typography variant="h6">
                          {(certificate as any).proxy_hosts.length}
                        </Typography>
                      </Grid>
                    )}
                    {(certificate as any).redirection_hosts?.length > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                          Redirection Hosts
                        </Typography>
                        <Typography variant="h6">
                          {(certificate as any).redirection_hosts.length}
                        </Typography>
                      </Grid>
                    )}
                    {(certificate as any).dead_hosts?.length > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                          404 Hosts
                        </Typography>
                        <Typography variant="h6">
                          {(certificate as any).dead_hosts.length}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                          setActiveTab(1)
                          if (certificate) {
                            navigate(`/security/certificates/${certificate.id}/view/hosts`, { replace: true })
                          }
                        }}
                      >
                        View all hosts using this certificate
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Hosts Tab */}
          {totalHosts > 0 ? (
            <Grid container spacing={3}>
              {(certificate as any).proxy_hosts?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Proxy Hosts ({(certificate as any).proxy_hosts.length})
                  </Typography>
                  <List dense>
                    {(certificate as any).proxy_hosts.map((host: any) => (
                      <ListItem
                        key={host.id}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            size="small" 
                            onClick={() => {
                              onClose()
                              navigate(`/hosts/proxy/${host.id}/edit`)
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText 
                          primary={host.domain_names.join(', ')}
                          secondary={`${host.forward_scheme}://${host.forward_host}:${host.forward_port}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
              
              {(certificate as any).redirection_hosts?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Redirection Hosts ({(certificate as any).redirection_hosts.length})
                  </Typography>
                  <List dense>
                    {(certificate as any).redirection_hosts.map((host: any) => (
                      <ListItem
                        key={host.id}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            size="small" 
                            onClick={() => {
                              onClose()
                              navigate(`/hosts/redirection/${host.id}/edit`)
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText 
                          primary={host.domain_names.join(', ')}
                          secondary={`Redirects to: ${host.forward_scheme}://${host.forward_domain_name}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
              
              {(certificate as any).dead_hosts?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    404 Hosts ({(certificate as any).dead_hosts.length})
                  </Typography>
                  <List dense>
                    {(certificate as any).dead_hosts.map((host: any) => (
                      <ListItem
                        key={host.id}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            size="small" 
                            onClick={() => {
                              onClose()
                              navigate(`/hosts/404/${host.id}/edit`)
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText primary={host.domain_names.join(', ')} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
            </Grid>
          ) : (
            <Alert severity="info">
              This certificate is not currently used by any hosts.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Advanced Tab */}
          <Alert severity="info">
            Advanced certificate information and raw certificate data will be displayed here in the future.
          </Alert>
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        {onEdit && (
          <Button 
            onClick={() => {
              onClose()
              onEdit(certificate)
            }}
            startIcon={<EditIcon />}
            color="primary"
          >
            Edit Certificate
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CertificateDetailsDialog