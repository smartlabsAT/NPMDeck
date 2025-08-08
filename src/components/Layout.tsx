import React, { useState, useTransition } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Collapse,
  LinearProgress,
  Chip
} from '@mui/material'
import {
  Menu as MenuIcon,
  Logout,
  ExpandLess,
  ExpandMore,
  AccountCircle,
  ChevronRight,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { usePermissions } from '../hooks/usePermissions'
import Footer from './Footer'
import ThemeToggle from './ThemeToggle'
import SearchBar from './SearchBar'
import Logo from './Logo'
import { NAVIGATION_CONFIG } from '../constants/navigation'

const drawerWidth = 240

interface MenuItem {
  text: string
  icon: React.ReactElement
  path?: string
  open?: boolean
  onClick?: () => void
  children?: MenuItem[]
}

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isPending, startTransition] = useTransition()
  const { user, logout, tokenStack, popFromStack } = useAuthStore()
  const { canView, isAdmin } = usePermissions()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [hostsOpen, setHostsOpen] = useState(true)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  
  const handleNavigate = (path: string) => {
    startTransition(() => {
      navigate(path)
    })
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Auto-close mobile drawer after navigation
  const handleMobileNavigate = (path: string) => {
    handleNavigate(path)
    // Close mobile drawer after navigation click
    if (mobileOpen) {
      setMobileOpen(false)
    }
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    startTransition(() => {
      logout()
      navigate('/login')
    })
  }

  // Build menu items based on permissions using navigation constants
  const hostsChildren: MenuItem[] = [
    canView('proxy_hosts') && { 
      text: NAVIGATION_CONFIG.proxyHosts.text, 
      icon: React.createElement(NAVIGATION_CONFIG.proxyHosts.icon, { sx: { color: NAVIGATION_CONFIG.proxyHosts.color } }), 
      path: NAVIGATION_CONFIG.proxyHosts.path 
    },
    canView('redirection_hosts') && { 
      text: NAVIGATION_CONFIG.redirectionHosts.text, 
      icon: React.createElement(NAVIGATION_CONFIG.redirectionHosts.icon, { sx: { color: NAVIGATION_CONFIG.redirectionHosts.color } }), 
      path: NAVIGATION_CONFIG.redirectionHosts.path 
    },
    canView('dead_hosts') && { 
      text: NAVIGATION_CONFIG.deadHosts.text, 
      icon: React.createElement(NAVIGATION_CONFIG.deadHosts.icon, { sx: { color: NAVIGATION_CONFIG.deadHosts.color } }), 
      path: NAVIGATION_CONFIG.deadHosts.path 
    },
    canView('streams') && { 
      text: NAVIGATION_CONFIG.streams.text, 
      icon: React.createElement(NAVIGATION_CONFIG.streams.icon, { sx: { color: NAVIGATION_CONFIG.streams.color } }), 
      path: NAVIGATION_CONFIG.streams.path 
    }
  ].filter(Boolean) as MenuItem[]

  const securityChildren: MenuItem[] = [
    canView('access_lists') && { 
      text: NAVIGATION_CONFIG.accessLists.text, 
      icon: React.createElement(NAVIGATION_CONFIG.accessLists.icon, { sx: { color: NAVIGATION_CONFIG.accessLists.color } }), 
      path: NAVIGATION_CONFIG.accessLists.path 
    },
    canView('certificates') && { 
      text: NAVIGATION_CONFIG.certificates.text, 
      icon: React.createElement(NAVIGATION_CONFIG.certificates.icon, { sx: { color: NAVIGATION_CONFIG.certificates.color } }), 
      path: NAVIGATION_CONFIG.certificates.path 
    }
  ].filter(Boolean) as MenuItem[]

  const menuItems = [
    {
      text: NAVIGATION_CONFIG.dashboard.text,
      icon: React.createElement(NAVIGATION_CONFIG.dashboard.icon, { sx: { color: NAVIGATION_CONFIG.dashboard.color } }),
      path: NAVIGATION_CONFIG.dashboard.path
    },
    hostsChildren.length > 0 && {
      text: NAVIGATION_CONFIG.hosts.text,
      icon: React.createElement(NAVIGATION_CONFIG.hosts.icon, { sx: { color: NAVIGATION_CONFIG.hosts.color } }),
      open: hostsOpen,
      onClick: () => setHostsOpen(!hostsOpen),
      children: hostsChildren
    },
    securityChildren.length > 0 && {
      text: NAVIGATION_CONFIG.security.text,
      icon: React.createElement(NAVIGATION_CONFIG.security.icon, { sx: { color: NAVIGATION_CONFIG.security.color } }),
      open: securityOpen,
      onClick: () => setSecurityOpen(!securityOpen),
      children: securityChildren
    },
  ].filter(Boolean) as MenuItem[]

  const adminItems = [
    {
      text: NAVIGATION_CONFIG.administration.text,
      icon: React.createElement(NAVIGATION_CONFIG.administration.icon, { sx: { color: NAVIGATION_CONFIG.administration.color } }),
      open: adminOpen,
      onClick: () => setAdminOpen(!adminOpen),
      children: [
        { 
          text: NAVIGATION_CONFIG.users.text, 
          icon: React.createElement(NAVIGATION_CONFIG.users.icon, { sx: { color: NAVIGATION_CONFIG.users.color } }), 
          path: NAVIGATION_CONFIG.users.path 
        },
        { 
          text: NAVIGATION_CONFIG.auditLog.text, 
          icon: React.createElement(NAVIGATION_CONFIG.auditLog.icon, { sx: { color: NAVIGATION_CONFIG.auditLog.color } }), 
          path: NAVIGATION_CONFIG.auditLog.path 
        },
        { 
          text: NAVIGATION_CONFIG.settings.text, 
          icon: React.createElement(NAVIGATION_CONFIG.settings.icon, { sx: { color: NAVIGATION_CONFIG.settings.color } }), 
          path: NAVIGATION_CONFIG.settings.path 
        }
      ]
    }
  ]

  const drawer = (
    <div>
      <Box 
        sx={{ 
          height: 64,
          background: 'linear-gradient(45deg, #2bcbba 30%, #4dd4c5 90%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2
        }}
      >
        <Logo width={100} color="white" />
      </Box>
      <List sx={{ pt: 2.5, px: 1 }}>
        {menuItems.map((item) => (
          <div key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={item.onClick || (() => item.path && handleMobileNavigate(item.path))}
                selected={item.path ? location.pathname === item.path : false}
                sx={{
                  mr: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(43, 203, 186, 0.08)',
                    borderRight: '3px solid #2bcbba',
                    '&:hover': {
                      backgroundColor: 'rgba(43, 203, 186, 0.12)',
                    }
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.children && (item.open ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>
            {item.children && (
              <Collapse in={item.open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.text}
                      sx={{ 
                        pl: 4,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(43, 203, 186, 0.08)',
                          borderRight: '3px solid #2bcbba',
                          '&:hover': {
                            backgroundColor: 'rgba(43, 203, 186, 0.12)',
                          }
                        }
                      }}
                      selected={location.pathname === child.path}
                      onClick={() => child.path && handleMobileNavigate(child.path)}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>{child.icon}</ListItemIcon>
                      <ListItemText 
                        primary={child.text} 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </div>
        ))}
      </List>
      
      {isAdmin && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2, py: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Administration
            </Typography>
          </Box>
          <List sx={{ pt: 0.5, px: 1 }}>
            {adminItems.map((item) => (
              <div key={item.text}>
                <ListItem disablePadding>
                  <ListItemButton onClick={item.onClick}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                    {item.open ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={item.open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.text}
                        sx={{ pl: 4 }}
                        onClick={() => child.path && handleMobileNavigate(child.path)}
                      >
                        <ListItemIcon>{child.icon}</ListItemIcon>
                        <ListItemText primary={child.text} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </div>
            ))}
          </List>
        </>
      )}
      
      {/* User Info Section */}
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
          onClick={handleMenu}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: isAdmin ? 'primary.main' : 'secondary.main'
            }}
          >
            {user?.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
          <ChevronRight fontSize="small" color="action" />
        </Box>
      </Box>
    </div>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', flex: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          transition: theme => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ px: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 'lg', px: 3 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { lg: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {user && (
              <Box sx={{ flexGrow: 1, mr: 2 }}>
                <SearchBar />
              </Box>
            )}
            
            {!user && <Box sx={{ flexGrow: 1 }} />}
            
            <ThemeToggle />
            
            {user && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Box position="relative">
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
                onClose={handleClose}
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
                    {tokenStack.map((tokenInfo, index) => (
                      <MenuItem key={index} onClick={() => {
                        handleClose()
                        popFromStack()
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
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </div>
          )}
          </Box>
        </Toolbar>
      </AppBar>
      
      {isPending && (
        <LinearProgress 
          sx={{ 
            position: 'fixed', 
            top: 64, 
            left: { lg: drawerWidth }, 
            right: 0, 
            zIndex: 1201 
          }} 
        />
      )}
      
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              transition: theme => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '2px 0 4px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              transition: theme => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { lg: `calc(100% - ${drawerWidth}px)` },
            transition: theme => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 'calc(100vh - 64px)'
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, p: 3, maxWidth: 'lg' }}>
              <Outlet />
            </Box>
          </Box>
          <Footer />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout