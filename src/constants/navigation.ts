import {
  Dashboard,
  Language,
  SwapHoriz,
  TrendingFlat,
  Block,
  Stream,
  Security,
  VpnKey,
  Settings,
  Group,
  Description,
  Tune as PreferencesIcon,
} from '@mui/icons-material'

/**
 * Navigation menu configuration with colors and icons
 * Used throughout the application for consistent theming
 * Flat structure with parent references for easy access
 */
export const NAVIGATION_CONFIG = {
  // Main navigation items
  dashboard: {
    text: 'Dashboard',
    path: '/',
    color: '#2bcbba',
    icon: Dashboard,
    parent: null,
  },
  
  // Hosts parent menu
  hosts: {
    text: 'Hosts',
    path: null,
    color: '#5eba00',
    icon: Language,
    parent: null,
    isParent: true,
  },
  
  // Hosts children
  proxyHosts: {
    text: 'Proxy Hosts',
    path: '/hosts/proxy',
    color: '#5eba00',
    icon: SwapHoriz,
    parent: 'hosts',
  },
  
  redirectionHosts: {
    text: 'Redirection Hosts',
    path: '/hosts/redirection',
    color: '#f1c40f',
    icon: TrendingFlat,
    parent: 'hosts',
  },
  
  deadHosts: {
    text: '404 Hosts',
    path: '/hosts/404',
    color: '#cd201f',
    icon: Block,
    parent: 'hosts',
  },
  
  streams: {
    text: 'Streams',
    path: '/hosts/streams',
    color: '#467fcf',
    icon: Stream,
    parent: 'hosts',
  },
  
  // Security parent menu
  security: {
    text: 'Security',
    path: null,
    color: '#467fcf',
    icon: Security,
    parent: null,
    isParent: true,
  },
  
  // Security children
  accessLists: {
    text: 'Access Lists',
    path: '/security/access-lists',
    color: '#2bcbba',
    icon: Security,
    parent: 'security',
  },
  
  certificates: {
    text: 'SSL Certificates',
    path: '/security/certificates',
    color: '#467fcf',
    icon: VpnKey,
    parent: 'security',
  },
  
  // Administration parent menu
  administration: {
    text: 'Administration',
    path: null,
    color: '#868e96',
    icon: Settings,
    parent: null,
    isParent: true,
  },
  
  // Administration children
  users: {
    text: 'Users',
    path: '/admin/users',
    color: '#868e96',
    icon: Group,
    parent: 'administration',
  },
  
  auditLog: {
    text: 'Audit Log',
    path: '/admin/audit-log',
    color: '#868e96',
    icon: Description,
    parent: 'administration',
  },
  
  settings: {
    text: 'Settings',
    path: '/admin/settings',
    color: '#6c757d',
    icon: PreferencesIcon,
    parent: 'administration',
  },
} as const

/**
 * Color palette used in navigation
 */
export const NAVIGATION_COLORS = {
  primary: '#2bcbba',      // Teal - Dashboard, Access Lists
  success: '#5eba00',      // Green - Hosts, Proxy Hosts
  warning: '#f1c40f',      // Yellow - Redirection Hosts
  danger: '#cd201f',       // Red - 404 Hosts
  info: '#467fcf',         // Blue - Streams, Security, Certificates
  secondary: '#868e96',    // Gray - Users, Audit Log
  muted: '#6c757d',        // Dark Gray - Settings
} as const

/**
 * Helper function to get navigation item by path
 */
export function getNavigationItemByPath(path: string) {
  for (const item of Object.values(NAVIGATION_CONFIG)) {
    if (item.path === path) {
      return item
    }
  }
  return null
}

/**
 * Helper function to get children of a parent menu
 */
export function getNavigationChildren(parentKey: keyof typeof NAVIGATION_CONFIG) {
  return Object.entries(NAVIGATION_CONFIG)
    .filter(([_, item]) => item.parent === parentKey)
    .map(([key, item]) => ({ key, ...item }))
}

/**
 * Helper function to get all parent menus
 */
export function getNavigationParents() {
  return Object.entries(NAVIGATION_CONFIG)
    .filter(([_, item]) => item.isParent)
    .map(([key, item]) => ({ key, ...item }))
}

/**
 * Helper function to get color for a specific menu item
 */
export function getMenuItemColor(key: keyof typeof NAVIGATION_CONFIG): string {
  return NAVIGATION_CONFIG[key]?.color || NAVIGATION_COLORS.secondary
}

/**
 * Type definitions for navigation items
 */
export type NavigationItem = {
  text: string
  path: string | null
  color: string
  icon: typeof Dashboard // Icon component type
  parent: string | null
  isParent?: boolean
}

export type NavigationConfig = typeof NAVIGATION_CONFIG