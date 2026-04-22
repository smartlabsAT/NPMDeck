import {
  Box,
  Typography,
  Button,
  Alert,
} from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import TabPanel from '../../components/shared/TabPanel'
import FormSection from '../../components/shared/FormSection'
import { EntityType, ContainerType, EntityPreference } from '../../types/uiSettings'
import { CoreResource } from '../../types/entityTypes'
import { useResponsive } from '../../hooks/useResponsive'
import ContainerPreferencesCards from './ContainerPreferencesCards'
import ContainerPreferencesTable from './ContainerPreferencesTable'
import DrawerSettingsPanel from './DrawerSettingsPanel'

interface UIPreferencesTabProps {
  activeTab: number
  containerPreferences: Record<string, EntityPreference>
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

  const containerProps = {
    containerPreferences,
    visibleResources,
    onSetContainerPreference,
    canManage,
  }

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
        {isMobile
          ? <ContainerPreferencesCards {...containerProps} />
          : <ContainerPreferencesTable {...containerProps} />
        }
      </FormSection>

      <DrawerSettingsPanel
        drawerPosition={drawerPosition}
        drawerWidth={drawerWidth}
        onSetDrawerPosition={onSetDrawerPosition}
        onSetDrawerWidth={onSetDrawerWidth}
      />

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
