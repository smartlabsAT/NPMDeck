import {
  Typography,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Button,
  Paper,
  CircularProgress,
  ListItemIcon,
  Alert,
} from '@mui/material'
import {
  Security as SecurityIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  NetworkCheck as NetworkCheckIcon,
  Link as LinkIcon,
} from '@mui/icons-material'
import { ProxyHost } from '../../../api/proxyHosts'
import { AccessList } from '../../../api/accessLists'

interface ProxyHostAccessPanelProps {
  host: ProxyHost
  fullAccessList: AccessList | null
  loadingAccessList: boolean
  error?: string | null
  onNavigateToFullAccessList: () => void
}

const ProxyHostAccessPanel = ({
  host,
  fullAccessList,
  loadingAccessList,
  error,
  onNavigateToFullAccessList,
}: ProxyHostAccessPanelProps) => {
  if (!host.access_list) {
    return null
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (loadingAccessList) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 4
        }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading access list details...</Typography>
      </Box>
    );
  }

  const accessList = fullAccessList || host.access_list

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3
        }}>
        <SecurityIcon color="primary" />
        <Typography variant="h6">{accessList.name}</Typography>
      </Box>
      {/* Access List Information */}
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid size={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{
              fontWeight: "bold"
            }}>
              Access List Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>ID</Typography>
                <Typography variant="body2">#{accessList.id}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>Created</Typography>
                <Typography variant="body2">
                  {new Date(accessList.created_on).toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>Modified</Typography>
                <Typography variant="body2">
                  {new Date(accessList.modified_on).toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>Owner</Typography>
                <Typography variant="body2">
                  {accessList?.owner ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5
                      }}>
                      <PersonIcon fontSize="small" />
                      {accessList?.owner?.name || accessList?.owner?.email || `User #${accessList?.owner_user_id}`}
                    </Box>
                  ) : (
                    `User #${accessList?.owner_user_id}`
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Configuration */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{
              fontWeight: "bold"
            }}>
              Configuration
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}>
              <Box>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>Satisfy Mode</Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5
                  }}>
                  <Chip 
                    label={accessList.satisfy_any ? 'Any' : 'All'} 
                    size="small" 
                    color={accessList.satisfy_any ? 'primary' : 'secondary'}
                  />
                  <Typography variant="body2">
                    {accessList.satisfy_any 
                      ? 'Access granted if ANY rule matches'
                      : 'Access granted if ALL rules match'}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>Pass Authentication to Host</Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5
                  }}>
                  {accessList.pass_auth ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <CancelIcon color="disabled" fontSize="small" />
                  )}
                  <Typography variant="body2">
                    {accessList.pass_auth 
                      ? 'Authorization headers are forwarded to the proxied host'
                      : 'Authorization headers are not forwarded'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{
              fontWeight: "bold"
            }}>
              Summary
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1
              }}>
              {accessList?.items && (accessList?.items?.length ?? 0) > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {accessList?.items?.length} authorized user{accessList?.items?.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
              {accessList?.clients && (accessList?.clients?.length ?? 0) > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}>
                  <NetworkCheckIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {accessList?.clients?.length} IP rule{accessList?.clients?.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
              {(!accessList?.items || accessList?.items?.length === 0) && 
               (!accessList?.clients || accessList?.clients?.length === 0) && (
                <Typography variant="body2" sx={{
                  color: "text.secondary"
                }}>
                  No rules configured
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Authorization Users */}
        {host.access_list.items && host.access_list.items.length > 0 && (
          <Grid size={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2
                }}>
                <PersonIcon color="action" />
                <Typography variant="subtitle2" sx={{
                  fontWeight: "bold"
                }}>
                  Authorization - HTTP Basic Auth ({host.access_list.items.length} users)
                </Typography>
              </Box>
              <List>
                {accessList.items?.map((item, index) => (
                  <ListItem key={item.id || index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                          }}>
                          <Typography variant="body1" sx={{
                            fontWeight: "medium"
                          }}>
                            {item.username}
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            (ID: #{item.id})
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{
                            color: "text.secondary"
                          }}>
                            Protected with password • Password: ••••••••
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            Created: {new Date(item.created_on).toLocaleString()}
                          </Typography>
                          {item.modified_on !== item.created_on && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                ml: 2
                              }}>
                              Modified: {new Date(item.modified_on).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Access Rules */}
        {host.access_list.clients && host.access_list.clients.length > 0 && (
          <Grid size={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2
                }}>
                <NetworkCheckIcon color="action" />
                <Typography variant="subtitle2" sx={{
                  fontWeight: "bold"
                }}>
                  Access Control - IP Based Rules ({host.access_list.clients.length} rules)
                </Typography>
              </Box>
              <List>
                {accessList.clients?.map((client, index) => (
                  <ListItem key={client.id || index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ListItemIcon>
                      {client.directive === 'allow' ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                          }}>
                          <Typography variant="body1" sx={{
                            fontFamily: "monospace"
                          }}>
                            {client.address}
                          </Typography>
                          <Chip 
                            label={client.directive.toUpperCase()} 
                            size="small" 
                            color={client.directive === 'allow' ? 'success' : 'error'}
                            variant="outlined"
                          />
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            (ID: #{client.id})
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{
                            color: "text.secondary"
                          }}>
                            {client.directive === 'allow' ? 'Access allowed from this address' : 'Access denied from this address'}
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            Created: {new Date(client.created_on).toLocaleString()}
                          </Typography>
                          {client.modified_on !== client.created_on && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                ml: 2
                              }}>
                              Modified: {new Date(client.modified_on).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Meta Information */}
        {accessList.meta && Object.keys(accessList.meta).length > 0 && (
          <Grid size={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{
                fontWeight: "bold"
              }}>
                Additional Metadata
              </Typography>
              <Box sx={{ mt: 1 }}>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.875rem',
                  backgroundColor: 'background.paper',
                  padding: '8px',
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(accessList.meta, null, 2)}
                </pre>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Link to full Access List */}
        <Grid size={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center"
            }}>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={onNavigateToFullAccessList}
            >
              View Full Access List Details
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProxyHostAccessPanel