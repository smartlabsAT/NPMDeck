import React from 'react'
import {
  Typography,
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Alert,
  Paper,
  CircularProgress,
  Divider,
  ListItemIcon,
} from '@mui/material'
import {
  Edit as EditIcon,
  TrendingFlat as RedirectIcon,
} from '@mui/icons-material'
import { RedirectionHost } from '../../../api/redirectionHosts'

interface ProxyHostConnectionsPanelProps {
  linkedRedirections: RedirectionHost[]
  loadingConnections: boolean
  onNavigateToRedirection: (redirectionId: number) => void
  onEditRedirection: (redirectionId: number) => void
}

const ProxyHostConnectionsPanel = ({
  linkedRedirections,
  loadingConnections,
  onNavigateToRedirection,
  onEditRedirection,
}: ProxyHostConnectionsPanelProps) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3
        }}>
        <RedirectIcon color="primary" />
        <Typography variant="h6">Linked Redirections</Typography>
      </Box>
      {loadingConnections ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 4
          }}>
          <CircularProgress />
        </Box>
      ) : linkedRedirections.length === 0 ? (
        <Alert severity="info">
          No redirections are pointing to this proxy host.
        </Alert>
      ) : (
        <Paper variant="outlined">
          <List>
            {linkedRedirections.map((redirect, index) => (
              <React.Fragment key={redirect.id}>
                {index > 0 && <Divider />}
                <ListItemButton
                  onClick={() => onNavigateToRedirection(redirect.id)}
                >
                  <ListItemIcon>
                    <RedirectIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1
                        }}>
                        <Typography variant="body1">
                          {redirect.domain_names.join(', ')}
                        </Typography>
                        {redirect.enabled ? (
                          <Chip label="Active" size="small" color="success" />
                        ) : (
                          <Chip label="Disabled" size="small" color="default" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{
                          color: "text.secondary"
                        }}>
                          → {redirect.forward_scheme}://{redirect.forward_domain_name}
                        </Typography>
                        <Typography variant="caption" sx={{
                          color: "text.secondary"
                        }}>
                          HTTP {redirect.forward_http_code} • 
                          {redirect.preserve_path ? ' Preserves path' : ' Does not preserve path'}
                          {redirect.ssl_forced && ' • SSL Forced'}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton
                    edge="end"
                    aria-label="Edit redirection"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditRedirection(redirect.id)
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}

export default ProxyHostConnectionsPanel