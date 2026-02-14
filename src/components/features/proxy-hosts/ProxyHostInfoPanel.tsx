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
  Alert,
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
import { formatDate } from '../../../utils/dateUtils'

interface ProxyHostInfoPanelProps {
  host: ProxyHost
  expandedSections: Record<string, boolean>
  copiedText: string
  onToggleSection: (section: string) => void
  onCopyToClipboard: (text: string, label?: string) => void
  onNavigateToAccess: () => void
}

const ProxyHostInfoPanel = ({
  host,
  expandedSections,
  copiedText: _copiedText,
  onToggleSection,
  onCopyToClipboard,
  onNavigateToAccess,
}: ProxyHostInfoPanelProps) => {
  return (
    <Grid container spacing={3}>
      {/* Status Overview */}
      <Grid size={12}>
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}>
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
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: "bold"
                    }}>Status</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: "medium"
                  }}>
                    {!host.enabled ? 'Disabled' : host.meta.nginx_online === false ? 'Error' : 'Online'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}>
                {host.certificate_id ? <HttpsIcon color="primary" /> : <HttpIcon color="action" />}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: "bold"
                    }}>SSL</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: "medium"
                  }}>
                    {host.certificate_id ? (host.ssl_forced ? 'Forced' : 'Enabled') : 'Disabled'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}>
                <SecurityIcon color="action" />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: "bold"
                    }}>Access</Typography>
                  {host.access_list ? (
                    <Typography
                      variant="body2"
                      onClick={onNavigateToAccess}
                      sx={{
                        fontWeight: "medium",
                        cursor: 'pointer',
                        color: 'primary.main',

                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}>
                      {host.access_list.name}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{
                      fontWeight: "medium"
                    }}>
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
      <Grid size={12}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2
          }}>
          <SwapHorizIcon color="primary" />
          <Typography variant="h6">Basic Information</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                color: "text.secondary",
                fontWeight: "bold"
              }}>
              Host ID
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1
              }}>
              <Typography variant="body2" sx={{
                fontFamily: "monospace"
              }}>
                #{host.id}
              </Typography>
              <IconButton
                size="small"
                aria-label="Copy to clipboard"
                onClick={() => onCopyToClipboard(host.id.toString(), 'Host ID')}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                color: "text.secondary",
                fontWeight: "bold"
              }}>
              Forward Destination
            </Typography>
            <Typography variant="body2" sx={{
              fontFamily: "monospace"
            }}>
              {host.forward_scheme}://{host.forward_host}:{host.forward_port}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                color: "text.secondary",
                fontWeight: "bold"
              }}>
              Created
            </Typography>
            <Typography variant="body2">
              {formatDate(host.created_on)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                color: "text.secondary",
                fontWeight: "bold"
              }}>
              Last Modified
            </Typography>
            <Typography variant="body2">
              {formatDate(host.modified_on)}
            </Typography>
          </Grid>

          {host.owner_user_id && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold"
                }}>
                Owner
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5
                }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  User #{host.owner_user_id}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid size={12}>
        <Divider />
      </Grid>
      {/* Domain Names */}
      <Grid size={12}>
        <ListItemButton onClick={() => onToggleSection('domains')} sx={{ pl: 0, pr: 1 }}>
          <ListItemText 
            primary={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}>
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
                    aria-label="Copy to clipboard"
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
          <SettingsIcon color="primary" />
          <Typography variant="h6">Configuration</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1
              }}>
              <SpeedIcon fontSize="small" />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold"
                }}>
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

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1
              }}>
              <BlockIcon fontSize="small" />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold"
                }}>
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

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1
              }}>
              <WebSocketIcon fontSize="small" />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold"
                }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1
                }}>
                <SpeedIcon fontSize="small" />
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: "bold"
                  }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1
                }}>
                <SecurityIcon fontSize="small" />
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: "bold"
                  }}>
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
      {/* Nginx Error */}
      {host.meta.nginx_online === false && host.meta.nginx_err && (
        <>
          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <Alert severity="error">
              <Typography variant="subtitle2" gutterBottom sx={{
                fontWeight: "bold"
              }}>
                Nginx Configuration Error
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  whiteSpace: 'pre-wrap'
                }}>
                {host.meta.nginx_err}
              </Typography>
            </Alert>
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default ProxyHostInfoPanel