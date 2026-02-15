import React from 'react'
import { Box, Typography, Tooltip, IconButton } from '@mui/material'
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  OpenInNew as LinkIcon,
} from '@mui/icons-material'

/** Entity with SSL-related fields */
interface SslEntity {
  certificate_id: number | null
  ssl_forced: boolean | number
}

/**
 * Renders an SSL status icon based on the entity's certificate and SSL forced state.
 * Shared across ProxyHosts, RedirectionHosts, and DeadHosts columns.
 */
export function renderSslStatus(item: SslEntity): React.ReactNode {
  if (!item.certificate_id) {
    return <Tooltip title="No SSL"><LockOpenIcon color="disabled" /></Tooltip>
  }
  if (item.ssl_forced) {
    return <Tooltip title="SSL Forced"><LockIcon color="primary" /></Tooltip>
  }
  return <Tooltip title="SSL Optional"><LockIcon color="action" /></Tooltip>
}

/**
 * Renders a list of domain names with clickable external link icons.
 * Each domain is displayed with an icon button to open it in a new tab.
 * Used in ProxyHosts and RedirectionHosts domain columns.
 */
export function renderDomainLinks(domains: string[]): React.ReactNode {
  return (
    <Box>
      {domains.map((domain) => (
        <Box
          key={domain}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5
          }}>
          <Typography variant="body2">
            {domain}
          </Typography>
          <IconButton
            size="small"
            aria-label="Open domain in new tab"
            sx={{
              p: 0.25,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://${domain}`, '_blank')
            }}
          >
            <LinkIcon sx={{ fontSize: '0.875rem' }} />
          </IconButton>
        </Box>
      ))}
    </Box>
  )
}
