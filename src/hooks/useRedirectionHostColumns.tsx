import React, { useMemo } from 'react'
import {
  Box,
  IconButton,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PowerSettingsNew as PowerIcon,
  Language as LanguageIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  TrendingFlat as RedirectIcon,
  SwapHoriz as ProxyIcon,
  CallMade as ForwardIcon,
  Code as CodeIcon,
  ToggleOn as StatusIcon,
  MoreVert as ActionsIcon,
  OpenInNew as LinkIcon,
} from '@mui/icons-material'
import type { NavigateFunction } from 'react-router-dom'
import type { RedirectionHost } from '../api/redirectionHosts'
import type { ProxyHost } from '../api/proxyHosts'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import PermissionIconButton from '../components/PermissionIconButton'
import { getStatusIcon } from '../utils/statusUtils'
import { getHttpStatusLabel } from '../utils/httpUtils'

interface UseRedirectionHostColumnsParams {
  proxyHostsByDomain: Map<string, ProxyHost>
  onToggleEnabled: (host: RedirectionHost) => void
  onEdit: (host: RedirectionHost) => void
  onDelete: (host: RedirectionHost) => void
  onViewProxyHost: (proxyHost: ProxyHost, event: React.MouseEvent) => void
  navigate: NavigateFunction
}

/**
 * Custom hook that provides column definitions for the redirection hosts DataTable.
 * Extracts the column configuration including render functions, sorting, and responsive priorities.
 */
const useRedirectionHostColumns = (params: UseRedirectionHostColumnsParams): ResponsiveTableColumn<RedirectionHost>[] => {
  const { proxyHostsByDomain, onToggleEnabled, onEdit, onDelete, onViewProxyHost, navigate } = params

  const columns = useMemo<ResponsiveTableColumn<RedirectionHost>[]>(() => [
    {
      id: 'status',
      label: 'Status',
      icon: <StatusIcon fontSize="small" />,
      accessor: (item) => !item.enabled ? 0 : (item.meta.nginx_online === false ? 1 : 2),
      sortable: true,
      align: 'center',
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      render: (value, item) => getStatusIcon(item)
    },
    {
      id: 'domain_names',
      label: 'Source Domains',
      icon: <LanguageIcon fontSize="small" />,
      accessor: (item) => item.domain_names[0] || '',
      sortable: true,
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      mobileLabel: 'Sources',
      render: (value, item) => (
        <Box>
          {item.domain_names.map((domain, index) => (
            <Box
              key={index}
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
    },
    {
      id: 'forward_domain',
      label: 'Destination',
      icon: <ForwardIcon fontSize="small" />,
      accessor: (item) => `${item.forward_scheme}://${item.forward_domain_name}`,
      sortable: true,
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      mobileLabel: '',
      render: (value, item) => {
        const linkedProxy = proxyHostsByDomain.get(item.forward_domain_name.toLowerCase())
        return (
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5
              }}>
              <RedirectIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {item.forward_scheme}://{item.forward_domain_name}
              </Typography>
              <IconButton
                size="small"
                sx={{
                  p: 0.25,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`${item.forward_scheme}://${item.forward_domain_name}`, '_blank')
                }}
              >
                <LinkIcon sx={{ fontSize: '0.875rem' }} />
              </IconButton>
            </Box>
            {linkedProxy && (
              <Box
                onClick={(e) => onViewProxyHost(linkedProxy, e)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  ml: 3,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>↳</Typography>
                <ProxyIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="action" />
                <Typography variant="caption" color="primary">
                  Proxy Host
                </Typography>
              </Box>
            )}
          </Box>
        );
      }
    },
    {
      id: 'http_code',
      label: 'HTTP Code',
      icon: <CodeIcon fontSize="small" />,
      accessor: (item) => item.forward_http_code,
      sortable: true,
      priority: 'P2' as ColumnPriority,
      showInCard: true,
      mobileLabel: '',
      render: (value, item) => (
        <Chip
          label={getHttpStatusLabel(item.forward_http_code)}
          size="small"
          color={item.forward_http_code >= 300 && item.forward_http_code < 400 ? 'primary' : 'default'}
        />
      )
    },
    {
      id: 'ssl',
      label: 'SSL',
      icon: <LockIcon fontSize="small" />,
      accessor: (item) => !item.certificate_id ? 0 : (item.ssl_forced ? 2 : 1),
      sortable: true,
      align: 'center',
      priority: 'P3' as ColumnPriority,
      showInCard: true,
      render: (value, item) => {
        if (!item.certificate_id) {
          return <Tooltip title="No SSL"><LockOpenIcon color="disabled" /></Tooltip>
        }
        if (item.ssl_forced) {
          return <Tooltip title="SSL Forced"><LockIcon color="primary" /></Tooltip>
        }
        return <Tooltip title="SSL Optional"><LockIcon color="action" /></Tooltip>
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <ActionsIcon fontSize="small" />,
      accessor: (item) => item.id,
      sortable: false,
      align: 'right',
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      render: (value, item) => (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            justifyContent: "flex-end"
          }}>
          <PermissionIconButton
            resource="redirection_hosts"
            permissionAction="edit"
            size="small"
            tooltipTitle={item.enabled ? 'Disable' : 'Enable'}
            onClick={(e) => {
              e.stopPropagation()
              onToggleEnabled(item)
            }}
            color={item.enabled ? 'default' : 'success'}
          >
            <PowerIcon />
          </PermissionIconButton>
          <PermissionIconButton
            resource="redirection_hosts"
            permissionAction="edit"
            size="small"
            tooltipTitle="Edit"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
          >
            <EditIcon />
          </PermissionIconButton>
          <PermissionIconButton
            resource="redirection_hosts"
            permissionAction="delete"
            size="small"
            tooltipTitle="Delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item)
            }}
            color="error"
          >
            <DeleteIcon />
          </PermissionIconButton>
        </Box>
      )
    }
  ], [proxyHostsByDomain, onToggleEnabled, onEdit, onDelete, onViewProxyHost, navigate])

  return columns
}

export default useRedirectionHostColumns
