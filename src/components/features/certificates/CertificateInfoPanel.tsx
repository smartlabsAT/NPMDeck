import React from 'react'
import {
  Typography,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Collapse,
  ListItemButton,
  Divider,
} from '@mui/material'
import {
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
} from '@mui/icons-material'
import { Certificate } from '../../../api/certificates'

interface CertificateInfoPanelProps {
  certificate: Certificate
  expandedSections: Record<string, boolean>
  onToggleSection: (section: string) => void
  onCopyToClipboard: (text: string, label?: string) => void
}

const CertificateInfoPanel: React.FC<CertificateInfoPanelProps> = ({
  certificate,
  expandedSections,
  onToggleSection,
  onCopyToClipboard,
}) => {
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

  const daysUntilExpiry = getDaysUntilExpiry(certificate.expires_on)
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30

  return (
    <Grid container spacing={3}>
      {/* Status Overview */}
      <Grid item xs={12}>
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
      </Grid>

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
                onClick={() => onCopyToClipboard(certificate.id.toString(), 'Certificate ID')}
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
                  onClick={() => onCopyToClipboard(certificate.meta.certificate_id!, 'LE Certificate ID')}
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
        <ListItemButton onClick={() => onToggleSection('domains')} sx={{ pl: 0, pr: 1 }}>
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
                    onClick={() => onCopyToClipboard(domain, domain)}
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
    </Grid>
  )
}

export default CertificateInfoPanel