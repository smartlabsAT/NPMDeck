import {
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  Paper,
  Alert,
} from '@mui/material'
import {
  Lock as LockIcon,
} from '@mui/icons-material'
import { ProxyHost } from '../../../api/proxyHosts'

interface ProxyHostSSLPanelProps {
  host: ProxyHost
  onNavigateToCertificate: () => void
}

const ProxyHostSSLPanel = ({
  host,
  onNavigateToCertificate,
}: ProxyHostSSLPanelProps) => {
  return (
    <Grid container spacing={3}>
      {/* SSL Certificate Info */}
      {host.certificate_id && (
        <>
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
      )}

      {!host.certificate_id && (
        <Grid item xs={12}>
          <Alert severity="info">
            No SSL certificate configured for this proxy host.
          </Alert>
        </Grid>
      )}
    </Grid>
  )
}

export default ProxyHostSSLPanel