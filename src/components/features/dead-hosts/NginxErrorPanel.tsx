import {
  Typography,
  Grid,
  Alert,
  Divider,
} from '@mui/material'
import { DeadHost } from '../../../api/deadHosts'

interface NginxErrorPanelProps {
  host: DeadHost
}

/** Nginx error alert panel, rendered conditionally when nginx configuration has errors */
const NginxErrorPanel = ({ host }: NginxErrorPanelProps) => {
  if (host.meta.nginx_online !== false || !host.meta.nginx_err) return null

  return (
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
  )
}

export default NginxErrorPanel