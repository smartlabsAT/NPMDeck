import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
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
 * Mobile card layout for container display preferences.
 */
const ContainerPreferencesCards = ({
  containerPreferences,
  visibleResources,
  onSetContainerPreference,
  canManage,
}: ContainerPreferencesProps) => {
  return (
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
  )
}

export default ContainerPreferencesCards
