import {
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  Divider,
  Button,
} from '@mui/material'
import {
  Lock as LockIcon,
} from '@mui/icons-material'
import { DeadHost } from '../../../api/deadHosts'

interface SslCertificatePanelProps {
  host: DeadHost
  onNavigateToCertificate: () => void
}

/** SSL certificate details panel, rendered conditionally when certificate_id is present */
const SslCertificatePanel = ({ host, onNavigateToCertificate }: SslCertificatePanelProps) => {
  if (!host.certificate_id) return null

  return (
    <>
      <Grid size={12}>
        <Divider />
      </Grid>
      
      <Grid size={12}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2
          }}>
          <LockIcon color="primary" />
          <Typography variant="h6">SSL Certificate</Typography>
        </Box>
        
        {host.certificate && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    color: "text.secondary",
                    fontWeight: "bold"
                  }}>
                  Certificate Name
                </Typography>
                <Typography variant="body2">
                  {host.certificate.nice_name || host.certificate.domain_names.join(', ')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    color: "text.secondary",
                    fontWeight: "bold"
                  }}>
                  Provider
                </Typography>
                <Chip 
                  label={host.certificate.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom'} 
                  size="small" 
                  color={host.certificate.provider === 'letsencrypt' ? 'primary' : 'default'}
                />
              </Grid>
              <Grid size={12}>
                <Button
                  variant="text"
                  size="small"
                  onClick={onNavigateToCertificate}
                >
                  View Certificate Details
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Grid>
    </>
  )
}

export default SslCertificatePanel