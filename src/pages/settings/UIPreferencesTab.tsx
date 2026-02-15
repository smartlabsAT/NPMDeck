import React from 'react'
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material'
import {
  Code as CodeIcon,
  Refresh as RefreshIcon,
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectIcon,
  Block as DeadIcon,
  Stream as StreamIcon,
  VpnKey as CertificateIcon,
  Security as AccessListIcon,
  Group as UserIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import TabPanel from '../../components/shared/TabPanel'
import FormSection from '../../components/shared/FormSection'
import { NAVIGATION_COLORS } from '../../constants/navigation'
import { EntityType, ContainerType, ENTITY_DISPLAY_NAMES } from '../../types/uiSettings'
import { CoreResource } from '../../types/entityTypes'
import { useResponsive } from '../../hooks/useResponsive'

/** Resource icons mapping with navigation colors */
const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  proxy_hosts: <ProxyIcon sx={{ color: NAVIGATION_COLORS.success }} />,
  redirection_hosts: <RedirectIcon sx={{ color: NAVIGATION_COLORS.warning }} />,
  dead_hosts: <DeadIcon sx={{ color: NAVIGATION_COLORS.danger }} />,
  streams: <StreamIcon sx={{ color: NAVIGATION_COLORS.info }} />,
  access_lists: <AccessListIcon sx={{ color: NAVIGATION_COLORS.primary }} />,
  certificates: <CertificateIcon sx={{ color: NAVIGATION_COLORS.info }} />,
  users: <UserIcon sx={{ color: NAVIGATION_COLORS.secondary }} />,
}

interface ContainerPreference {
  view?: ContainerType
  edit?: ContainerType
  create?: ContainerType
}

interface UIPreferencesTabProps {
  activeTab: number
  containerPreferences: Record<string, ContainerPreference>
  drawerPosition: 'left' | 'right'
  drawerWidth: number
  visibleResources: CoreResource[]
  onSetContainerPreference: (entityKey: EntityType, action: 'view' | 'edit' | 'create', value: ContainerType) => void
  onSetDrawerPosition: (position: 'left' | 'right') => void
  onSetDrawerWidth: (width: number) => void
  onResetToDefaults: () => void
  canManage: (resource: CoreResource) => boolean
}

/**
 * UI Preferences tab content for the Settings page.
 * Displays container display preferences, drawer settings, and reset controls.
 */
const UIPreferencesTab = ({
  activeTab,
  containerPreferences,
  drawerPosition,
  drawerWidth,
  visibleResources,
  onSetContainerPreference,
  onSetDrawerPosition,
  onSetDrawerWidth,
  onResetToDefaults,
  canManage,
}: UIPreferencesTabProps) => {
  const { isMobile } = useResponsive()

  return (
    <TabPanel value={activeTab} index={1} padding={isMobile ? 2 : 3} animation="none">
      <FormSection title="Container Display Preferences" sx={{ mb: 4 }}>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 3
          }}>
          Choose whether to use drawers or dialogs for different operations
        </Typography>

{/* Mobile: Card layout */}
        {isMobile ? (
          <Stack spacing={2}>
            {visibleResources.map((resource) => {
              const entityKey = resource as EntityType
              const hasManagePermission = canManage(resource)

              return (
                <Card key={resource} variant="outlined">
                  <CardContent sx={{ pb: 2 }}>
                    {/* Resource Header */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                      pb: 1,
                      borderBottom: 1,
                      borderColor: 'divider'
                    }}>
                      {RESOURCE_ICONS[entityKey] ? (
                        React.cloneElement(RESOURCE_ICONS[entityKey] as React.ReactElement<Record<string, unknown>>, {
                          fontSize: 'small'
                        })
                      ) : (
                        <CodeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      )}
                      <Typography variant="subtitle1" sx={{
                        fontWeight: "medium"
                      }}>
                        {ENTITY_DISPLAY_NAMES[entityKey]}
                      </Typography>
                    </Box>

                    {/* View Details Setting */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <ViewIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.info }} />
                        <Typography variant="body2" sx={{
                          fontWeight: "medium"
                        }}>
                          View Details
                        </Typography>
                      </Box>
                      <ToggleButtonGroup
                        size="small"
                        value={containerPreferences[entityKey]?.view || 'dialog'}
                        exclusive
                        onChange={(_, value) => value && onSetContainerPreference(entityKey, 'view', value as ContainerType)}
                        fullWidth
                        sx={{ height: 36 }}
                      >
                        <ToggleButton value="dialog">
                          Dialog
                        </ToggleButton>
                        <ToggleButton value="drawer">
                          Drawer
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    {/* Edit Setting */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <EditIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.edit }} />
                        <Typography variant="body2" sx={{
                          fontWeight: "medium"
                        }}>
                          Edit
                        </Typography>
                      </Box>
                      {hasManagePermission ? (
                        <ToggleButtonGroup
                          size="small"
                          value={containerPreferences[entityKey]?.edit || 'drawer'}
                          exclusive
                          onChange={(_, value) => value && onSetContainerPreference(entityKey, 'edit', value as ContainerType)}
                          fullWidth
                          sx={{ height: 36 }}
                        >
                          <ToggleButton value="dialog">
                            Dialog
                          </ToggleButton>
                          <ToggleButton value="drawer">
                            Drawer
                          </ToggleButton>
                        </ToggleButtonGroup>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Chip label="No Permission" size="small" variant="outlined" />
                        </Box>
                      )}
                    </Box>

                    {/* Create New Setting */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <AddIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.success }} />
                        <Typography variant="body2" sx={{
                          fontWeight: "medium"
                        }}>
                          Create New
                        </Typography>
                      </Box>
                      {hasManagePermission ? (
                        <ToggleButtonGroup
                          size="small"
                          value={containerPreferences[entityKey]?.create || 'drawer'}
                          exclusive
                          onChange={(_, value) => value && onSetContainerPreference(entityKey, 'create', value as ContainerType)}
                          fullWidth
                          sx={{ height: 36 }}
                        >
                          <ToggleButton value="dialog">
                            Dialog
                          </ToggleButton>
                          <ToggleButton value="drawer">
                            Drawer
                          </ToggleButton>
                        </ToggleButtonGroup>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Chip label="No Permission" size="small" variant="outlined" />
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        ) : (
          /* Desktop: Table layout */
          (<TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5
                      }}>
                      <ViewIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.info }} />
                      View Details
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5
                      }}>
                      <EditIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.edit }} />
                      Edit
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5
                      }}>
                      <AddIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.success }} />
                      Create New
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleResources.map((resource) => {
                  const entityKey = resource as EntityType
                  const hasManagePermission = canManage(resource)

                  return (
                    <TableRow key={resource}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {RESOURCE_ICONS[entityKey] ? (
                            React.cloneElement(RESOURCE_ICONS[entityKey] as React.ReactElement<Record<string, unknown>>, {
                              fontSize: 'small'
                            })
                          ) : (
                            <CodeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          )}
                          {ENTITY_DISPLAY_NAMES[entityKey]}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <ToggleButtonGroup
                          size="small"
                          value={containerPreferences[entityKey]?.view || 'dialog'}
                          exclusive
                          onChange={(_, value) => value && onSetContainerPreference(entityKey, 'view', value as ContainerType)}
                          sx={{ height: 32 }}
                        >
                          <ToggleButton value="dialog" sx={{ px: 2 }}>
                            Dialog
                          </ToggleButton>
                          <ToggleButton value="drawer" sx={{ px: 2 }}>
                            Drawer
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </TableCell>
                      <TableCell align="center">
                        {hasManagePermission ? (
                          <ToggleButtonGroup
                            size="small"
                            value={containerPreferences[entityKey]?.edit || 'drawer'}
                            exclusive
                            onChange={(_, value) => value && onSetContainerPreference(entityKey, 'edit', value as ContainerType)}
                            sx={{ height: 32 }}
                          >
                            <ToggleButton value="dialog" sx={{ px: 2 }}>
                              Dialog
                            </ToggleButton>
                            <ToggleButton value="drawer" sx={{ px: 2 }}>
                              Drawer
                            </ToggleButton>
                          </ToggleButtonGroup>
                        ) : (
                          <Chip label="No Permission" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {hasManagePermission ? (
                          <ToggleButtonGroup
                            size="small"
                            value={containerPreferences[entityKey]?.create || 'drawer'}
                            exclusive
                            onChange={(_, value) => value && onSetContainerPreference(entityKey, 'create', value as ContainerType)}
                            sx={{ height: 32 }}
                          >
                            <ToggleButton value="dialog" sx={{ px: 2 }}>
                              Dialog
                            </ToggleButton>
                            <ToggleButton value="drawer" sx={{ px: 2 }}>
                              Drawer
                            </ToggleButton>
                          </ToggleButtonGroup>
                        ) : (
                          <Chip label="No Permission" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>)
        )}
      </FormSection>

      <FormSection title="Drawer Settings">
        <Stack spacing={isMobile ? 3 : 4}>
          {/* Drawer Position */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Drawer Position
            </Typography>
            <ToggleButtonGroup
              value={drawerPosition}
              exclusive
              onChange={(_, value) => value && onSetDrawerPosition(value)}
              fullWidth
              sx={{
                ...(isMobile && {
                  '& .MuiToggleButton-root': {
                    flexDirection: 'column',
                    gap: 0.5,
                    py: 1.5
                  }
                })
              }}
            >
              <ToggleButton value="left">
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 0.5 : 1,
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <LeftIcon />
                  <Typography variant={isMobile ? "caption" : "body2"}>Left Side</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="right">
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 0.5 : 1,
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <Typography variant={isMobile ? "caption" : "body2"}>Right Side</Typography>
                  <RightIcon />
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Drawer Width */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Drawer Width: {drawerWidth}px
            </Typography>
            <Slider
              value={drawerWidth}
              onChange={(_, value) => onSetDrawerWidth(value as number)}
              min={400}
              max={1200}
              step={50}
              marks={[
                { value: 400, label: isMobile ? '' : 'Compact' },
                { value: 600, label: isMobile ? '' : 'Default' },
                { value: 800, label: isMobile ? '' : 'Wide' },
                { value: 1000, label: isMobile ? '' : 'Extra Wide' },
                { value: 1200, label: isMobile ? '' : 'Maximum' },
              ]}
              sx={{
                mt: 2,
                mb: 1,
                ...(isMobile && {
                  '& .MuiSlider-markLabel': {
                    fontSize: '0.75rem'
                  }
                })
              }}
            />
            {isMobile && (
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 1,
                px: 1
              }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  Compact
                </Typography>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  Default
                </Typography>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  Wide
                </Typography>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  Extra
                </Typography>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  Max
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </FormSection>

      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Note:</strong> On mobile devices, all forms will display as full-screen dialogs for optimal usability.
          UI preferences are saved automatically as you make changes.
        </Typography>
      </Alert>

      <Box sx={{
        mt: 4,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: isMobile ? 'center' : 'space-between',
        alignItems: 'center',
        gap: isMobile ? 2 : 0
      }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onResetToDefaults}
          fullWidth={isMobile}
        >
          Reset to Defaults
        </Button>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            textAlign: isMobile ? 'center' : 'right'
          }}>
          Changes are saved automatically
        </Typography>
      </Box>
    </TabPanel>
  )
}

export default UIPreferencesTab
