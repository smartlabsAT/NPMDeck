import React from 'react'
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Typography,
  ListItemIcon,
  Chip,
} from '@mui/material'
import {
  Logout,
  AccountCircle,
} from '@mui/icons-material'
import type { User } from '../../api/users'
import type { TokenInfo } from '../../stores/authStore'

interface AppBarUserMenuProps {
  user: User
  tokenStack: TokenInfo[]
  anchorEl: HTMLElement | null
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void
  onMenuClose: () => void
  onLogout: () => void
  onSwitchAccount: () => Promise<void> | void
}

/**
 * Renders the user avatar button in the AppBar and its dropdown menu.
 * Includes token stack display for account switching and logout action.
 */
const AppBarUserMenu = ({
  user,
  tokenStack,
  anchorEl,
  onMenuOpen,
  onMenuClose,
  onLogout,
  onSwitchAccount,
}: AppBarUserMenuProps) => {
  return (
    <div>
      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={onMenuOpen}
        color="inherit"
      >
        <Box sx={{
          position: "relative"
        }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {user.name ? user.name[0].toUpperCase() : <AccountCircle />}
          </Avatar>
          {tokenStack.length > 0 && (
            <Chip
              label={tokenStack.length}
              size="small"
              color="secondary"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                height: 20,
                minWidth: 20,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            />
          )}
        </Box>
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={onMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="body2" color="textSecondary">
            {user.email}
          </Typography>
        </MenuItem>
        <Divider />
        {tokenStack.length > 0 && (
          <>
            <MenuItem disabled>
              <Typography variant="caption" color="textSecondary">
                Switch Account
              </Typography>
            </MenuItem>
            {tokenStack.map((tokenInfo) => (
              <MenuItem key={tokenInfo.user.email} onClick={() => {
                onMenuClose()
                onSwitchAccount()
              }}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body2">{tokenInfo.user.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {tokenInfo.user.email}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
          </>
        )}
        <MenuItem onClick={onLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </div>
  )
}

export default AppBarUserMenu