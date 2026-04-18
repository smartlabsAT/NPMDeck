import React from 'react'
import {
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectIcon,
  Block as DeadIcon,
  Stream as StreamIcon,
  VpnKey as CertificateIcon,
  Security as AccessListIcon,
  Group as UserIcon,
} from '@mui/icons-material'
import { NAVIGATION_COLORS } from '../../constants/navigation'

/** Resource icons mapping with navigation colors */
export const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  proxy_hosts: <ProxyIcon sx={{ color: NAVIGATION_COLORS.success }} />,
  redirection_hosts: <RedirectIcon sx={{ color: NAVIGATION_COLORS.warning }} />,
  dead_hosts: <DeadIcon sx={{ color: NAVIGATION_COLORS.danger }} />,
  streams: <StreamIcon sx={{ color: NAVIGATION_COLORS.info }} />,
  access_lists: <AccessListIcon sx={{ color: NAVIGATION_COLORS.primary }} />,
  certificates: <CertificateIcon sx={{ color: NAVIGATION_COLORS.info }} />,
  users: <UserIcon sx={{ color: NAVIGATION_COLORS.secondary }} />,
}
