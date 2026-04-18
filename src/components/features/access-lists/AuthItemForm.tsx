import React from 'react'
import { TextField, Box, Paper } from '@mui/material'
import type { ArrayItemProps } from '../../shared/ArrayItemComponent'
import { AccessList } from '../../../api/accessLists'

export interface AuthItem {
  username: string
  password: string
}

// Extended props to pass accessList context for password field behaviour
export interface AuthItemFormProps extends ArrayItemProps<AuthItem> {
  accessList?: AccessList | null
}

const AuthItemForm = React.memo(({ value, onChange, accessList }: AuthItemFormProps) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      display: 'flex',
      gap: 2,
      alignItems: 'flex-start'
    }}
  >
    <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
      <TextField
        label="Username"
        value={value.username}
        onChange={(e) => {
          onChange({ ...value, username: e.target.value })
        }}
        error={false}
        helperText={undefined}
        fullWidth
        required
      />
      <TextField
        label="Password"
        type="password"
        value={value.password}
        onChange={(e) => {
          onChange({ ...value, password: e.target.value })
        }}
        error={false}
        helperText={undefined}
        fullWidth
        required={!accessList}
        placeholder={accessList ? 'Leave blank to keep current password' : 'Enter password'}
      />
    </Box>
  </Paper>
))

AuthItemForm.displayName = 'AuthItemForm'

export default AuthItemForm
