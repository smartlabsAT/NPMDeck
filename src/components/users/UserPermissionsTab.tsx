import {
  Box,
  Typography,
  Button,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from '@mui/material'
import {
  Edit as EditIcon,
  Public as PublicIcon,
  PersonOutline as UserOnlyIcon,
} from '@mui/icons-material'
import type { User } from '../../api/users'
import type { useDrawerForm } from '../../hooks/useDrawerForm'
import FormSection from '../shared/FormSection'
import TabPanel from '../shared/TabPanel'
import PermissionToggleRow from './PermissionToggleRow'
import { PERMISSION_PRESETS, FEATURE_PERMISSIONS } from './constants'
import type { UserFormData, PermissionLevel } from './types'

/**
 * Props for the UserPermissionsTab component
 */
interface UserPermissionsTabProps {
  /** Form helper from useDrawerForm */
  form: ReturnType<typeof useDrawerForm<UserFormData>>
  /** The user whose permissions are being edited */
  user: User
  /** Whether the user being edited is an admin */
  isAdminUser: boolean | undefined
  /** Currently active tab index */
  activeTab: number
  /** Currently selected permission preset name */
  selectedPreset: string
  /** Handler for preset selection changes */
  onPresetChange: (presetName: string) => void
  /** Handler for permissions save submission */
  onPermissionsSubmit: () => void
}

/**
 * UserPermissionsTab - Permissions management tab for existing users
 *
 * Renders the permission template selector, visibility scope toggle,
 * and feature permission rows using PermissionToggleRow.
 */
const UserPermissionsTab = ({
  form,
  user: _user,
  isAdminUser,
  activeTab,
  selectedPreset,
  onPresetChange,
  onPermissionsSubmit,
}: UserPermissionsTabProps) => {
  return (
    <TabPanel value={activeTab} index={2} keepMounted animation="none">
      {isAdminUser && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This user is an administrator and has full access to all features.
        </Alert>
      )}

      {!isAdminUser && (
        <FormSection title="Permission Templates">
          <FormControl fullWidth>
            <InputLabel>Permission Template</InputLabel>
            <Select
              value={selectedPreset}
              onChange={(e) => onPresetChange(e.target.value)}
              label="Permission Template"
            >
              <MenuItem value="custom">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}>
                  <EditIcon fontSize="small" />
                  <span>Custom Configuration</span>
                </Box>
              </MenuItem>
              {PERMISSION_PRESETS.map((preset) => (
                <MenuItem key={preset.name} value={preset.name}>
                  <Box>
                    <Typography variant="body2">{preset.name}</Typography>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      {preset.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FormSection>
      )}

      <FormSection title="Visibility Scope">
        <ToggleButtonGroup
          value={form.data.permissions.visibility}
          exclusive
          onChange={(_, value) => value && form.setFieldValue('permissions', { ...form.data.permissions, visibility: value })}
          disabled={!!isAdminUser}
          fullWidth
        >
          <ToggleButton value="all">
            <Box sx={{
              textAlign: "center"
            }}>
              <PublicIcon sx={{ mb: 0.5 }} />
              <Typography variant="caption" sx={{
                display: "block"
              }}>All Items</Typography>
            </Box>
          </ToggleButton>
          <ToggleButton value="user">
            <Box sx={{
              textAlign: "center"
            }}>
              <UserOnlyIcon sx={{ mb: 0.5 }} />
              <Typography variant="caption" sx={{
                display: "block"
              }}>Own Items Only</Typography>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </FormSection>

      <FormSection title="Feature Permissions">
        <Grid container spacing={2}>
          {FEATURE_PERMISSIONS.map(({ key, label, icon }) => (
            <PermissionToggleRow
              key={key}
              permissionKey={key}
              label={label}
              icon={icon}
              value={form.data.permissions[key as keyof typeof form.data.permissions] as PermissionLevel}
              onChange={(value) => form.setFieldValue('permissions', {
                ...form.data.permissions,
                [key]: value
              })}
              disabled={!!isAdminUser}
            />
          ))}
        </Grid>

        <Button
          fullWidth
          variant="contained"
          onClick={onPermissionsSubmit}
          disabled={form.loading || !!isAdminUser}
          sx={{ mt: 3 }}
        >
          Save Permissions
        </Button>
      </FormSection>
    </TabPanel>
  )
}

export default UserPermissionsTab
