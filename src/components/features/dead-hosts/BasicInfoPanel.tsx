import {
  Typography,
  Box,
  Grid,
  IconButton,
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  Person as PersonIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { DeadHost } from '../../../api/deadHosts'
import { formatDate } from '../../../utils/dateUtils'

interface BasicInfoPanelProps {
  host: DeadHost
  onCopyToClipboard: (text: string, label?: string) => void
}

/** Basic information section showing Host ID, response type, dates, and owner */
const BasicInfoPanel = ({ host, onCopyToClipboard }: BasicInfoPanelProps) => {
  return (
    <Grid size={12}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2
        }}>
        <InfoIcon color="primary" />
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
            Response
          </Typography>
          <Typography variant="body2">
            404 Not Found
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
  )
}

export default BasicInfoPanel