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
import type { OverridableComponent } from '@mui/material/OverridableComponent'
import type { SvgIconTypeMap } from '@mui/material/SvgIcon'

/**
 * Typisierung für ein Navigationselement
 */
export type NavigationItem = {
  text: string
  path: string | null
  color: string
  icon: OverridableComponent<SvgIconTypeMap<object, 'svg'>>
  parent: string | null
  isParent?: boolean
}

/**
 * Navigation-Konfiguration
 */
export const NAVIGATION_CONFIG: Record<string, NavigationItem> = {
  dashboard: {
    text: 'Dashboard',
    path: '/',
    color: '#2bcbba',
    icon: Dashboard,
    parent: null,
  },
  hosts: {
    text: 'Hosts',
    path: null,
    color: '#5eba00',
    icon: Language,
    parent: null,
    isParent: true,
  },
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
  security: {
    text: 'Security',
    path: null,
    color: '#467fcf',
    icon: Security,
    parent: null,
    isParent: true,
  },
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
  administration: {
    text: 'Administration',
    path: null,
    color: '#868e96',
    icon: Settings,
    parent: null,
    isParent: true,
  },
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

export type NavigationConfig = typeof NAVIGATION_CONFIG

export const NAVIGATION_COLORS = {
  primary: '#2bcbba',
  primaryLight: '#4dd4c5',
  success: '#5eba00',
  warning: '#f1c40f',
  danger: '#cd201f',
  info: '#467fcf',
  secondary: '#868e96',
  muted: '#6c757d',
  edit: '#f59f00',
  dark: '#495c68',
} as const

export function getNavigationItemByPath(path: string) {
  for (const item of Object.values(NAVIGATION_CONFIG)) {
    if (item.path === path) {
      return item
    }
  }
  return null
}

export function getNavigationChildren(parentKey: keyof typeof NAVIGATION_CONFIG) {
  return Object.entries(NAVIGATION_CONFIG)
    .filter(([_, item]) => item.parent === parentKey)
    .map(([key, item]) => ({ key, ...item }))
}

export function getNavigationParents() {
  return Object.entries(NAVIGATION_CONFIG)
    .filter(([_, item]) => item.isParent)
    .map(([key, item]) => ({ key, ...item }))
}

export function getMenuItemColor(key: keyof typeof NAVIGATION_CONFIG): string {
  return NAVIGATION_CONFIG[key]?.color || NAVIGATION_COLORS.secondary
}