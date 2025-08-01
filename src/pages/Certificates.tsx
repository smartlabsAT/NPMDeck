import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Container,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  CloudDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  VpnKey as CertificateIcon,
  Folder as ProviderIcon,
  Event as ExpiresIcon,
  Dns as DomainIcon,
  Apps as HostsIcon,
  MoreVert as ActionsIcon,
} from '@mui/icons-material'
import { certificatesApi, Certificate } from '../api/certificates'
import { getErrorMessage } from '../types/common'
import { CertificateWithHosts } from '../types/common'
import { useAuthStore } from '../stores/authStore'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData } from '../hooks/useFilteredData'
import ConfirmDialog from '../components/ConfirmDialog'
import CertificateDrawer from '../components/features/certificates/CertificateDrawer'
import CertificateDetailsDialog from '../components/CertificateDetailsDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'
import { useToast } from '../contexts/ToastContext'
import { DataTable } from '../components/DataTable'
import { TableColumn, Filter, BulkAction, GroupConfig } from '../components/DataTable/types'

// Helper to extract base domain for grouping
const extractBaseDomain = (name: string): string => {
  // First, try to extract domain from name (before any separators)
  const separators = [' - ', ' – ', ' — ', ' | ', ' / ', ' \\ ']
  let domainPart = name
  for (const sep of separators) {
    if (name.includes(sep)) {
      domainPart = name.split(sep)[0].trim()
      break
    }
  }
  
  // Now extract the base domain from the domain part
  // Match domain pattern
  const domainMatch = domainPart.match(/([a-zA-Z0-9][a-zA-Z0-9-]*\.)*([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/)
  if (domainMatch && domainMatch[2]) {
    // Return the base domain (e.g., "mcp.dev" from "api.mcp.dev")
    return domainMatch[2]
  }
  
  // If it looks like a domain, try to extract base domain
  if (domainPart.includes('.')) {
    const parts = domainPart.split('.')
    if (parts.length > 2) {
      // Check for common second-level domains like .co.uk
      const secondLevel = parts[parts.length - 2]
      if (['co', 'com', 'net', 'org', 'gov', 'edu'].includes(secondLevel) && parts.length > 3) {
        return parts.slice(-3).join('.')
      }
      return parts.slice(-2).join('.')
    }
    return domainPart
  }
  
  return name
}

const Certificates = () => {
  const { id, provider } = useParams<{ id?: string; provider?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null)
  const [renewingCerts, setRenewingCerts] = useState<Set<number>>(new Set())
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<Certificate | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null)
  const [initialProvider, setInitialProvider] = useState<'letsencrypt' | 'other'>('letsencrypt')
  
  const { } = useAuthStore()
  const { } = usePermissions()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    loadCertificates()
  }, [])

  // Save grouping preference when DataTable changes it
  useEffect(() => {
    const handleStorageChange = () => {
      // The DataTable will handle the storage internally through the groupConfig
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Handle URL parameters for different actions
  useEffect(() => {
    const loadCertificateForAction = async (certId: number) => {
      try {
        const cert = await certificatesApi.getById(certId, ['owner', 'proxy_hosts', 'redirection_hosts', 'dead_hosts'])
        if (location.pathname.includes('/view')) {
          setViewingCert(cert)
          setDetailsDialogOpen(true)
        }
      } catch (err) {
        showError('certificate', 'load', err instanceof Error ? err.message : 'Unknown error')
        navigate('/security/certificates')
      }
    }

    if (location.pathname.includes('/new')) {
      // New certificate
      setEditingCert(null)
      setDrawerOpen(true)
      // Check if provider is specified in URL
      if (provider === 'letsencrypt' || provider === 'other') {
        setInitialProvider(provider)
      } else {
        setInitialProvider('letsencrypt')
      }
    } else if (id) {
      // Load specific certificate for edit/view
      loadCertificateForAction(parseInt(id))
    } else {
      // No specific action in URL, close all dialogs
      setDrawerOpen(false)
      setDetailsDialogOpen(false)
      setEditingCert(null)
      setViewingCert(null)
    }
  }, [id, provider, location.pathname, navigate, showError])


  const loadCertificates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await certificatesApi.getAll(['owner', 'proxy_hosts', 'redirection_hosts', 'dead_hosts'])
      setCertificates(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Apply visibility filtering
  const visibleCertificates = useFilteredData(certificates)

  const handleDelete = (cert: Certificate) => {
    setCertToDelete(cert)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!certToDelete) return
    
    try {
      await certificatesApi.delete(certToDelete.id)
      showSuccess('certificate', 'deleted', certToDelete.nice_name || certToDelete.domain_names[0], certToDelete.id)
      await loadCertificates()
      setDeleteDialogOpen(false)
      setCertToDelete(null)
    } catch (err: unknown) {
      showError('certificate', 'delete', err instanceof Error ? err.message : 'Unknown error', certToDelete.nice_name || certToDelete.domain_names[0], certToDelete.id)
      setError(getErrorMessage(err))
    }
  }

  const handleRenew = async (cert: Certificate) => {
    if (cert.provider !== 'letsencrypt') return
    
    setRenewingCerts(prev => new Set(prev).add(cert.id))
    
    try {
      await certificatesApi.renew(cert.id)
      showSuccess('certificate', 'renewed', cert.nice_name || cert.domain_names[0], cert.id)
      await loadCertificates()
    } catch (err: unknown) {
      showError('certificate', 'renew', err instanceof Error ? err.message : 'Unknown error', cert.nice_name || cert.domain_names[0], cert.id)
      setError(getErrorMessage(err))
    } finally {
      setRenewingCerts(prev => {
        const newSet = new Set(prev)
        newSet.delete(cert.id)
        return newSet
      })
    }
  }

  const handleDownload = async (cert: Certificate) => {
    try {
      const blob = await certificatesApi.download(cert.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${cert.nice_name || cert.domain_names[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    }
  }

  const handleView = (cert: Certificate) => {
    navigate(`/security/certificates/${cert.id}/view`)
  }

  const handleAddLetsEncrypt = () => {
    setAddMenuAnchor(null)
    navigate('/security/certificates/new/letsencrypt')
  }

  const handleAddCustom = () => {
    setAddMenuAnchor(null)
    navigate('/security/certificates/new/other')
  }



  const getDaysUntilExpiry = (expiresOn: string | null) => {
    if (!expiresOn) return null
    const expiryDate = new Date(expiresOn)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryChip = (cert: Certificate) => {
    const daysUntilExpiry = getDaysUntilExpiry(cert.expires_on)
    
    if (daysUntilExpiry === null) {
      return null
    }
    
    if (daysUntilExpiry < 0) {
      return <Chip label="Expired" color="error" size="small" icon={<WarningIcon />} />
    } else if (daysUntilExpiry <= 7) {
      return <Chip label={`${daysUntilExpiry} days`} color="error" size="small" />
    } else if (daysUntilExpiry <= 30) {
      return <Chip label={`${daysUntilExpiry} days`} color="warning" size="small" />
    } else {
      return <Chip label={`${daysUntilExpiry} days`} color="success" size="small" />
    }
  }

  const getProviderChip = (provider: string) => {
    if (provider === 'letsencrypt') {
      return <Chip label="Let's Encrypt" color="primary" size="small" icon={<LockIcon />} />
    }
    return <Chip label="Custom" color="default" size="small" />
  }

  const getUsageCount = (cert: Certificate) => {
    // Count total usage across proxy hosts, redirection hosts, and dead hosts
    const proxyCount = (cert as CertificateWithHosts).proxy_hosts?.length || 0
    const redirectionCount = (cert as CertificateWithHosts).redirection_hosts?.length || 0
    const deadCount = (cert as CertificateWithHosts).dead_hosts?.length || 0
    return proxyCount + redirectionCount + deadCount
  }

  // Column definitions for DataTable
  const columns: TableColumn<Certificate>[] = [
    {
      id: 'nice_name',
      label: 'Name',
      icon: <CertificateIcon fontSize="small" />,
      accessor: (item) => item.nice_name || item.domain_names[0] || '',
      sortable: true,
      render: (value, item) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" fontWeight="medium">
            {item.nice_name || item.domain_names[0] || 'Unnamed Certificate'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'provider',
      label: 'Provider',
      icon: <ProviderIcon fontSize="small" />,
      accessor: (item) => item.provider,
      sortable: true,
      render: (value, item) => getProviderChip(item.provider)
    },
    {
      id: 'expires_on',
      label: 'Expires',
      icon: <ExpiresIcon fontSize="small" />,
      accessor: (item) => item.expires_on ? new Date(item.expires_on).getTime() : 0,
      sortable: true,
      render: (value, item) => getExpiryChip(item)
    },
    {
      id: 'hosts_using',
      label: 'Hosts Using',
      icon: <HostsIcon fontSize="small" />,
      accessor: (item) => getUsageCount(item),
      sortable: true,
      render: (value) => (
        <Typography variant="body2" color="text.secondary">
          {value} hosts
        </Typography>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <ActionsIcon fontSize="small" />,
      accessor: (item) => item.id,
      sortable: false,
      align: 'right',
      render: (value, item) => (
        <Box display="flex" gap={0.5} justifyContent="flex-end">
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleView(item)
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          {item.provider === 'letsencrypt' && (
            <Tooltip title="Renew">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRenew(item)
                }}
                color="primary"
                disabled={renewingCerts.has(item.id)}
              >
                {renewingCerts.has(item.id) ? (
                  <CircularProgress size={20} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Download">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(item)
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <PermissionIconButton
            resource="certificates"
            permissionAction="delete"
            size="small"
            tooltipTitle="Delete"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(item)
            }}
            color="error"
          >
            <DeleteIcon />
          </PermissionIconButton>
        </Box>
      )
    }
  ]

  // Group configuration
  const groupConfig: GroupConfig<Certificate> = {
    groupBy: (cert) => {
      const certName = cert.nice_name || cert.domain_names[0] || 'Unknown'
      return extractBaseDomain(certName)
    },
    groupLabel: (groupId) => 'Domain',
    defaultEnabled: localStorage.getItem('npm.certificates.groupByDomain') === 'true',
    defaultExpanded: true,
    groupHeaderRender: (groupId, items, isExpanded) => (
      <Box display="flex" alignItems="center" gap={1}>
        <LockIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight="bold">
          {groupId}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ({items.length})
        </Typography>
      </Box>
    )
  }

  // Filter definitions
  const filters: Filter[] = [
    {
      id: 'provider',
      label: 'Provider',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'letsencrypt', label: "Let's Encrypt", icon: <LockIcon fontSize="small" /> },
        { value: 'other', label: 'Custom' }
      ]
    }
  ]

  // Bulk actions
  const bulkActions: BulkAction<Certificate>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      confirmMessage: 'Are you sure you want to delete the selected certificates?',
      action: async (items) => {
        try {
          await Promise.all(items.map(item => certificatesApi.delete(item.id)))
          showSuccess('certificate', 'deleted', `${items.length} certificates`)
          await loadCertificates()
        } catch (err) {
          showError('certificate', 'delete', err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  ]

  return (
    <Container maxWidth={false}>
      <Box py={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <PageHeader
            icon={<CertificateIcon sx={{ color: '#467fcf' }} />}
            title="SSL Certificates"
            description="Manage SSL certificates for secure HTTPS connections"
          />
          <>
            <PermissionButton
              resource="certificates"
              permissionAction="create"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={(e) => setAddMenuAnchor(e.currentTarget)}
            >
              Add SSL Certificate
            </PermissionButton>
            <Menu
              anchorEl={addMenuAnchor}
              open={Boolean(addMenuAnchor)}
              onClose={() => setAddMenuAnchor(null)}
            >
              <MenuItem onClick={handleAddLetsEncrypt}>
                <LockIcon sx={{ mr: 1 }} />
                Let's Encrypt
              </MenuItem>
              <MenuItem onClick={handleAddCustom}>
                Custom
              </MenuItem>
            </Menu>
          </>
        </Box>

        {/* DataTable */}
        <DataTable
          data={visibleCertificates}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          onRowClick={handleView}
          bulkActions={bulkActions}
          filters={filters}
          searchPlaceholder="Search by certificate name, domain, or provider..."
          loading={loading}
          error={error}
          emptyMessage="No SSL certificates configured yet"
          defaultSortField="nice_name"
          defaultSortDirection="asc"
          searchable={true}
          selectable={true}
          showPagination={true}
          defaultRowsPerPage={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          groupConfig={groupConfig}
          showGroupToggle={true}
        />
      </Box>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Certificate?"
        message={`Are you sure you want to delete the certificate "${certToDelete?.nice_name || certToDelete?.domain_names[0]}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />

      <CertificateDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          navigate('/security/certificates')
        }}
        certificate={editingCert}
        onSave={() => {
          loadCertificates()
          navigate('/security/certificates')
        }}
        initialProvider={initialProvider}
      />

      <CertificateDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          navigate('/security/certificates')
        }}
        certificate={viewingCert}
      />
    </Container>
  )
}

export default Certificates