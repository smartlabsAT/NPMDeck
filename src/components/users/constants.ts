import {
  Language as ProxyIcon,
  TrendingFlat as RedirectIcon,
  Block as BlockIcon,
  Stream as StreamIcon,
  Security as SecurityIcon,
  VpnKey as CertificateIcon,
} from '@mui/icons-material'
import { NAVIGATION_COLORS } from '../../constants/navigation'
import type { PermissionPreset } from './types'
import React from 'react'

/**
 * Pre-defined permission presets for quick user configuration
 */
export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    name: 'Read-Only',
    description: 'Can view all features but cannot make changes',
    permissions: {
      visibility: 'all',
      proxy_hosts: 'view',
      redirection_hosts: 'view',
      dead_hosts: 'view',
      streams: 'view',
      access_lists: 'view',
      certificates: 'view',
    }
  },
  {
    name: 'Host Manager',
    description: 'Can manage all host types',
    permissions: {
      visibility: 'all',
      proxy_hosts: 'manage',
      redirection_hosts: 'manage',
      dead_hosts: 'manage',
      streams: 'manage',
      access_lists: 'view',
      certificates: 'view',
    }
  },
  {
    name: 'Certificate Manager',
    description: 'Can manage certificates and access lists',
    permissions: {
      visibility: 'all',
      proxy_hosts: 'view',
      redirection_hosts: 'view',
      dead_hosts: 'view',
      streams: 'view',
      access_lists: 'manage',
      certificates: 'manage',
    }
  },
  {
    name: 'Own Items Only',
    description: 'Can only see and manage their own items',
    permissions: {
      visibility: 'user',
      proxy_hosts: 'manage',
      redirection_hosts: 'manage',
      dead_hosts: 'manage',
      streams: 'manage',
      access_lists: 'manage',
      certificates: 'manage',
    }
  },
]

/**
 * Feature permission configuration for the permissions tab
 * Each entry defines a permission key, display label, and icon
 */
export interface FeaturePermissionConfig {
  key: string
  label: string
  icon: React.ReactNode
}

export const FEATURE_PERMISSIONS: FeaturePermissionConfig[] = [
  { key: 'proxy_hosts', label: 'Proxy Hosts', icon: React.createElement(ProxyIcon, { sx: { color: NAVIGATION_COLORS.success } }) },
  { key: 'redirection_hosts', label: 'Redirection Hosts', icon: React.createElement(RedirectIcon, { sx: { color: NAVIGATION_COLORS.warning } }) },
  { key: 'dead_hosts', label: '404 Hosts', icon: React.createElement(BlockIcon, { sx: { color: NAVIGATION_COLORS.danger } }) },
  { key: 'streams', label: 'Streams', icon: React.createElement(StreamIcon, { sx: { color: NAVIGATION_COLORS.info } }) },
  { key: 'access_lists', label: 'Access Lists', icon: React.createElement(SecurityIcon, { sx: { color: NAVIGATION_COLORS.primary } }) },
  { key: 'certificates', label: 'SSL Certificates', icon: React.createElement(CertificateIcon, { sx: { color: NAVIGATION_COLORS.info } }) },
]
