import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  Typography,
  Divider,
} from '@mui/material'
import { useAuthStore } from '../stores/authStore'
import api from '../api/config'

interface UserProfileModalProps {
  open: boolean
  onClose: () => void
  user: {
    id: number
    email: string
    name: string
  }
}

export default function UserProfileModal({ open, onClose, user }: UserProfileModalProps) {
  const { setUser } = useAuthStore()
  const [formData, setFormData] = useState({
    email: user.email,
    name: user.name,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Update user details if changed
      if (formData.email !== user.email || formData.name !== user.name) {
        const userResponse = await api.put(`/users/${user.id}`, {
          email: formData.email,
          name: formData.name,
        })
        setUser(userResponse.data)
      }

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match')
          setLoading(false)
          return
        }

        await api.put(`/users/${user.id}/auth`, {
          type: 'password',
          current: formData.currentPassword,
          secret: formData.newPassword,
        })
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to update profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const isDefaultAdmin = user.email === 'admin@example.com'

  return (
    <Dialog open={open} onClose={!isDefaultAdmin ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isDefaultAdmin ? 'Update Default Admin Profile' : 'Update Profile'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {isDefaultAdmin && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Please update your default admin credentials for security
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            margin="normal"
            required
            error={isDefaultAdmin && formData.email === 'admin@example.com'}
            helperText={
              isDefaultAdmin && formData.email === 'admin@example.com'
                ? 'Please change from default email'
                : ''
            }
          />

          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            margin="normal"
            required
          />

          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom>
            Change Password (Optional)
          </Typography>

          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => handleChange('currentPassword', e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) => handleChange('newPassword', e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            margin="normal"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Profile updated successfully!
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {!isDefaultAdmin && (
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || (isDefaultAdmin && formData.email === 'admin@example.com')}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}