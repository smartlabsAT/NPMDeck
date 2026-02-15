import {
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { DeadHost } from '../../../api/deadHosts'

interface ConfigurationPanelProps {
  host: DeadHost
}

/** Configuration section showing HTTP/2 and HSTS status chips */
const ConfigurationPanel = ({ host }: ConfigurationPanelProps) => {
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
          <SettingsIcon color="primary" />
          <Typography variant="h6">Configuration</Typography>
        </Box>
        
        <Grid container spacing={2}>
          {host.http2_support !== undefined && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1
                }}>
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
    </>
  )
}

export default ConfigurationPanel