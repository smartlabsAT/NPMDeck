import { useState } from 'react'
import {
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  Alert,
} from '@mui/material'
import {
  
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ContentCopy as CopyIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Stream as StreamIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  
} from '@mui/icons-material'
import { Stream } from '../api/streams'
// import ExportDialog from './ExportDialog'
import AdaptiveContainer from './AdaptiveContainer'

interface StreamDetailsDialogProps {
  open: boolean
  onClose: () => void
  stream: Stream | null
  onEdit?: (stream: Stream) => void
}

const StreamDetailsDialog: React.FC<StreamDetailsDialogProps> = ({
  open,
  onClose,
  stream,
  onEdit,
}) => {
  const [copiedText, setCopiedText] = useState<string>('')
  // const [exportDialogOpen, setExportDialogOpen] = useState(false)

  if (!stream) return null

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label || text)
    setTimeout(() => setCopiedText(''), 2000)
  }

  const getStatusIcon = () => {
    if (!stream.enabled) {
      return <CancelIcon color="disabled" />
    }
    if (stream.meta.nginx_online === false) {
      return <ErrorIcon color="error" />
    }
    return <CheckIcon color="success" />
  }

  const getStatusText = () => {
    if (!stream.enabled) return 'Disabled'
    if (stream.meta.nginx_online === false) return 'Offline'
    return 'Online'
  }

  const getStatusColor = () => {
    if (!stream.enabled) return 'default'
    if (stream.meta.nginx_online === false) return 'error'
    return 'success'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <>
      <AdaptiveContainer
        open={open}
        onClose={onClose}
        entity="streams"
        operation="view"
        title={
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <StreamIcon sx={{ color: '#467fcf' }} />
              <Typography variant="h6">Stream</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Port {stream.incoming_port}
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
                  onEdit(stream)
                }}
                startIcon={<EditIcon />}
                color="primary"
                variant="contained"
              >
                Edit Stream
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </>
        }
      >
          {/* Status Alert */}
          <Alert 
            severity={getStatusColor() as any}
            icon={getStatusIcon()}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="body2">
                Status: <strong>{getStatusText()}</strong>
              </Typography>
              {stream.meta.nginx_err && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Error: {stream.meta.nginx_err}
                </Typography>
              )}
            </Box>
          </Alert>

          {/* Stream Configuration */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Stream Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Incoming Port
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1">
                    {stream.incoming_port}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(stream.incoming_port.toString(), 'Port')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                  {copiedText === 'Port' && (
                    <Typography variant="caption" color="success.main">
                      Copied!
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Forwarding To
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1">
                    {stream.forwarding_host}:{stream.forwarding_port}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(`${stream.forwarding_host}:${stream.forwarding_port}`, 'Destination')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                  {copiedText === 'Destination' && (
                    <Typography variant="caption" color="success.main">
                      Copied!
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Protocol Configuration */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Protocol Configuration
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {stream.tcp_forwarding && (
                <Chip
                  label="TCP Forwarding"
                  color="primary"
                  size="small"
                />
              )}
              {stream.udp_forwarding && (
                <Chip
                  label="UDP Forwarding"
                  color="primary"
                  size="small"
                />
              )}
              {!stream.tcp_forwarding && !stream.udp_forwarding && (
                <Typography variant="body2" color="error">
                  No protocols enabled
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* SSL Certificate */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              SSL Certificate
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {stream.certificate_id ? (
                <>
                  <LockIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    SSL certificate configured
                  </Typography>
                </>
              ) : (
                <>
                  <LockOpenIcon color="action" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    No SSL certificate
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Metadata */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(stream.created_on)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Modified
                </Typography>
                <Typography variant="body2">
                  {formatDate(stream.modified_on)}
                </Typography>
              </Grid>
              {stream.owner && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Owner
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="body2">
                      {stream.owner.name || stream.owner.email}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
      </AdaptiveContainer>
      
      {/* Export Dialog */}
      {/* {stream && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={[stream]}
          type="stream"
          itemName="Stream"
        />
      )} */}
    </>
  )
}

export default StreamDetailsDialog