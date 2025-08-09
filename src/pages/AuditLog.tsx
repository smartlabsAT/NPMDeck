import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Paper,
  Container,
  useTheme,
} from '@mui/material'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

SyntaxHighlighter.registerLanguage('json', json)
import {
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectionIcon,
  Stream as StreamIcon,
  Block as DeadHostIcon,
  Security as AccessListIcon,
  VpnKey as CertificateIcon,
  Description as AuditIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonOutline as UserIcon,
  Category as CategoryIcon,
  PlayCircleOutline as ActionIcon,
  Label as EntityIcon,
  CalendarToday as DateIcon,
  Settings as ActionsIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { auditLogApi, AuditLogEntry } from '../api/auditLog'
import { useResponsive } from '../hooks/useResponsive'
import PageHeader from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { ResponsiveTableColumn, ColumnPriority } from '../components/DataTable/ResponsiveTypes'
import { Filter } from '../components/DataTable/types'
import { useToast } from '../contexts/ToastContext'
import ActionChip from '../components/shared/ActionChip'
import { NAVIGATION_CONFIG } from '../constants/navigation'

const AuditLog = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { } = useResponsive() // eslint-disable-line no-empty-pattern
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [metaDialogOpen, setMetaDialogOpen] = useState(false)
  const { showError } = useToast()

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await auditLogApi.getAll({ 
        expand: ['user']
      })
      setLogs(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs'
      setError(errorMessage)
      showError('audit-log', 'load', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const handleViewMeta = (entry: AuditLogEntry) => {
    setSelectedEntry(entry)
    setMetaDialogOpen(true)
  }

  const handleCloseMetaDialog = () => {
    setMetaDialogOpen(false)
    setSelectedEntry(null)
  }

  const getObjectIcon = (objectType: string) => {
    switch (objectType) {
      case 'proxy-host':
        return <ProxyIcon fontSize="small" sx={{ color: '#5eba00' }} />
      case 'redirection-host':
        return <RedirectionIcon fontSize="small" sx={{ color: '#f1c40f' }} />
      case 'stream':
      case 'stream-host':
        return <StreamIcon fontSize="small" sx={{ color: '#467fcf' }} />
      case 'dead-host':
        return <DeadHostIcon fontSize="small" sx={{ color: '#cd201f' }} />
      case 'access-list':
        return <AccessListIcon fontSize="small" sx={{ color: '#2bcbba' }} />
      case 'user':
        return <PersonIcon fontSize="small" />
      case 'certificate':
        return <CertificateIcon fontSize="small" sx={{ color: '#467fcf' }} />
      default:
        return null
    }
  }

  const _getObjectTypeColor = (objectType: string): string => {
    switch (objectType) {
      case 'proxy-host':
        return '#5eba00'
      case 'redirection-host':
        return '#f1c40f'
      case 'stream':
      case 'stream-host':
        return '#467fcf'
      case 'dead-host':
        return '#cd201f'
      case 'access-list':
        return '#2bcbba'
      case 'user':
        return '#868e96'
      case 'certificate':
        return '#467fcf'
      default:
        return '#868e96'
    }
  }


  const getObjectLink = (entry: AuditLogEntry): string => {
    switch (entry.object_type) {
      case 'proxy-host':
        return `/hosts/proxy/${entry.object_id}/view`
      case 'redirection-host':
        return `/hosts/redirection/${entry.object_id}/view`
      case 'dead-host':
        return `/hosts/404/${entry.object_id}/view`
      case 'stream':
      case 'stream-host':
        return `/hosts/streams/${entry.object_id}/view`
      case 'access-list':
        return `/security/access-lists/${entry.object_id}/view`
      case 'certificate':
        return `/security/certificates/${entry.object_id}/view`
      case 'user':
        return `/users/${entry.object_id}`
      default:
        return '#'
    }
  }

  const handleChipClick = (entry: AuditLogEntry) => {
    const link = getObjectLink(entry)
    if (link !== '#') {
      navigate(link)
    }
  }

  const getObjectDisplayName = (entry: AuditLogEntry) => {
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
              py: 0.5
            }
          }}
          onClick={() => handleChipClick(entry)}
        />
      )
    }
    
    return items.map((item, index) => (
      <Chip 
        key={index} 
        label={item} 
        size="small" 
        sx={{ 
          mx: 0.5, 
          my: 0.25, 
          cursor: 'pointer',
          '& .MuiChip-label': {
            px: 1.5,
            py: 0.5
          }
        }}
        onClick={() => handleChipClick(entry)}
      />
    ))
  }

  // Table column definitions with responsive priorities
  const columns: ResponsiveTableColumn<AuditLogEntry>[] = useMemo(() => [
    {
      id: 'user',
      label: 'User',
      icon: <PersonIcon fontSize="small" />,
      accessor: (entry) => entry.user.name,
      sortable: true,
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_, entry) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar
            src={entry.user.avatar || '/images/default-avatar.jpg'}
            sx={{ 
              width: 40, 
              height: 40,
              border: entry.user.is_disabled ? '2px solid' : 'none',
              borderColor: 'error.main'
            }}
          >
            {entry.user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                textDecoration: entry.user.is_deleted ? 'line-through' : 'none'
              }}
            >
              {entry.user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
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
      priority: 'P2' as ColumnPriority, // Important - hidden on mobile
      showInCard: true,
      render: (_, entry) => (
        <Box display="flex" alignItems="center" gap={1}>
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
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_, entry) => (
        <ActionChip action={entry.action as any} />
      ),
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
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      mobileLabel: '',
      render: (_, entry) => (
        <Box display="flex" flexWrap="wrap" alignItems="center">
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
      priority: 'P2' as ColumnPriority, // Important - hidden on mobile
      showInCard: true,
      render: (date) => (
        <Box>
          <Typography variant="body2">
            {format(new Date(date), 'MMM d, yyyy')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(date), 'h:mm a')}
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
      priority: 'P1' as ColumnPriority, // Essential - always visible
      showInCard: true,
      render: (_, entry) => (
        <Tooltip title="View metadata">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              handleViewMeta(entry)
            }}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [])

  // Filter definitions
  const filters: Filter[] = useMemo(() => [
    {
      id: 'object_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'proxy-host', label: 'Proxy Host', icon: <ProxyIcon fontSize="small" /> },
        { value: 'redirection-host', label: 'Redirection Host', icon: <RedirectionIcon fontSize="small" /> },
        { value: 'stream', label: 'Stream', icon: <StreamIcon fontSize="small" /> },
        { value: 'dead-host', label: '404 Host', icon: <DeadHostIcon fontSize="small" /> },
        { value: 'access-list', label: 'Access List', icon: <AccessListIcon fontSize="small" /> },
        { value: 'user', label: 'User', icon: <PersonIcon fontSize="small" /> },
        { value: 'certificate', label: 'Certificate', icon: <CertificateIcon fontSize="small" /> },
      ],
    },
    {
      id: 'action',
      label: 'Action',
      type: 'select',
      options: [
        { value: 'created', label: 'Created', icon: <AddIcon fontSize="small" /> },
        { value: 'updated', label: 'Updated', icon: <EditIcon fontSize="small" /> },
        { value: 'deleted', label: 'Deleted', icon: <DeleteIcon fontSize="small" /> },
        { value: 'enabled', label: 'Enabled', icon: <AddIcon fontSize="small" /> },
        { value: 'disabled', label: 'Disabled', icon: <DeleteIcon fontSize="small" /> },
        { value: 'renewed', label: 'Renewed', icon: <EditIcon fontSize="small" /> },
      ],
    },
    {
      id: 'user.is_disabled',
      label: 'User Status',
      type: 'select',
      options: [
        { value: 'false', label: 'Active Users', icon: <UserIcon fontSize="small" color="success" /> },
        { value: 'true', label: 'Disabled Users', icon: <UserIcon fontSize="small" color="error" /> },
      ],
    },
  ], [])

  return (
    <Container maxWidth={false}>
      <Box py={3}>
        <Box mb={3}>
          <PageHeader
            icon={React.createElement(NAVIGATION_CONFIG.auditLog.icon, { sx: { color: NAVIGATION_CONFIG.auditLog.color } })}
            title={NAVIGATION_CONFIG.auditLog.text}
            description="View all system activities and changes"
          />
        </Box>

        <DataTable
          data={logs}
          columns={columns}
          keyExtractor={(entry) => entry.id}
          filters={filters}
          searchPlaceholder="Search by user name, email, or entity..."
          loading={loading}
          error={error}
          emptyMessage="No audit logs found."
          defaultSortField="created_on"
          defaultSortDirection="desc"
          defaultRowsPerPage={50}
          rowsPerPageOptions={[25, 50, 100, 200]}
          stickyHeader
          responsive={true}
          cardBreakpoint={900}
          compactBreakpoint={1250}
        />
      </Box>

      <Dialog
        open={metaDialogOpen}
        onClose={handleCloseMetaDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AuditIcon sx={{ color: '#495c68' }} />
            Audit Log Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEntry && (
            <Box>
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Action Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box display="grid" gridTemplateColumns="200px 1fr" gap={1}>
                    <Typography variant="body2" color="text.secondary">User:</Typography>
                    <Typography variant="body2">
                      {selectedEntry.user.name} ({selectedEntry.user.email})
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Action:</Typography>
                    <ActionChip action={selectedEntry.action as any} />
                    
                    <Typography variant="body2" color="text.secondary">Object Type:</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getObjectIcon(selectedEntry.object_type)}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {selectedEntry.object_type.replace('-', ' ')}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">Object ID:</Typography>
                    <Typography variant="body2">{selectedEntry.object_id}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Date:</Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedEntry.created_on), 'PPpp')}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Metadata
                </Typography>
                <Paper variant="outlined" sx={{ p: 0, backgroundColor: 'action.hover', overflow: 'hidden' }}>
                  <SyntaxHighlighter
                    language="json"
                    style={theme.palette.mode === 'dark' ? atomOneDark : atomOneLight}
                    customStyle={{
                      margin: 0,
                      padding: '16px',
                      backgroundColor: 'transparent',
                      fontSize: '0.875rem',
                    }}
                    wrapLongLines={true}
                  >
                    {JSON.stringify(selectedEntry.meta, null, 2)}
                  </SyntaxHighlighter>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMetaDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AuditLog