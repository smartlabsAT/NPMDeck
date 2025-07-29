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
  Language as LanguageIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Warning as WarningIcon,
  Block as BlockIcon,
  Speed as SpeedIcon,
  Wifi as WebSocketIcon,
  Https as HttpsIcon,
  Http as HttpIcon,
  SwapHoriz as SwapHorizIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { ProxyHost } from '../../../api/proxyHosts'

interface ProxyHostInfoPanelProps {
  host: ProxyHost
  expandedSections: Record<string, boolean>
  copiedText: string
  onToggleSection: (section: string) => void
  onCopyToClipboard: (text: string, label?: string) => void
  onNavigateToAccess: () => void
}

const ProxyHostInfoPanel: React.FC<ProxyHostInfoPanelProps> = ({
  host,
  expandedSections,
  copiedText,
  onToggleSection,
  onCopyToClipboard,
  onNavigateToAccess,
}) => {
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

  return (
    <Grid container spacing={3}>
      {/* Status Overview */}
      <Grid item xs={12}>
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
                  {host.access_list ? (
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      sx={{ 
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={onNavigateToAccess}
                    >
                      {host.access_list.name}
                    </Typography>
                  ) : (
                    <Typography variant="body2" fontWeight="medium">
                      Public
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

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
                onClick={() => onCopyToClipboard(host.id.toString(), 'Host ID')}
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
        <ListItemButton onClick={() => onToggleSection('domains')} sx={{ pl: 0, pr: 1 }}>
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
                    onClick={() => onCopyToClipboard(domain, domain)}
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
    </Grid>
  )
}

export default ProxyHostInfoPanel