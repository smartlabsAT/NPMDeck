import { useState, useTransition, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  LinearProgress,
} from '@mui/material'
import {
  Menu as MenuIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { useNavigationMenu } from '../hooks/useNavigationMenu'
import Footer from './Footer'
import ThemeToggle from './ThemeToggle'
import SearchBar from './SearchBar'
import Logo from './Logo'
import { NAVIGATION_COLORS } from '../constants/navigation'
import { LAYOUT } from '../constants/layout'
import DrawerNavigationMenu from './layout/DrawerNavigationMenu'
import DrawerAdminSection from './layout/DrawerAdminSection'
import DrawerUserInfoSection from './layout/DrawerUserInfoSection'
import AppBarUserMenu from './layout/AppBarUserMenu'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isPending, startTransition] = useTransition()
  const { user, logout, tokenStack, popFromStack } = useAuthStore()
  const { menuItems, adminItems, isAdmin } = useNavigationMenu()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleNavigate = useCallback((path: string) => {
    startTransition(() => {
      navigate(path)
    })
  }, [navigate])

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(prev => !prev)
  }, [])

  // Auto-close mobile drawer after navigation
  const handleMobileNavigate = useCallback((path: string) => {
    handleNavigate(path)
    // Close mobile drawer after navigation click
    setMobileOpen(false)
  }, [handleNavigate])

  const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleLogout = useCallback(() => {
    startTransition(() => {
      logout()
      navigate('/login')
    })
  }, [logout, navigate])

  const drawer = (
    <div>
      <Box
        sx={{
          height: LAYOUT.TOOLBAR_HEIGHT,
          background: `linear-gradient(45deg, ${NAVIGATION_COLORS.primary} 30%, ${NAVIGATION_COLORS.primaryLight} 90%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2
        }}
      >
        <Logo width={100} color="white" />
      </Box>
      <DrawerNavigationMenu
        menuItems={menuItems}
        currentPath={location.pathname}
        onNavigate={handleMobileNavigate}
      />

      {isAdmin && (
        <DrawerAdminSection
          adminItems={adminItems}
          onNavigate={handleMobileNavigate}
        />
      )}

      {/* User Info Section */}
      {user && (
        <DrawerUserInfoSection
          userName={user.name}
          userEmail={user.email}
          isAdmin={isAdmin}
          onMenuOpen={handleMenu}
        />
      )}
    </div>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', flex: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${LAYOUT.DRAWER_WIDTH}px)` },
          ml: { lg: `${LAYOUT.DRAWER_WIDTH}px` },
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
              <AppBarUserMenu
                user={user}
                tokenStack={tokenStack}
                anchorEl={anchorEl}
                onMenuOpen={handleMenu}
                onMenuClose={handleClose}
                onLogout={handleLogout}
                onSwitchAccount={popFromStack}
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {isPending && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: LAYOUT.TOOLBAR_HEIGHT,
            left: { lg: LAYOUT.DRAWER_WIDTH },
            right: 0,
            zIndex: 1201
          }}
        />
      )}

      <Box
        component="nav"
        sx={{ width: { lg: LAYOUT.DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
        aria-label="Main navigation"
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
              width: LAYOUT.DRAWER_WIDTH,
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
              width: LAYOUT.DRAWER_WIDTH,
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
            width: { lg: `calc(100% - ${LAYOUT.DRAWER_WIDTH}px)` },
            transition: theme => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            minHeight: `calc(100vh - ${LAYOUT.TOOLBAR_HEIGHT}px)`
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
  );
}

export default Layout