import {
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Button,
} from '@mui/material'
import {
  Edit as EditIcon,
  Language as LanguageIcon,
  TrendingFlat as RedirectIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { RedirectionHost } from '../api/redirectionHosts'
import { getHttpStatusLabel } from '../utils/httpUtils'
import { getStatusColor, getStatusText } from '../utils/statusUtils'
import { getDaysUntilExpiry } from '../utils/dateUtils'
// import ExportDialog from './ExportDialog'
import AdaptiveContainer from './AdaptiveContainer'
import { NAVIGATION_COLORS } from '../constants/navigation'

interface RedirectionHostDetailsDialogProps {
  open: boolean
  onClose: () => void
  host: RedirectionHost | null
  onEdit: (host: RedirectionHost) => void
}

export default function RedirectionHostDetailsDialog({
  open,
  onClose,
  host,
  onEdit
}: RedirectionHostDetailsDialogProps) {
  // const [exportDialogOpen, setExportDialogOpen] = useState(false)

  if (!host) return null

  const getCertificateStatus = () => {
    if (!host.certificate?.expires_on) return null
    const days = getDaysUntilExpiry(host.certificate.expires_on)
    if (!days || days < 0) return { color: 'error' as const, text: 'Expired' }
    if (days <= 7) return { color: 'error' as const, text: `Expires in ${days} days` }
    if (days <= 30) return { color: 'warning' as const, text: `Expires in ${days} days` }
    return { color: 'success' as const, text: `Valid for ${days} days` }
  }

  return (
    <AdaptiveContainer
      open={open}
      onClose={onClose}
      entity="redirection_hosts"
      operation="view"
      title={
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <RedirectIcon sx={{ color: NAVIGATION_COLORS.warning }} />
            <Typography variant="h6">Redirection Host</Typography>
          </Box>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {host?.domain_names.join(', ') || 'Details'}
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
              Edit Redirection Host
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <Box sx={{ overflow: 'auto', p: 2 }}>
        {/* Overview Content */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2
              }}>
              <Chip
                icon={host.enabled ? <CheckCircleIcon /> : <CancelIcon />}
                label={getStatusText(host)}
                color={getStatusColor(host)}
              />
              {host.meta.nginx_err && (
                <Alert severity="error" sx={{ flexGrow: 1 }}>
                  {host.meta.nginx_err}
                </Alert>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2
                }}>
                <LanguageIcon color="primary" />
                <Typography variant="h6">Source Domains</Typography>
              </Box>
              <List dense>
                {host.domain_names.map((domain, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={domain} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2
                }}>
                <RedirectIcon color="primary" />
                <Typography variant="h6">Destination</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="URL"
                    secondary={`${host.forward_scheme}://${host.forward_domain_name}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="HTTP Status Code"
                    secondary={getHttpStatusLabel(host.forward_http_code)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Preserve Path"
                    secondary={host.preserve_path ? 'Yes' : 'No'}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2
                }}>
                <LockIcon color="primary" />
                <Typography variant="h6">SSL Configuration</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {host.certificate_id ? <LockIcon /> : <LockOpenIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary="SSL Certificate"
                    secondary={
                      host.certificate ? (
                        <Box>
                          <Typography variant="body2">
                            {host.certificate.nice_name}
                          </Typography>
                          {getCertificateStatus() && (
                            <Chip
                              size="small"
                              label={getCertificateStatus()!.text}
                              color={getCertificateStatus()!.color}
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : 'None'
                    }
                  />
                </ListItem>
                {host.certificate_id > 0 && (
                  <>
                    <ListItem>
                      <ListItemText
                        primary="Force SSL"
                        secondary={host.ssl_forced ? 'Yes' : 'No'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="HTTP/2 Support"
                        secondary={host.http2_support ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="HSTS"
                        secondary={
                          host.hsts_enabled
                            ? `Enabled${host.hsts_subdomains ? ' (including subdomains)' : ''}`
                            : 'Disabled'
                        }
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2
                }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Security</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ShieldIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Block Common Exploits"
                    secondary={host.block_exploits ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {host.advanced_config && (
            <Grid size={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2
                  }}>
                  <CodeIcon color="primary" />
                  <Typography variant="h6">Advanced Configuration</Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  {host.advanced_config}
                </Box>
              </Paper>
            </Grid>
          )}

          <Grid size={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2
                }}>
                <InfoIcon color="primary" />
                <Typography variant="h6">
                  Metadata
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(host.created_on).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    Modified
                  </Typography>
                  <Typography variant="body1">
                    {new Date(host.modified_on).toLocaleString()}
                  </Typography>
                </Grid>
                {host.owner && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{
                      color: "text.secondary"
                    }}>
                      Owner
                    </Typography>
                    <Typography variant="body1">
                      {host.owner.name || host.owner.email}
                    </Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {host.id}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      {/* Export Dialog */}
      {/* {host && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={[host]}
          type="redirection_host"
          itemName="Redirection Host"
        />
      )} */}
    </AdaptiveContainer>
  );
}