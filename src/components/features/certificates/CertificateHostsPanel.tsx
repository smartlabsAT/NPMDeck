import {
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
} from '@mui/material'
import {
  Language as LanguageIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { CertificateWithHosts, CertificateHostRelation } from '../../../types/common'

interface CertificateHostsPanelProps {
  certificate: CertificateWithHosts
  onNavigateToHost: (hostType: string, hostId: number) => void
}

const CertificateHostsPanel = ({
  certificate,
  onNavigateToHost,
}: CertificateHostsPanelProps) => {
  const totalHosts = 
    (certificate.proxy_hosts?.length || 0) +
    (certificate.redirection_hosts?.length || 0) +
    (certificate.dead_hosts?.length || 0)

  if (totalHosts === 0) {
    return (
      <Alert severity="info">
        This certificate is not currently used by any hosts.
      </Alert>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <LanguageIcon color="primary" />
        <Typography variant="h6">Host Usage Summary</Typography>
      </Box>
      
      <Grid container spacing={3}>
        {certificate.proxy_hosts && certificate.proxy_hosts.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Proxy Hosts ({certificate.proxy_hosts?.length || 0})
            </Typography>
            <List dense>
              {certificate.proxy_hosts?.map((host: CertificateHostRelation) => (
                <ListItem
                  key={host.id}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={() => onNavigateToHost('proxy', host.id)}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={host.domain_names.join(', ')}
                    secondary={`Forwards to: ${host.forward_scheme}://${host.forward_host}:${host.forward_port}`}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        )}
        
        {certificate.redirection_hosts && certificate.redirection_hosts.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Redirection Hosts ({certificate.redirection_hosts?.length || 0})
            </Typography>
            <List dense>
              {certificate.redirection_hosts?.map((host: CertificateHostRelation) => (
                <ListItem
                  key={host.id}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={() => onNavigateToHost('redirection', host.id)}
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
        
        {certificate.dead_hosts && certificate.dead_hosts.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              404 Hosts ({certificate.dead_hosts?.length || 0})
            </Typography>
            <List dense>
              {certificate.dead_hosts?.map((host: CertificateHostRelation) => (
                <ListItem
                  key={host.id}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={() => onNavigateToHost('404', host.id)}
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
    </Box>
  )
}

export default CertificateHostsPanel