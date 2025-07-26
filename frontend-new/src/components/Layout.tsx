import { useState, useTransition } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
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
  Dashboard,
  Language,
  SwapHoriz,
  Block,
  Stream,
  Security,
  VpnKey,
  Group,
  Description,
  Settings,
  Logout,
  ExpandLess,
  ExpandMore,
  AccountCircle,
  TrendingFlat,
  ImportExport as ImportExportIcon
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'

const drawerWidth = 240

const Layout = () => {
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()
  const { user, logout, tokenStack, popFromStack } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
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

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/'
    },
    {
      text: 'Hosts',
      icon: <Language />,
      open: hostsOpen,
      onClick: () => setHostsOpen(!hostsOpen),
      children: [
        { text: 'Proxy Hosts', icon: <SwapHoriz />, path: '/hosts/proxy' },
        { text: 'Redirection Hosts', icon: <TrendingFlat />, path: '/hosts/redirection' },
        { text: '404 Hosts', icon: <Block />, path: '/hosts/404' },
        { text: 'Streams', icon: <Stream />, path: '/hosts/streams' }
      ]
    },
    {
      text: 'Security',
      icon: <Security />,
      open: securityOpen,
      onClick: () => setSecurityOpen(!securityOpen),
      children: [
        { text: 'Access Lists', icon: <Security />, path: '/security/access-lists' },
        { text: 'SSL Certificates', icon: <VpnKey />, path: '/security/certificates' }
      ]
    },
    {
      text: 'Import / Export',
      icon: <ImportExportIcon />,
      path: '/tools/import-export'
    }
  ]

  const adminItems = [
    {
      text: 'Administration',
      icon: <Settings />,
      open: adminOpen,
      onClick: () => setAdminOpen(!adminOpen),
      children: [
        { text: 'Users', icon: <Group />, path: '/admin/users' },
        { text: 'Audit Log', icon: <Description />, path: '/admin/audit-log' },
        { text: 'Settings', icon: <Settings />, path: '/admin/settings' }
      ]
    }
  ]

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          NPM
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <div key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={item.onClick || (() => item.path && handleNavigate(item.path))}
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
                      sx={{ pl: 4 }}
                      onClick={() => handleNavigate(child.path)}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </div>
        ))}
      </List>
      
      {(user?.roles.includes('admin') || user?.roles.includes('user')) && (
        <>
          <Divider />
          <List>
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
                        onClick={() => handleNavigate(child.path)}
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
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Nginx Proxy Manager
          </Typography>
          
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
        </Toolbar>
      </AppBar>
      
      {isPending && (
        <LinearProgress 
          sx={{ 
            position: 'fixed', 
            top: 64, 
            left: { sm: drawerWidth }, 
            right: 0, 
            zIndex: 1201 
          }} 
        />
      )}
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout