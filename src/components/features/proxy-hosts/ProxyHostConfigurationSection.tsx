import {
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  Alert,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Block as BlockIcon,
  Speed as SpeedIcon,
  Wifi as WebSocketIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { ProxyHost } from '../../../api/proxyHosts'

interface ProxyHostConfigurationSectionProps {
  host: ProxyHost
}

const ProxyHostConfigurationSection = ({ host }: ProxyHostConfigurationSectionProps) => (
  <>
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

    {/* Nginx Error */}
    {host.meta.nginx_online === false && host.meta.nginx_err && (
      <>
        <Divider sx={{ mt: 3, mb: 3 }} />
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
      </>
    )}
  </>
)

export default ProxyHostConfigurationSection
