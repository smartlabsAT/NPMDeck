import React from 'react'
import {
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  Paper,
  Divider,
  Alert,
} from '@mui/material'
import {
  Lock as LockIcon,
  Security as SecurityIcon,
  Link as LinkIcon,
} from '@mui/icons-material'
import { ProxyHost } from '../../../api/proxyHosts'

interface ProxyHostSSLPanelProps {
  host: ProxyHost
  onNavigateToCertificate: () => void
  onNavigateToAccess: () => void
}

const ProxyHostSSLPanel: React.FC<ProxyHostSSLPanelProps> = ({
  host,
  onNavigateToCertificate,
  onNavigateToAccess,
}) => {
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
              onClick={onNavigateToAccess}
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

      {!host.certificate_id && !host.access_list_id && host.meta.nginx_online !== false && (
        <Grid item xs={12}>
          <Alert severity="info">
            No SSL certificate or access control configured for this proxy host.
          </Alert>
        </Grid>
      )}
    </Grid>
  )
}

export default ProxyHostSSLPanel