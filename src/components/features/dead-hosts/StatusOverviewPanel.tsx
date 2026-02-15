import {
  Typography,
  Box,
  Grid,
  Paper,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Https as HttpsIcon,
  Http as HttpIcon,
} from '@mui/icons-material'
import { DeadHost } from '../../../api/deadHosts'

interface StatusOverviewPanelProps {
  host: DeadHost
}

/** Status overview grid showing enabled state, SSL status, and entity type */
const StatusOverviewPanel = ({ host }: StatusOverviewPanelProps) => {
  return (
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
            <BlockIcon color="action" />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold"
                }}>Type</Typography>
              <Typography variant="body2" sx={{
                fontWeight: "medium"
              }}>
                404 Host
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default StatusOverviewPanel