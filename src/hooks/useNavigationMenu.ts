import React, { useState, useMemo } from 'react'
import { usePermissions } from './usePermissions'
import { NAVIGATION_CONFIG } from '../constants/navigation'

/**
 * Represents a navigation menu item with optional children for nested menus.
 * Named NavigationMenuItem to avoid conflict with MUI's MenuItem component.
 */
export interface NavigationMenuItem {
  text: string
  icon: React.ReactElement
  path?: string
  open?: boolean
  onClick?: () => void
  children?: NavigationMenuItem[]
}

interface UseNavigationMenuReturn {
  menuItems: NavigationMenuItem[]
  adminItems: NavigationMenuItem[]
  isAdmin: boolean
}

/**
 * Custom hook that builds navigation menu items based on user permissions.
 * Manages collapse state for parent menu items (Hosts, Security, Administration).
 */
export const useNavigationMenu = (): UseNavigationMenuReturn => {
  const { canView, isAdmin } = usePermissions()
  const [hostsOpen, setHostsOpen] = useState(true)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const hostsChildren = useMemo<NavigationMenuItem[]>(() => [
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
  ].filter(Boolean) as NavigationMenuItem[], [canView])

  const securityChildren = useMemo<NavigationMenuItem[]>(() => [
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
  ].filter(Boolean) as NavigationMenuItem[], [canView])

  const menuItems = useMemo(() => [
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
  ].filter(Boolean) as NavigationMenuItem[], [hostsChildren, hostsOpen, securityChildren, securityOpen])

  const adminItems = useMemo<NavigationMenuItem[]>(() => [
    {
      text: NAVIGATION_CONFIG.administration.text,
      icon: React.createElement(NAVIGATION_CONFIG.administration.icon, { sx: { color: NAVIGATION_CONFIG.administration.color } }),
      open: adminOpen,
      onClick: () => setAdminOpen(!adminOpen),
      children: [
        {
          text: NAVIGATION_CONFIG.users.text,
          icon: React.createElement(NAVIGATION_CONFIG.users.icon, { sx: { color: NAVIGATION_CONFIG.users.color } }),
          path: NAVIGATION_CONFIG.users.path ?? undefined
        },
        {
          text: NAVIGATION_CONFIG.auditLog.text,
          icon: React.createElement(NAVIGATION_CONFIG.auditLog.icon, { sx: { color: NAVIGATION_CONFIG.auditLog.color } }),
          path: NAVIGATION_CONFIG.auditLog.path ?? undefined
        },
        {
          text: NAVIGATION_CONFIG.settings.text,
          icon: React.createElement(NAVIGATION_CONFIG.settings.icon, { sx: { color: NAVIGATION_CONFIG.settings.color } }),
          path: NAVIGATION_CONFIG.settings.path ?? undefined
        }
      ]
    }
  ], [adminOpen])

  return { menuItems, adminItems, isAdmin }
}