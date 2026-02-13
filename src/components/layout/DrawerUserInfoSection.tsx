import React from 'react'
import {
  Box,
  Avatar,
  Divider,
  Typography,
} from '@mui/material'
import {
  ChevronRight,
} from '@mui/icons-material'

interface DrawerUserInfoSectionProps {
  userName: string
  userEmail: string
  isAdmin: boolean
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void
}

/**
 * Renders the user info box at the bottom of the drawer.
 * Displays avatar, name, email and a chevron indicating clickability.
 */
const DrawerUserInfoSection = ({ userName, userEmail, isAdmin, onMenuOpen }: DrawerUserInfoSectionProps) => {
  return (
    <Box sx={{ mt: 'auto' }}>
      <Divider sx={{ mb: 0 }} />
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          backgroundColor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.04)',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)',
          }
        }}
        onClick={onMenuOpen}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isAdmin ? 'primary.main' : 'secondary.main'
          }}
        >
          {userName.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {userName}
          </Typography>
          <Typography variant="caption" noWrap sx={{
            color: "text.secondary"
          }}>
            {userEmail}
          </Typography>
        </Box>
        <ChevronRight fontSize="small" color="action" />
      </Box>
    </Box>
  )
}

export default DrawerUserInfoSection