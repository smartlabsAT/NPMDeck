import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  CloudDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
  VpnKey as CertificateIcon,
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

type Order = 'asc' | 'desc'
type OrderBy = 'nice_name' | 'domain_names' | 'provider' | 'expires_on'

interface CertificateGroup {
  id: string
  domain: string
  certificates: Certificate[]
  isExpanded: boolean
}

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

// Generate stable group ID from domain
const generateGroupId = (domain: string): string => {
  return `cert-group-${domain.replace(/\./g, '-')}`
}

const Certificates = () => {
  const { id, provider } = useParams<{ id?: string; provider?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderBy>('nice_name')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null)
  const [renewingCerts, setRenewingCerts] = useState<Set<number>>(new Set())
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<Certificate | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null)
  const [initialProvider, setInitialProvider] = useState<'letsencrypt' | 'other'>('letsencrypt')
  const [groupByDomain, setGroupByDomain] = useState<boolean>(() => {
    const saved = localStorage.getItem('npm.certificates.groupByDomain')
    return saved === 'true'
  })
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('npm.certificates.expandedGroups')
    return saved ? JSON.parse(saved) : {}
  })
  
  const { } = useAuthStore()
  const { } = usePermissions()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    loadCertificates()
  }, [])

  // Handle URL parameters for different actions
  useEffect(() => {
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
    } else if (id && certificates.length > 0) {
      const cert = certificates.find(c => c.id === parseInt(id))
      if (cert) {
        if (location.pathname.includes('/edit')) {
          // Edit certificate
          setEditingCert(cert)
          setDrawerOpen(true)
        } else if (location.pathname.includes('/view')) {
          // View certificate details
          setViewingCert(cert)
          setDetailsDialogOpen(true)
        }
      }
    } else {
      // No specific action in URL, close all dialogs
      setDrawerOpen(false)
      setDetailsDialogOpen(false)
      setEditingCert(null)
      setViewingCert(null)
    }
  }, [id, provider, location.pathname, certificates])

  // Save groupByDomain to localStorage
  useEffect(() => {
    localStorage.setItem('npm.certificates.groupByDomain', groupByDomain.toString())
  }, [groupByDomain])

  // Save expandedGroups to localStorage
  useEffect(() => {
    localStorage.setItem('npm.certificates.expandedGroups', JSON.stringify(expandedGroups))
  }, [expandedGroups])

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

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const getComparator = (order: Order, orderBy: OrderBy): (a: Certificate, b: Certificate) => number => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy)
  }

  const descendingComparator = (a: Certificate, b: Certificate, orderBy: OrderBy) => {
    let aValue: unknown
    let bValue: unknown

    switch (orderBy) {
      case 'nice_name':
        aValue = a.nice_name || a.domain_names[0] || ''
        bValue = b.nice_name || b.domain_names[0] || ''
        break
      case 'domain_names':
        aValue = a.domain_names[0] || ''
        bValue = b.domain_names[0] || ''
        break
      case 'provider':
        aValue = a.provider
        bValue = b.provider
        break
      case 'expires_on':
        aValue = a.expires_on ? new Date(a.expires_on).getTime() : 0
        bValue = b.expires_on ? new Date(b.expires_on).getTime() : 0
        break
      default:
        return 0
    }

    if ((bValue as any) < (aValue as any)) return -1
    if ((bValue as any) > (aValue as any)) return 1
    return 0
  }

  // Apply visibility filtering first
  const visibleCertificates = useFilteredData(certificates)
  
  // Then apply search filtering
  const filteredCertificates = visibleCertificates.filter(cert => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (cert.nice_name && cert.nice_name.toLowerCase().includes(query)) ||
      cert.domain_names.some(domain => domain.toLowerCase().includes(query)) ||
      cert.provider.toLowerCase().includes(query)
    )
  })

  const sortedCertificates = [...filteredCertificates].sort(getComparator(order, orderBy))

  // Create certificate groups
  const certificateGroups: CertificateGroup[] = []
  const groupMap = new Map<string, CertificateGroup>()
  
  if (groupByDomain) {
    sortedCertificates.forEach(cert => {
      // Use the certificate's nice_name for grouping
      const certName = cert.nice_name || cert.domain_names[0] || 'Unknown'
      const baseDomain = extractBaseDomain(certName)
      const groupId = generateGroupId(baseDomain)
      
      if (!groupMap.has(groupId)) {
        const group: CertificateGroup = {
          id: groupId,
          domain: baseDomain,
          certificates: [],
          isExpanded: expandedGroups[groupId] !== false // Default to expanded
        }
        groupMap.set(groupId, group)
        certificateGroups.push(group)
      }
      
      groupMap.get(groupId)!.certificates.push(cert)
    })
    
    // Sort groups based on current sort settings
    if (orderBy === 'domain_names') {
      certificateGroups.sort((a, b) => {
        const compare = a.domain.localeCompare(b.domain)
        return order === 'asc' ? compare : -compare
      })
    } else {
      // For other sort fields, sort by the first certificate's value in each group
      certificateGroups.sort((a, b) => {
        const aCert = a.certificates[0]
        const bCert = b.certificates[0]
        if (!aCert || !bCert) return 0
        
        const comparator = descendingComparator(aCert, bCert, orderBy)
        return order === 'desc' ? comparator : -comparator
      })
    }
  }

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

  const handleEdit = (cert: Certificate) => {
    navigate(`/security/certificates/${cert.id}/edit`)
  }

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const toggleAllGroups = (expand: boolean) => {
    const newExpanded: Record<string, boolean> = {}
    certificateGroups.forEach(group => {
      newExpanded[group.id] = expand
    })
    setExpandedGroups(newExpanded)
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box p={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by certificate name, domain, or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={groupByDomain}
                onChange={(e) => setGroupByDomain(e.target.checked)}
              />
            }
            label="Group by Domain"
          />
          {groupByDomain && certificateGroups.length > 0 && (
            <>
              <IconButton
                size="small"
                onClick={() => toggleAllGroups(true)}
                title="Expand All"
              >
                <ExpandAllIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => toggleAllGroups(false)}
                title="Collapse All"
              >
                <CollapseAllIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'nice_name'}
                  direction={orderBy === 'nice_name' ? order : 'asc'}
                  onClick={() => handleRequestSort('nice_name')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Name</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'domain_names'}
                  direction={orderBy === 'domain_names' ? order : 'asc'}
                  onClick={() => handleRequestSort('domain_names')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Domain Names</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'provider'}
                  direction={orderBy === 'provider' ? order : 'asc'}
                  onClick={() => handleRequestSort('provider')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Provider</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'expires_on'}
                  direction={orderBy === 'expires_on' ? order : 'asc'}
                  onClick={() => handleRequestSort('expires_on')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Expires</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">Hosts Using</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCertificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  {searchQuery ? 'No certificates found matching your search.' : 'No SSL certificates configured yet.'}
                </TableCell>
              </TableRow>
            ) : groupByDomain ? (
              // Grouped view
              certificateGroups.map((group) => (
                <React.Fragment key={group.id}>
                  {/* Group header row */}
                  <TableRow 
                    sx={{ 
                      backgroundColor: 'action.hover',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.selected' }
                    }}
                    onClick={() => toggleGroupExpanded(group.id)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          {group.isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                        </IconButton>
                        <LockIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {group.domain} ({group.certificates.length})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  
                  {/* Certificate rows */}
                  {group.isExpanded && group.certificates.map((cert) => (
                    <TableRow 
                      key={cert.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleView(cert)}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1} pl={6}>
                          <Box sx={{ 
                            width: 2, 
                            height: 20, 
                            backgroundColor: 'divider',
                            mr: 1 
                          }} />
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                          >
                            {cert.nice_name || cert.domain_names[0] || 'Unnamed Certificate'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {cert.domain_names.slice(0, 2).map((domain, index) => (
                            <Typography key={index} variant="body2" color="text.secondary">
                              {domain}
                            </Typography>
                          ))}
                          {cert.domain_names.length > 2 && (
                            <Typography variant="body2" color="text.secondary">
                              +{cert.domain_names.length - 2} more
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{getProviderChip(cert.provider)}</TableCell>
                      <TableCell>{getExpiryChip(cert)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {getUsageCount(cert)} hosts
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleView(cert)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                            {cert.provider === 'letsencrypt' && (
                              <Tooltip title="Renew">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                  e.stopPropagation()
                                  handleRenew(cert)
                                }}
                                  color="primary"
                                  disabled={renewingCerts.has(cert.id)}
                                >
                                  {renewingCerts.has(cert.id) ? (
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
                                  handleDownload(cert)
                                }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          <PermissionIconButton
                            resource="certificates"
                            permissionAction="edit"
                            size="small"
                            tooltipTitle="Edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(cert)
                            }}
                            color="primary"
                          >
                            <EditIcon />
                          </PermissionIconButton>
                          <PermissionIconButton
                            resource="certificates"
                            permissionAction="delete"
                            size="small"
                            tooltipTitle="Delete"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cert)
                            }}
                            color="error"
                          >
                            <DeleteIcon />
                          </PermissionIconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            ) : (
              // Flat view
              sortedCertificates.map((cert) => (
                <TableRow 
                  key={cert.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleView(cert)}
                >
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                    >
                      {cert.nice_name || cert.domain_names[0] || 'Unnamed Certificate'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {cert.domain_names.slice(0, 2).map((domain, index) => (
                        <Typography key={index} variant="body2" color="text.secondary">
                          {domain}
                        </Typography>
                      ))}
                      {cert.domain_names.length > 2 && (
                        <Typography variant="body2" color="text.secondary">
                          +{cert.domain_names.length - 2} more
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{getProviderChip(cert.provider)}</TableCell>
                  <TableCell>{getExpiryChip(cert)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {getUsageCount(cert)} hosts
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleView(cert)
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {cert.provider === 'letsencrypt' && (
                          <Tooltip title="Renew">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRenew(cert)
                              }}
                              color="primary"
                              disabled={renewingCerts.has(cert.id)}
                            >
                              {renewingCerts.has(cert.id) ? (
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
                              handleDownload(cert)
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <PermissionIconButton
                          resource="certificates"
                          permissionAction="edit"
                          size="small"
                          tooltipTitle="Edit"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(cert)
                          }}
                          color="primary"
                        >
                          <EditIcon />
                        </PermissionIconButton>
                        <PermissionIconButton
                          resource="certificates"
                          permissionAction="delete"
                          size="small"
                          tooltipTitle="Delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(cert)
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </PermissionIconButton>
                      </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
        onEdit={(cert) => {
          navigate(`/security/certificates/${cert.id}/edit`)
        }}
      />
    </Box>
  )
}

export default Certificates