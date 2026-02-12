import {
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  Divider,
  IconButton,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  Fingerprint as FingerprintIcon,
  Schedule as ScheduleIcon,
  // Person as PersonIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon,
  Dns as DnsIcon,
} from '@mui/icons-material'
import { Certificate } from '../../../api/certificates'
import OwnerDisplay from '../../shared/OwnerDisplay'

interface CertificateInfoPanelProps {
  certificate: Certificate
  expandedSections: Record<string, boolean>
  onToggleSection: (section: string) => void
  onCopyToClipboard: (text: string, label?: string) => void
}

const CertificateInfoPanel = ({
  certificate,
  expandedSections: _expandedSections,
  onToggleSection: _onToggleSection,
  onCopyToClipboard,
}: CertificateInfoPanelProps) => {
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
      <Grid size={12}>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SecurityIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Provider</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {certificate.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleIcon color={isExpired ? 'error' : isExpiringSoon ? 'warning' : 'success'} />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Validity</Typography>
                  <Typography variant="body2" fontWeight="medium" color={isExpired ? 'error' : 'inherit'}>
                    {isExpired ? 'Expired' : `${daysUntilExpiry} days left`}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckIcon color="success" />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Status</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {isExpired ? 'Invalid' : 'Valid'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Certificate Information */}
      <Grid size={12}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FingerprintIcon color="primary" />
          <Typography variant="h6">Certificate Information</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
              Certificate ID
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                Let&apos;s Encrypt Certificate ID
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
              Created
            </Typography>
            <Typography variant="body2">
              {formatDate(certificate.created_on)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
              Last Modified
            </Typography>
            <Typography variant="body2">
              {formatDate(certificate.modified_on)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
              Expires
            </Typography>
            <Typography variant="body2" color={isExpired ? 'error' : 'inherit'}>
              {formatDate(certificate.expires_on)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
              Owner
            </Typography>
            <OwnerDisplay 
              owner={certificate.owner} 
              userId={certificate.owner_user_id}
            />
          </Grid>
        </Grid>
      </Grid>


      {/* Let's Encrypt Configuration */}
      {certificate.provider === 'letsencrypt' && certificate.meta && (
        <>
          <Grid size={12}>
            <Divider />
          </Grid>
          
          <Grid size={12}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <CloudIcon color="primary" />
              <Typography variant="h6">Let&apos;s Encrypt Configuration</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                  Email
                </Typography>
                <Typography variant="body2">
                  {certificate.meta.letsencrypt_email || 'Not specified'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                  Challenge Type
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {certificate.meta.dns_challenge ? <DnsIcon fontSize="small" /> : null}
                  <Typography variant="body2">
                    {certificate.meta.dns_challenge ? 'DNS Challenge' : 'HTTP Challenge'}
                  </Typography>
                </Box>
              </Grid>

              {certificate.meta.dns_challenge && (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                      DNS Provider
                    </Typography>
                    <Typography variant="body2">
                      {certificate.meta.dns_provider || 'Not specified'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                      Propagation Seconds
                    </Typography>
                    <Typography variant="body2">
                      {certificate.meta.propagation_seconds || 'Default'}
                    </Typography>
                  </Grid>

                  {certificate.meta.dns_provider_credentials && (
                    <Grid size={12}>
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

              <Grid size={12}>
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