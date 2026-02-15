import React, { useMemo, useCallback } from 'react'
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
  TrendingFlat as RedirectIcon,
  ToggleOn as StatusIcon,
  MoreVert as ActionsIcon,
  CallMade as ForwardIcon,
  Security as AccessIcon,
  OpenInNew as LinkIcon,
} from '@mui/icons-material'
import type { NavigateFunction } from 'react-router-dom'
import type { ProxyHost } from '../api/proxyHosts'
import type { RedirectionHost } from '../api/redirectionHosts'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import PermissionIconButton from '../components/PermissionIconButton'
import { getStatusIcon } from '../utils/statusUtils'
import { renderSslStatus, renderDomainLinks } from '../utils/columnRenderers'

interface UseProxyHostColumnsParams {
  redirectionsByTarget: Map<string, RedirectionHost[]>
  onToggleEnabled: (host: ProxyHost) => void
  onEdit: (host: ProxyHost) => void
  onDelete: (host: ProxyHost) => void
  onViewConnections: (host: ProxyHost) => void
  onViewAccess: (host: ProxyHost) => void
  navigate: NavigateFunction
}

/**
 * Custom hook that provides column definitions for the proxy hosts DataTable.
 * Extracts the column configuration including render functions, sorting, and responsive priorities.
 */
const useProxyHostColumns = (params: UseProxyHostColumnsParams): ResponsiveTableColumn<ProxyHost>[] => {
  const { redirectionsByTarget, onToggleEnabled, onEdit, onDelete, onViewConnections, onViewAccess, navigate } = params

  /** Get redirection hosts that point to any of the proxy host's domains */
  const getLinkedRedirections = useCallback((host: ProxyHost): RedirectionHost[] => {
    const redirections: RedirectionHost[] = []
    host.domain_names.forEach(domain => {
      const domainRedirections = redirectionsByTarget.get(domain.toLowerCase()) || []
      redirections.push(...domainRedirections)
    })
    // Remove duplicates by id, filtering out any undefined results
    return Array.from(new Set(redirections.map(r => r.id)))
      .map(id => redirections.find(r => r.id === id))
      .filter((r): r is RedirectionHost => r !== undefined)
  }, [redirectionsByTarget])

  const columns = useMemo<ResponsiveTableColumn<ProxyHost>[]>(() => [
    {
      id: 'status',
      label: 'Status',
      icon: <StatusIcon fontSize="small" />,
      accessor: (item: ProxyHost) => !item.enabled ? 0 : (item.meta.nginx_online === false ? 1 : 2),
      sortable: true,
      align: 'center',
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      render: (_value: unknown, item: ProxyHost) => getStatusIcon(item)
    },
    {
      id: 'domain_names',
      label: 'Domain Names',
      icon: <LanguageIcon fontSize="small" />,
      accessor: (item: ProxyHost) => item.domain_names[0] || '',
      sortable: true,
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      mobileLabel: 'Domains',
      render: (_value: unknown, item: ProxyHost) => {
        const linkedRedirections = getLinkedRedirections(item)
        return (
          <Box>
            {renderDomainLinks(item.domain_names)}
            {linkedRedirections.length > 0 && (
              <Tooltip
                title={
                  <Box>
                    {linkedRedirections.map((redirect) => (
                      <div key={redirect.id}>
                        {redirect.domain_names.join(', ')} → {redirect.forward_domain_name}
                      </div>
                    ))}
                  </Box>
                }
              >
                <Box
                  role="link"
                  tabIndex={0}
                  aria-label={`View ${linkedRedirections.length} linked redirection${linkedRedirections.length > 1 ? 's' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (linkedRedirections.length === 1) {
                      navigate(`/hosts/redirection/${linkedRedirections[0].id}/view`)
                    } else {
                      onViewConnections(item)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      if (linkedRedirections.length === 1) {
                        navigate(`/hosts/redirection/${linkedRedirections[0].id}/view`)
                      } else {
                        onViewConnections(item)
                      }
                    }
                  }}
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
                  <RedirectIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="action" />
                  <Typography variant="caption" color="primary">
                    {linkedRedirections.length} Redirection{linkedRedirections.length > 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    {
      id: 'forward_host',
      label: 'Forward Host',
      icon: <ForwardIcon fontSize="small" />,
      accessor: (item: ProxyHost) => `${item.forward_scheme}://${item.forward_host}:${item.forward_port}`,
      sortable: true,
      priority: 'P2' as ColumnPriority,
      showInCard: true,
      mobileLabel: '',
      render: (_value: unknown, item: ProxyHost) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5
          }}>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {item.forward_scheme}://{item.forward_host}:{item.forward_port}
          </Typography>
          <IconButton
            size="small"
            aria-label="Open forward host in new tab"
            sx={{
              p: 0.25,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              window.open(`${item.forward_scheme}://${item.forward_host}:${item.forward_port}`, '_blank', 'noopener,noreferrer')
            }}
          >
            <LinkIcon sx={{ fontSize: '0.875rem' }} />
          </IconButton>
        </Box>
      )
    },
    {
      id: 'ssl',
      label: 'SSL',
      icon: <LockIcon fontSize="small" />,
      accessor: (item: ProxyHost) => !item.certificate_id ? 0 : (item.ssl_forced ? 2 : 1),
      sortable: true,
      align: 'center',
      priority: 'P3' as ColumnPriority,
      showInCard: true,
      render: (_value: unknown, item: ProxyHost) => renderSslStatus(item)
    },
    {
      id: 'access',
      label: 'Access',
      icon: <AccessIcon fontSize="small" />,
      accessor: (item: ProxyHost) => item.access_list?.name || '',
      sortable: true,
      priority: 'P3' as ColumnPriority,
      showInCard: false,
      render: (_value: unknown, item: ProxyHost) => {
        if (item.access_list) {
          return (
            <Chip
              label={item.access_list.name}
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onViewAccess(item)
              }}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            />
          )
        }
        return (
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>Public
                      </Typography>
        );
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <ActionsIcon fontSize="small" />,
      accessor: (item: ProxyHost) => item.id,
      sortable: false,
      align: 'right',
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      render: (_value: unknown, item: ProxyHost) => (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            justifyContent: "flex-end"
          }}>
          <PermissionIconButton
            resource="proxy_hosts"
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
            resource="proxy_hosts"
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
            resource="proxy_hosts"
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
  ], [getLinkedRedirections, onToggleEnabled, onEdit, onDelete, onViewConnections, onViewAccess, navigate])

  return columns
}

export default useProxyHostColumns
