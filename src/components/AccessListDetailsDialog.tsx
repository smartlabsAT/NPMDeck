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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  NetworkCheck as NetworkIcon,
  VerifiedUser as AuthIcon,
  Security,
} from '@mui/icons-material'
import { AccessList } from '../api/accessLists'
// import ExportDialog from './ExportDialog'
import AdaptiveContainer from './AdaptiveContainer'

interface AccessListDetailsDialogProps {
  open: boolean
  onClose: () => void
  accessList: AccessList | null
  onEdit?: (accessList: AccessList) => void
}

const AccessListDetailsDialog = ({
  open,
  onClose,
  accessList,
  onEdit,
}: AccessListDetailsDialogProps) => {
  const [copiedText, setCopiedText] = useState<string>('')
  // const [exportDialogOpen, setExportDialogOpen] = useState(false)

  if (!accessList) return null

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label || text)
    setTimeout(() => setCopiedText(''), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const hasAuthUsers = accessList.items && accessList.items.length > 0
  const hasAccessRules = accessList.clients && accessList.clients.length > 0

  return (
    <>
      <AdaptiveContainer
        open={open}
        onClose={onClose}
        entity="access_lists"
        operation="view"
        title={
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Security sx={{ color: '#2bcbba' }} />
              <Typography variant="h6">Access List</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {accessList.name}
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
                  onEdit(accessList)
                }}
                startIcon={<EditIcon />}
                color="primary"
              >
                Edit Access List
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </>
        }
      >
          {/* Configuration Overview */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Satisfy Mode
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={accessList.satisfy_any ? 'Any' : 'All'}
                    color={accessList.satisfy_any ? 'primary' : 'secondary'}
                    size="small"
                  />
                  <Typography variant="body2">
                    {accessList.satisfy_any 
                      ? 'Access granted if ANY rule matches'
                      : 'Access granted if ALL rules match'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Pass Authentication
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {accessList.pass_auth ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <CancelIcon color="disabled" fontSize="small" />
                  )}
                  <Typography variant="body2">
                    {accessList.pass_auth ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Authorization Users */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              <Box display="flex" alignItems="center" gap={1}>
                <AuthIcon fontSize="small" />
                Authorization Users
              </Box>
            </Typography>
            {hasAuthUsers ? (
              <List dense>
                {accessList.items!.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.username}
                      secondary="Protected with password"
                    />
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(item.username, `User ${index + 1}`)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                    {copiedText === `User ${index + 1}` && (
                      <Typography variant="caption" color="success.main">
                        Copied!
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No authorization users configured
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Access Rules */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              <Box display="flex" alignItems="center" gap={1}>
                <NetworkIcon fontSize="small" />
                Access Rules
              </Box>
            </Typography>
            {hasAccessRules ? (
              <List dense>
                {accessList.clients!.map((client, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {client.directive === 'allow' ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={client.address}
                      secondary={client.directive === 'allow' ? 'Allowed' : 'Denied'}
                    />
                    <Chip
                      label={client.directive.toUpperCase()}
                      color={client.directive === 'allow' ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No access rules configured
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Summary */}
          {!hasAuthUsers && !hasAccessRules && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This access list has no authorization users or access rules configured. It will not restrict access.
            </Alert>
          )}

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
                  {formatDate(accessList.created_on)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Modified
                </Typography>
                <Typography variant="body2">
                  {formatDate(accessList.modified_on)}
                </Typography>
              </Grid>
              {accessList.owner && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Owner
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="body2">
                      {accessList.owner.name || accessList.owner.email}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
      </AdaptiveContainer>
      
      {/* Export Dialog */}
      {/* {accessList && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={[accessList]}
          type="access_list"
          itemName="Access List"
        />
      )} */}
    </>
  )
}

export default AccessListDetailsDialog