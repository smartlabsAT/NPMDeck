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
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PowerSettingsNew as PowerIcon,
  Language as LanguageIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
  TrendingFlat as RedirectIcon,
  SwapHoriz as ProxyIcon,
} from '@mui/icons-material'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { useAuthStore } from '../stores/authStore'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData, useFilteredInfo } from '../hooks/useFilteredData'
import ProxyHostDrawer from '../components/ProxyHostDrawer'
import ProxyHostDetailsDialog from '../components/ProxyHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PageHeader from '../components/PageHeader'
import PermissionIconButton from '../components/PermissionIconButton'

type Order = 'asc' | 'desc'
type OrderBy = 'status' | 'domain_names' | 'forward_host' | 'ssl' | 'access'

interface DomainGroup {
  id: string
  domain: string
  hosts: ProxyHost[]
  isExpanded: boolean
}

// Helper to extract base domain from a full domain
const extractBaseDomain = (domain: string): string => {
  // Remove subdomain parts, keep only base domain
  const parts = domain.split('.')
  if (parts.length > 2) {
    // Check for common second-level domains like .co.uk
    const secondLevel = parts[parts.length - 2]
    if (['co', 'com', 'net', 'org', 'gov', 'edu'].includes(secondLevel) && parts.length > 3) {
      return parts.slice(-3).join('.')
    }
    return parts.slice(-2).join('.')
  }
  return domain
}

// Generate stable group ID from domain
const generateGroupId = (domain: string): string => {
  return `group-${domain.replace(/\./g, '-')}`
}

const ProxyHosts = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [hosts, setHosts] = useState<ProxyHost[]>([])
  const [_redirectionHosts, setRedirectionHosts] = useState<RedirectionHost[]>([])
  const [redirectionsByTarget, setRedirectionsByTarget] = useState<Map<string, RedirectionHost[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<ProxyHost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hostToDelete, setHostToDelete] = useState<ProxyHost | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingHost, setViewingHost] = useState<ProxyHost | null>(null)
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderBy>('domain_names')
  const [groupByDomain, setGroupByDomain] = useState<boolean>(() => {
    const saved = localStorage.getItem('npm.proxyHosts.groupByDomain')
    return saved === 'true'
  })
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('npm.proxyHosts.expandedGroups')
    return saved ? JSON.parse(saved) : {}
  })
  
  const { } = useAuthStore()
  const { } = usePermissions()

  useEffect(() => {
    loadHosts()
  }, [])

  // Handle URL parameter for editing or viewing
  useEffect(() => {
    // Handle new host creation
    if (location.pathname.includes('/new')) {
      setEditingHost(null)
      setDrawerOpen(true)
      setDetailsDialogOpen(false)
      setViewingHost(null)
    } else if (id) {
      // Wait for hosts to load
      if (loading) {
        return
      }
      
      const host = hosts.find(h => h.id === parseInt(id))
      if (host) {
        if (location.pathname.includes('/edit')) {
          setEditingHost(host)
          setDrawerOpen(true)
          setDetailsDialogOpen(false)
          setViewingHost(null)
        } else if (location.pathname.includes('/view')) {
          setViewingHost(host)
          setDetailsDialogOpen(true)
          setDrawerOpen(false)
          setEditingHost(null)
        }
      } else if (hosts.length > 0) {
        // Host not found after loading (but other hosts exist)
        console.error(`Proxy host with id ${id} not found`)
        navigate('/hosts/proxy')
      }
      // If hosts.length === 0, we'll wait for hosts to load
    } else {
      // No ID in URL, close dialogs
      setDrawerOpen(false)
      setEditingHost(null)
      setDetailsDialogOpen(false)
      setViewingHost(null)
    }
  }, [id, hosts, location.pathname, navigate, loading])

  // Save groupByDomain to localStorage
  useEffect(() => {
    localStorage.setItem('npm.proxyHosts.groupByDomain', groupByDomain.toString())
  }, [groupByDomain])

  // Save expandedGroups to localStorage
  useEffect(() => {
    localStorage.setItem('npm.proxyHosts.expandedGroups', JSON.stringify(expandedGroups))
  }, [expandedGroups])

  const loadHosts = async () => {
    try {
      setLoading(true)
      setError(null)
      // Load both proxy hosts and redirection hosts
      const [proxyData, redirectionData] = await Promise.all([
        proxyHostsApi.getAll(['owner', 'access_list', 'certificate']),
        redirectionHostsApi.getAll()
      ])
      
      setHosts(proxyData)
      setRedirectionHosts(redirectionData)
      
      // Create lookup map for redirections by target domain
      const targetMap = new Map<string, RedirectionHost[]>()
      redirectionData.forEach(redirect => {
        const target = redirect.forward_domain_name.toLowerCase()
        if (!targetMap.has(target)) {
          targetMap.set(target, [])
        }
        targetMap.get(target)!.push(redirect)
      })
      setRedirectionsByTarget(targetMap)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load hosts')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (host: ProxyHost) => {
    try {
      if (host.enabled) {
        await proxyHostsApi.disable(host.id)
      } else {
        await proxyHostsApi.enable(host.id)
      }
      // Reload to get updated status
      await loadHosts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle host status')
    }
  }

  const handleEdit = (host: ProxyHost) => {
    navigate(`/hosts/proxy/${host.id}/edit`)
  }

  const handleView = (host: ProxyHost) => {
    navigate(`/hosts/proxy/${host.id}/view`)
  }

  const handleAdd = () => {
    setEditingHost(null)
    navigate('/hosts/proxy/new')
  }

  const handleDelete = (host: ProxyHost) => {
    setHostToDelete(host)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!hostToDelete) return
    
    try {
      await proxyHostsApi.delete(hostToDelete.id)
      await loadHosts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete proxy host')
    }
  }

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const toggleAllGroups = (expand: boolean) => {
    const newExpanded: Record<string, boolean> = {}
    domainGroups.forEach(group => {
      newExpanded[group.id] = expand
    })
    setExpandedGroups(newExpanded)
  }

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const getComparator = (order: Order, orderBy: OrderBy): (a: ProxyHost, b: ProxyHost) => number => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy)
  }

  const descendingComparator = (a: ProxyHost, b: ProxyHost, orderBy: OrderBy) => {
    let aValue: any
    let bValue: any

    switch (orderBy) {
      case 'status':
        aValue = !a.enabled ? 0 : (a.meta.nginx_online === false ? 1 : 2)
        bValue = !b.enabled ? 0 : (b.meta.nginx_online === false ? 1 : 2)
        break
      case 'domain_names':
        aValue = a.domain_names[0] || ''
        bValue = b.domain_names[0] || ''
        break
      case 'forward_host':
        aValue = `${a.forward_scheme}://${a.forward_host}:${a.forward_port}`
        bValue = `${b.forward_scheme}://${b.forward_host}:${b.forward_port}`
        break
      case 'ssl':
        aValue = !a.certificate_id ? 0 : (a.ssl_forced ? 2 : 1)
        bValue = !b.certificate_id ? 0 : (b.ssl_forced ? 2 : 1)
        break
      case 'access':
        aValue = a.access_list?.name || ''
        bValue = b.access_list?.name || ''
        break
      default:
        return 0
    }

    if (bValue < aValue) return -1
    if (bValue > aValue) return 1
    return 0
  }

  // Apply visibility filtering first
  const visibleHosts = useFilteredData(hosts)
  const filterInfo = useFilteredInfo(hosts, visibleHosts)
  
  // Then apply search filtering
  const filteredHosts = visibleHosts.filter(host => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      host.domain_names.some(domain => domain.toLowerCase().includes(query)) ||
      host.forward_host.toLowerCase().includes(query) ||
      host.forward_port.toString().includes(query)
    )
  })

  const sortedHosts = [...filteredHosts].sort(getComparator(order, orderBy))

  // Create domain groups
  const domainGroups: DomainGroup[] = []
  const groupMap = new Map<string, DomainGroup>()
  
  if (groupByDomain) {
    sortedHosts.forEach(host => {
      const mainDomain = host.domain_names[0] || ''
      const baseDomain = extractBaseDomain(mainDomain)
      const groupId = generateGroupId(baseDomain)
      
      if (!groupMap.has(groupId)) {
        const group: DomainGroup = {
          id: groupId,
          domain: baseDomain,
          hosts: [],
          isExpanded: expandedGroups[groupId] !== false // Default to expanded
        }
        groupMap.set(groupId, group)
        domainGroups.push(group)
      }
      
      groupMap.get(groupId)!.hosts.push(host)
    })
    
    // Sort groups based on current sort settings
    if (orderBy === 'domain_names') {
      domainGroups.sort((a, b) => {
        const compare = a.domain.localeCompare(b.domain)
        return order === 'asc' ? compare : -compare
      })
    } else {
      // For other sort fields, sort by the first host's value in each group
      domainGroups.sort((a, b) => {
        const aHost = a.hosts[0]
        const bHost = b.hosts[0]
        if (!aHost || !bHost) return 0
        
        const comparator = descendingComparator(aHost, bHost, orderBy)
        return order === 'desc' ? comparator : -comparator
      })
    }
  }

  const getStatusIcon = (host: ProxyHost) => {
    if (!host.enabled) {
      return <Tooltip title="Disabled"><CancelIcon color="disabled" /></Tooltip>
    }
    if (host.meta.nginx_online === false) {
      return <Tooltip title={host.meta.nginx_err || 'Offline'}><CancelIcon color="error" /></Tooltip>
    }
    return <Tooltip title="Online"><CheckCircleIcon color="success" /></Tooltip>
  }

  const getSSLIcon = (host: ProxyHost) => {
    if (!host.certificate_id) {
      return <Tooltip title="No SSL"><LockOpenIcon color="disabled" /></Tooltip>
    }
    if (host.ssl_forced) {
      return <Tooltip title="SSL Forced"><LockIcon color="primary" /></Tooltip>
    }
    return <Tooltip title="SSL Optional"><LockIcon color="action" /></Tooltip>
  }

  const getLinkedRedirections = (host: ProxyHost): RedirectionHost[] => {
    const redirections: RedirectionHost[] = []
    host.domain_names.forEach(domain => {
      const domainRedirections = redirectionsByTarget.get(domain.toLowerCase()) || []
      redirections.push(...domainRedirections)
    })
    // Remove duplicates
    return Array.from(new Set(redirections.map(r => r.id))).map(id => 
      redirections.find(r => r.id === id)!
    )
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
          icon={<ProxyIcon sx={{ color: '#5eba00' }} />}
          title="Proxy Hosts"
          description="Manage reverse proxy configurations for your web services"
        />
        <PermissionButton
          resource="proxy_hosts"
          permissionAction="create"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Proxy Host
        </PermissionButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filterInfo.isFiltered && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Zeige {filterInfo.visibleCount} von {filterInfo.totalCount} Proxy Hosts 
          (nur eigene Einträge werden angezeigt)
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box p={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by domain name, forward host, or port..."
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
          {groupByDomain && domainGroups.length > 0 && (
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
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Status</Typography>
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
                  active={orderBy === 'forward_host'}
                  direction={orderBy === 'forward_host' ? order : 'asc'}
                  onClick={() => handleRequestSort('forward_host')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Forward Host</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'ssl'}
                  direction={orderBy === 'ssl' ? order : 'asc'}
                  onClick={() => handleRequestSort('ssl')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">SSL</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'access'}
                  direction={orderBy === 'access' ? order : 'asc'}
                  onClick={() => handleRequestSort('access')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Access</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedHosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  {searchQuery ? 'No proxy hosts found matching your search.' : 'No proxy hosts configured yet.'}
                </TableCell>
              </TableRow>
            ) : groupByDomain ? (
              // Grouped view
              domainGroups.map((group) => (
                <React.Fragment key={group.id}>
                  {/* Group header row */}
                  <TableRow 
                    key={group.id}
                    sx={{ 
                      backgroundColor: 'action.hover',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.selected' }
                    }}
                    onClick={() => toggleGroupExpanded(group.id)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          {group.isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LanguageIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {group.domain} ({group.hosts.length})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  
                  {/* Host rows */}
                  {group.isExpanded && group.hosts.map((host) => (
                    <TableRow 
                      key={host.id}
                      hover
                      sx={{ 
                        '& > td:first-of-type': { pl: 6 },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleView(host)}
                    >
                      <TableCell>{getStatusIcon(host)}</TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} pl={2}>
                            <Box sx={{ 
                              width: 2, 
                              height: 20, 
                              backgroundColor: 'divider',
                              mr: 1 
                            }} />
                            <Box>
                              {host.domain_names.map((domain, index) => (
                                <div key={index}>
                                  <Typography 
                                    variant="body2"
                                    sx={{ 
                                      cursor: 'pointer',
                                      '&:hover': { 
                                        textDecoration: 'underline',
                                        color: 'primary.main'
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.open(`https://${domain}`, '_blank')
                                    }}
                                  >
                                    {domain}
                                  </Typography>
                                </div>
                              ))}
                            </Box>
                          </Box>
                          {(() => {
                            const linkedRedirections = getLinkedRedirections(host)
                            if (linkedRedirections.length > 0) {
                              return (
                                <Tooltip 
                                  title={
                                    <Box>
                                      {linkedRedirections.map((redirect, idx) => (
                                        <div key={idx}>
                                          {redirect.domain_names.join(', ')} → {redirect.forward_domain_name}
                                        </div>
                                      ))}
                                    </Box>
                                  }
                                >
                                  <Box 
                                    display="flex" 
                                    alignItems="center" 
                                    gap={0.5} 
                                    ml={5}
                                    sx={{ 
                                      cursor: 'pointer',
                                      '&:hover': { opacity: 0.8 }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (linkedRedirections.length === 1) {
                                        // Navigate to the redirection host overview
                                        navigate(`/hosts/redirection/${linkedRedirections[0].id}/view/overview`)
                                      } else {
                                        // Open this proxy host's details with connections tab
                                        setViewingHost(host)
                                        setDetailsDialogOpen(true)
                                        navigate(`/hosts/proxy/${host.id}/view/connections`)
                                      }
                                    }}
                                  >
                                    <Typography variant="caption" color="text.secondary">↳</Typography>
                                    <RedirectIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="action" />
                                    <Typography variant="caption" color="primary">
                                      {linkedRedirections.length} Redirection{linkedRedirections.length > 1 ? 's' : ''}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )
                            }
                            return null
                          })()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {host.forward_scheme}://{host.forward_host}:{host.forward_port}
                        </Typography>
                      </TableCell>
                      <TableCell>{getSSLIcon(host)}</TableCell>
                      <TableCell>
                        {host.access_list ? (
                          <Chip 
                            label={host.access_list.name} 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewingHost(host)
                              setDetailsDialogOpen(true)
                              navigate(`/hosts/proxy/${host.id}/view/access`)
                            }}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              }
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Public
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <PermissionIconButton
                            resource="proxy_hosts"
                            permissionAction="edit"
                            size="small"
                            tooltipTitle={host.enabled ? 'Disable' : 'Enable'}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleEnabled(host)
                            }}
                            color={host.enabled ? 'default' : 'success'}
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
                              handleEdit(host)
                            }}
                            color="primary"
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
                              handleDelete(host)
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
              sortedHosts.map((host) => (
                <TableRow 
                  key={host.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleView(host)}
                >
                  <TableCell>{getStatusIcon(host)}</TableCell>
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LanguageIcon fontSize="small" color="action" />
                        <Box>
                          {host.domain_names.map((domain, index) => (
                            <div key={index}>
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': { 
                                    textDecoration: 'underline',
                                    color: 'primary.main'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`https://${domain}`, '_blank')
                                }}
                              >
                                {domain}
                              </Typography>
                            </div>
                          ))}
                        </Box>
                      </Box>
                      {(() => {
                        const linkedRedirections = getLinkedRedirections(host)
                        if (linkedRedirections.length > 0) {
                          return (
                            <Tooltip 
                              title={
                                <Box>
                                  {linkedRedirections.map((redirect, idx) => (
                                    <div key={idx}>
                                      {redirect.domain_names.join(', ')} → {redirect.forward_domain_name}
                                    </div>
                                  ))}
                                </Box>
                              }
                            >
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                gap={0.5} 
                                ml={3}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': { opacity: 0.8 }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (linkedRedirections.length === 1) {
                                    // Navigate to the redirection host overview
                                    navigate(`/hosts/redirection/${linkedRedirections[0].id}/view/overview`)
                                  } else {
                                    // Open this proxy host's details with connections tab
                                    setViewingHost(host)
                                    setDetailsDialogOpen(true)
                                    navigate(`/hosts/proxy/${host.id}/view/connections`)
                                  }
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">↳</Typography>
                                <RedirectIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="action" />
                                <Typography variant="caption" color="primary">
                                  {linkedRedirections.length} Redirection{linkedRedirections.length > 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </Tooltip>
                          )
                        }
                        return null
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {host.forward_scheme}://{host.forward_host}:{host.forward_port}
                    </Typography>
                  </TableCell>
                  <TableCell>{getSSLIcon(host)}</TableCell>
                  <TableCell>
                    {host.access_list ? (
                      <Chip 
                        label={host.access_list.name} 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          setViewingHost(host)
                          setDetailsDialogOpen(true)
                          navigate(`/hosts/proxy/${host.id}/view/access`)
                        }}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Public
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <PermissionIconButton
                        resource="proxy_hosts"
                        permissionAction="edit"
                        size="small"
                        tooltipTitle={host.enabled ? 'Disable' : 'Enable'}
                        onClick={() => handleToggleEnabled(host)}
                        color={host.enabled ? 'default' : 'success'}
                      >
                        <PowerIcon />
                      </PermissionIconButton>
                      <PermissionIconButton
                        resource="proxy_hosts"
                        permissionAction="edit"
                        size="small"
                        tooltipTitle="Edit"
                        onClick={() => handleEdit(host)}
                        color="primary"
                      >
                        <EditIcon />
                      </PermissionIconButton>
                      <PermissionIconButton
                        resource="proxy_hosts"
                        permissionAction="delete"
                        size="small"
                        tooltipTitle="Delete"
                        onClick={() => handleDelete(host)}
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

      <ProxyHostDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          navigate('/hosts/proxy')
        }}
        host={editingHost}
        onSave={() => {
          loadHosts()
          navigate('/hosts/proxy')
        }}
      />

      <ProxyHostDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          // Clear the URL parameter when closing
          if (id) {
            navigate('/hosts/proxy')
          }
        }}
        host={viewingHost}
        onEdit={handleEdit}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Proxy Host?"
        message={`Are you sure you want to delete the proxy host for ${hostToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  )
}

export default ProxyHosts