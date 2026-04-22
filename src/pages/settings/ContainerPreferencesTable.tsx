import React from 'react'
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  Code as CodeIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { NAVIGATION_COLORS } from '../../constants/navigation'
import { EntityType, ContainerType, ENTITY_DISPLAY_NAMES } from '../../types/uiSettings'
import { RESOURCE_ICONS } from './resourceIcons'
import type { ContainerPreferencesProps } from './containerPreferencesTypes'

/**
 * Desktop table layout for container display preferences.
 */
const ContainerPreferencesTable = ({
  containerPreferences,
  visibleResources,
  onSetContainerPreference,
  canManage,
}: ContainerPreferencesProps) => {
  return (
    <TableContainer component={Paper} variant="outlined">
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
    </TableContainer>
  )
}

export default ContainerPreferencesTable
