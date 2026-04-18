import React from 'react'
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectionIcon,
  Stream as StreamIcon,
  Block as DeadHostIcon,
  Security as AccessListIcon,
  VpnKey as CertificateIcon,
  Category as CategoryIcon,
  PlayCircleOutline as ActionIcon,
  Label as EntityIcon,
  CalendarToday as DateIcon,
  Settings as ActionsIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { AuditLogEntry } from '../../api/auditLog'
import { ResponsiveTableColumn, ColumnPriority } from '../../components/DataTable/ResponsiveTypes'
import ActionChip from '../../components/shared/ActionChip'
import { NAVIGATION_COLORS } from '../../constants/navigation'

export function getObjectIcon(objectType: string): React.ReactElement | null {
  switch (objectType) {
    case 'proxy-host':
      return <ProxyIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.success }} />
    case 'redirection-host':
      return <RedirectionIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.warning }} />
    case 'stream':
    case 'stream-host':
      return <StreamIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.info }} />
    case 'dead-host':
      return <DeadHostIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.danger }} />
    case 'access-list':
      return <AccessListIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.primary }} />
    case 'user':
      return <PersonIcon fontSize="small" />
    case 'certificate':
      return <CertificateIcon fontSize="small" sx={{ color: NAVIGATION_COLORS.info }} />
    default:
      return null
  }
}

export function getAuditLogColumns(
  getObjectDisplayName: (entry: AuditLogEntry) => React.ReactNode,
  onViewMeta: (entry: AuditLogEntry) => void
): ResponsiveTableColumn<AuditLogEntry>[] {
  return [
    {
      id: 'user',
      label: 'User',
      icon: <PersonIcon fontSize="small" />,
      accessor: (entry) => entry.user.name,
      sortable: true,
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      render: (_, entry) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
          <Avatar
            src={entry.user.avatar || '/images/default-avatar.jpg'}
            sx={{
              width: 40,
              height: 40,
              border: entry.user.is_disabled ? '2px solid' : 'none',
              borderColor: 'error.main',
            }}
          >
            {entry.user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 'medium',
                textDecoration: entry.user.is_deleted ? 'line-through' : 'none',
              }}>
              {entry.user.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {entry.user.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'object_type',
      label: 'Type',
      icon: <CategoryIcon fontSize="small" />,
      accessor: (entry) => entry.object_type,
      sortable: true,
      priority: 'P2' as ColumnPriority,
      showInCard: true,
      render: (_, entry) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
          {getObjectIcon(entry.object_type)}
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
            {entry.object_type.replace('-', ' ')}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'action',
      label: 'Action',
      icon: <ActionIcon fontSize="small" />,
      accessor: (entry) => entry.action,
      sortable: true,
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      render: (_, entry) => <ActionChip action={entry.action} />,
    },
    {
      id: 'entity',
      label: 'Entity',
      icon: <EntityIcon fontSize="small" />,
      accessor: (entry) => {
        // For sorting, use the first domain name or name
        if (entry.meta.domain_names?.[0]) return entry.meta.domain_names[0]
        if (entry.meta.name) return entry.meta.name
        if (entry.meta.nice_name) return entry.meta.nice_name
        if (entry.meta.incoming_port) return `Port ${entry.meta.incoming_port}`
        return `#${entry.object_id}`
      },
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      mobileLabel: '',
      render: (_, entry) => (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
          {getObjectDisplayName(entry)}
        </Box>
      ),
    },
    {
      id: 'created_on',
      label: 'Date',
      icon: <DateIcon fontSize="small" />,
      accessor: (entry) => entry.created_on,
      sortable: true,
      priority: 'P2' as ColumnPriority,
      showInCard: true,
      render: (date) => (
        <Box>
          <Typography variant="body2">
            {format(new Date(date as string), 'MMM d, yyyy')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {format(new Date(date as string), 'h:mm a')}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <ActionsIcon fontSize="small" />,
      align: 'right',
      accessor: () => null,
      priority: 'P1' as ColumnPriority,
      showInCard: true,
      render: (_, entry) => (
        <Tooltip title="View metadata">
          <IconButton
            size="small"
            aria-label="View audit entry metadata"
            onClick={(e) => {
              e.stopPropagation()
              onViewMeta(entry)
            }}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ]
}

export function getObjectDisplayNameItems(
  entry: AuditLogEntry,
  handleChipClick: (entry: AuditLogEntry) => void
): React.ReactNode {
  const items: string[] = []

  switch (entry.object_type) {
    case 'proxy-host':
    case 'redirection-host':
    case 'dead-host':
      if (entry.meta.domain_names && entry.meta.domain_names.length > 0) {
        items.push(...entry.meta.domain_names)
      }
      break
    case 'stream':
    case 'stream-host':
      if (entry.meta.incoming_port) {
        items.push(`Port ${entry.meta.incoming_port}`)
      }
      break
    case 'access-list':
    case 'user':
      if (entry.meta.name) {
        items.push(entry.meta.name)
      }
      break
    case 'certificate':
      if (entry.meta.provider === 'letsencrypt' && entry.meta.domain_names) {
        items.push(...entry.meta.domain_names)
      } else if (entry.meta.nice_name) {
        items.push(entry.meta.nice_name)
      }
      break
  }

  if (items.length === 0) {
    return (
      <Chip
        label={`#${entry.object_id || '?'}`}
        size="small"
        sx={{
          mx: 0.5,
          my: 0.25,
          cursor: 'pointer',
          '& .MuiChip-label': {
            px: 1.5,
            py: 0.5,
          },
        }}
        onClick={() => handleChipClick(entry)}
      />
    )
  }

  return items.map((item) => (
    <Chip
      key={item}
      label={item}
      size="small"
      sx={{
        mx: 0.5,
        my: 0.25,
        cursor: 'pointer',
        '& .MuiChip-label': {
          px: 1.5,
          py: 0.5,
        },
      }}
      onClick={() => handleChipClick(entry)}
    />
  ))
}
