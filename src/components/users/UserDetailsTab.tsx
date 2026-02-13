import {
  TextField,
  Switch,
  FormControlLabel,
  Typography,
} from '@mui/material'
import type { User } from '../../api/users'
import type { useDrawerForm } from '../../hooks/useDrawerForm'
import FormSection from '../shared/FormSection'
import TabPanel from '../shared/TabPanel'
import { VALIDATION } from '../../constants/validation'
import type { UserFormData } from './types'

/**
 * Props for the UserDetailsTab component
 */
interface UserDetailsTabProps {
  /** Form helper from useDrawerForm */
  form: ReturnType<typeof useDrawerForm<UserFormData>>
  /** Whether editing an existing user */
  isEditMode: boolean
  /** The user being edited (null for new user) */
  user: User | null
  /** Whether the current logged-in user is an admin */
  isCurrentUserAdmin: boolean | undefined
  /** Currently active tab index */
  activeTab: number
}

/**
 * UserDetailsTab - First tab content for the user drawer
 *
 * Contains user details form fields (name, nickname, email, disabled/admin toggles)
 * and password fields for new users.
 */
const UserDetailsTab = ({
  form,
  isEditMode,
  user,
  isCurrentUserAdmin,
  activeTab,
}: UserDetailsTabProps) => {
  return (
    <TabPanel value={activeTab} index={0} keepMounted animation="none">
      <FormSection title="User Details">
        <TextField
          {...form.getFieldProps('name')}
          fullWidth
          label="Full Name"
          margin="normal"
          required
          error={!!form.errors.name}
          helperText={form.errors.name || "The user's full name"}
        />

        <TextField
          {...form.getFieldProps('nickname')}
          fullWidth
          label="Nickname"
          margin="normal"
          error={!!form.errors.nickname}
          helperText={form.errors.nickname || "A short display name"}
        />

        <TextField
          {...form.getFieldProps('email')}
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          required
          disabled={user?.email === 'admin@example.com'}
          error={!!form.errors.email}
          helperText={form.errors.email || "Used for login and notifications"}
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.data.is_disabled}
              onChange={(e) => form.setFieldValue('is_disabled', e.target.checked)}
            />
          }
          label="Disabled"
          sx={{ mt: 2, mb: 1 }}
        />
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            display: "block",
            mb: 2
          }}>
          Disabled users cannot login
        </Typography>

        {isCurrentUserAdmin && (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={form.data.is_admin}
                  onChange={(e) => form.setFieldValue('is_admin', e.target.checked)}
                  disabled={user?.email === 'admin@example.com'}
                />
              }
              label="Administrator"
              sx={{ mb: 1 }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "block",
                mb: 3
              }}>
              Administrators have full access to all features
            </Typography>
          </>
        )}
      </FormSection>

      {!isEditMode && (
        <FormSection title="Password">
          <TextField
            {...form.getFieldProps('new_password')}
            fullWidth
            type="password"
            label="Password"
            margin="normal"
            required
            error={!!form.errors.new_password}
            helperText={form.errors.new_password || `Minimum ${VALIDATION.MIN_PASSWORD_LENGTH} characters`}
          />

          <TextField
            {...form.getFieldProps('confirm_password')}
            fullWidth
            type="password"
            label="Confirm Password"
            margin="normal"
            required
            error={!!form.errors.confirm_password}
            helperText={form.errors.confirm_password}
          />
        </FormSection>
      )}
    </TabPanel>
  )
}

export default UserDetailsTab
