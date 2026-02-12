import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material'
import { Security as SecurityIcon } from '@mui/icons-material'
import { usersApi, User } from '../api/users'
import { getErrorMessage } from '../types/common'

interface UserPermissionsDialogProps {
  open: boolean
  onClose: () => void
  user: User | null
  onSave: () => void
}

type PermissionLevel = 'hidden' | 'view' | 'manage'
type VisibilityLevel = 'all' | 'user'

interface Permissions {
  visibility: VisibilityLevel
  proxy_hosts: PermissionLevel
  redirection_hosts: PermissionLevel
  dead_hosts: PermissionLevel
  streams: PermissionLevel
  access_lists: PermissionLevel
  certificates: PermissionLevel
}

const defaultPermissions: Permissions = {
  visibility: 'all',
  proxy_hosts: 'manage',
  redirection_hosts: 'manage',
  dead_hosts: 'manage',
  streams: 'manage',
  access_lists: 'manage',
  certificates: 'manage',
}

const UserPermissionsDialog = ({ open, onClose, user, onSave }: UserPermissionsDialogProps) => {
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.permissions) {
      setPermissions({
        visibility: user.permissions.visibility || 'all',
        proxy_hosts: user.permissions.proxy_hosts || 'manage',
        redirection_hosts: user.permissions.redirection_hosts || 'manage',
        dead_hosts: user.permissions.dead_hosts || 'manage',
        streams: user.permissions.streams || 'manage',
        access_lists: user.permissions.access_lists || 'manage',
        certificates: user.permissions.certificates || 'manage',
      })
    } else {
      setPermissions(defaultPermissions)
    }
    setError(null)
  }, [user])

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await usersApi.updatePermissions(user.id, permissions)
      onSave()
      handleClose()
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (key: keyof Permissions, value: string) => {
    setPermissions({
      ...permissions,
      [key]: value,
    })
  }

  if (!user) return null

  const isAdmin = user.roles?.includes('admin')

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1
          }}>
          <SecurityIcon sx={{ color: '#868e96' }} />
          Edit Permissions
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" gutterBottom sx={{
            color: "text.secondary"
          }}>
            Setting permissions for: <strong>{user.name}</strong>
          </Typography>

          {isAdmin && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This user is an administrator and has full access to all features.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend">Visibility</FormLabel>
            <RadioGroup
              value={permissions.visibility}
              onChange={(e) => handlePermissionChange('visibility', e.target.value)}
            >
              <FormControlLabel 
                value="all" 
                control={<Radio />} 
                label="All - Can view all items created by any user" 
                disabled={isAdmin}
              />
              <FormControlLabel 
                value="user" 
                control={<Radio />} 
                label="User - Can only view items created by themselves" 
                disabled={isAdmin}
              />
            </RadioGroup>
          </FormControl>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Feature Permissions
          </Typography>

          {[
            { key: 'proxy_hosts', label: 'Proxy Hosts' },
            { key: 'redirection_hosts', label: 'Redirection Hosts' },
            { key: 'dead_hosts', label: '404 Hosts' },
            { key: 'streams', label: 'Streams' },
            { key: 'access_lists', label: 'Access Lists' },
            { key: 'certificates', label: 'SSL Certificates' },
          ].map(({ key, label }) => (
            <FormControl key={key} component="fieldset" sx={{ mb: 2, width: '100%' }}>
              <FormLabel component="legend">{label}</FormLabel>
              <RadioGroup
                row
                value={permissions[key as keyof Permissions]}
                onChange={(e) => handlePermissionChange(key as keyof Permissions, e.target.value)}
              >
                <FormControlLabel value="hidden" control={<Radio />} label="Hidden" disabled={isAdmin} />
                <FormControlLabel value="view" control={<Radio />} label="View" disabled={isAdmin} />
                <FormControlLabel value="manage" control={<Radio />} label="Manage" disabled={isAdmin} />
              </RadioGroup>
            </FormControl>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || isAdmin}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Permissions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserPermissionsDialog