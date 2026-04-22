import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
} from '@mui/material'
import {
  Person as PersonIcon,
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectionIcon,
  Stream as StreamIcon,
  Block as DeadHostIcon,
  Security as AccessListIcon,
  VpnKey as CertificateIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonOutline as UserIcon,
} from '@mui/icons-material'
import { auditLogApi, AuditLogEntry } from '../api/auditLog'

import PageHeader from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { Filter } from '../components/DataTable/types'
import { useToast } from '../contexts/ToastContext'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { LAYOUT } from '../constants/layout'
import { AUDIT_LOG_ROWS_PER_PAGE_OPTIONS } from '../constants/table'
import { getAuditLogColumns, getObjectDisplayNameItems } from './AuditLog/auditLogColumns'
import AuditLogMetaDialog from './AuditLog/AuditLogMetaDialog'

const AuditLog = () => {
  const navigate = useNavigate()
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
    } catch (err: unknown) {
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

  const handleViewMeta = useCallback((entry: AuditLogEntry) => {
    setSelectedEntry(entry)
    setMetaDialogOpen(true)
  }, [])

  const handleCloseMetaDialog = useCallback(() => {
    setMetaDialogOpen(false)
    setSelectedEntry(null)
  }, [])

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

  const handleChipClick = useCallback((entry: AuditLogEntry) => {
    const link = getObjectLink(entry)
    if (link !== '#') {
      navigate(link)
    }
  }, [navigate])

  const getObjectDisplayName = useCallback((entry: AuditLogEntry) => {
    return getObjectDisplayNameItems(entry, handleChipClick)
  }, [handleChipClick])

  const columns = useMemo(
    () => getAuditLogColumns(getObjectDisplayName, handleViewMeta),
    [getObjectDisplayName, handleViewMeta]
  )

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
      <title>Audit Log - NPMDeck</title>
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
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
          rowsPerPageOptions={AUDIT_LOG_ROWS_PER_PAGE_OPTIONS}
          stickyHeader
          responsive={true}
          cardBreakpoint={LAYOUT.CARD_BREAKPOINT}
          compactBreakpoint={LAYOUT.COMPACT_BREAKPOINT}
        />
      </Box>

      <AuditLogMetaDialog
        open={metaDialogOpen}
        entry={selectedEntry}
        onClose={handleCloseMetaDialog}
      />
    </Container>
  )
}

export default AuditLog
