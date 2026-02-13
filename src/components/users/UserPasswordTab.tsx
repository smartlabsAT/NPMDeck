import {
  TextField,
  Typography,
  Button,
} from '@mui/material'
import type { User } from '../../api/users'
import type { useDrawerForm } from '../../hooks/useDrawerForm'
import FormSection from '../shared/FormSection'
import TabPanel from '../shared/TabPanel'
import { VALIDATION } from '../../constants/validation'
import type { UserFormData } from './types'

/**
 * Props for the UserPasswordTab component
 */
interface UserPasswordTabProps {
  /** Form helper from useDrawerForm */
  form: ReturnType<typeof useDrawerForm<UserFormData>>
  /** The user whose password is being changed */
  user: User
  /** Whether the current user is changing their own password */
  isChangingOwnPassword: boolean
  /** Currently active tab index */
  activeTab: number
  /** Handler for password change submission */
  onPasswordSubmit: () => void
}

/**
 * UserPasswordTab - Password change tab for existing users
 *
 * Renders form fields for changing a user's password, including
 * the current password field when the user is changing their own password.
 */
const UserPasswordTab = ({
  form,
  user,
  isChangingOwnPassword,
  activeTab,
  onPasswordSubmit,
}: UserPasswordTabProps) => {
  return (
    <TabPanel value={activeTab} index={1} keepMounted animation="none">
      <FormSection title="Change Password">
        <Typography variant="body2" gutterBottom sx={{
          color: "text.secondary"
        }}>
          Changing password for: <strong>{user.name}</strong>
        </Typography>

        {isChangingOwnPassword && (
          <TextField
            {...form.getFieldProps('current_password')}
            fullWidth
            type="password"
            label="Current Password"
            margin="normal"
            required
            error={!!form.errors.current_password}
            helperText={form.errors.current_password}
          />
        )}

        <TextField
          {...form.getFieldProps('new_password')}
          fullWidth
          type="password"
          label="New Password"
          margin="normal"
          required
          error={!!form.errors.new_password}
          helperText={form.errors.new_password || `Minimum ${VALIDATION.MIN_PASSWORD_LENGTH} characters`}
        />

        <TextField
          {...form.getFieldProps('confirm_password')}
          fullWidth
          type="password"
          label="Confirm New Password"
          margin="normal"
          required
          error={!!form.errors.confirm_password}
          helperText={form.errors.confirm_password}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={onPasswordSubmit}
          disabled={form.loading || !form.data.new_password || !form.data.confirm_password || (isChangingOwnPassword && !form.data.current_password)}
          sx={{ mt: 2 }}
        >
          Change Password
        </Button>
      </FormSection>
    </TabPanel>
  )
}

export default UserPasswordTab
