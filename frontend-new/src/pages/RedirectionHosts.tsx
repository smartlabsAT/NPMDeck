import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
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
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { redirectionHostsApi, RedirectionHost } from '../api/redirectionHosts'
import { proxyHostsApi, ProxyHost } from '../api/proxyHosts'
import { useAuthStore } from '../stores/authStore'
import { usePermissions } from '../hooks/usePermissions'
import { useFilteredData, useFilteredInfo } from '../hooks/useFilteredData'
import RedirectionHostDrawer from '../components/RedirectionHostDrawer'
import RedirectionHostDetailsDialog from '../components/RedirectionHostDetailsDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import PermissionButton from '../components/PermissionButton'
import PermissionIconButton from '../components/PermissionIconButton'
import PageHeader from '../components/PageHeader'

type Order = 'asc' | 'desc'
type OrderBy = 'status' | 'domain_names' | 'forward_domain' | 'http_code' | 'ssl'

interface DomainGroup {
  id: string
  domain: string
  hosts: RedirectionHost[]
  isExpanded: boolean
}

// Helper to extract base domain from a full domain
const extractBaseDomain = (domain: string): string => {
  const parts = domain.split('.')
  if (parts.length > 2) {
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

const getHttpStatusLabel = (code: number): string => {
  const statusMap: { [key: number]: string } = {
    300: '300 Multiple Choices',
    301: '301 Moved Permanently',
    302: '302 Found',
    303: '303 See Other',
    307: '307 Temporary Redirect',
    308: '308 Permanent Redirect',
  }
  return statusMap[code] || code.toString()
}

const RedirectionHosts = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [hosts, setHosts] = useState<RedirectionHost[]>([])
  const [proxyHosts, setProxyHosts] = useState<ProxyHost[]>([])
  const [proxyHostsByDomain, setProxyHostsByDomain] = useState<Map<string, ProxyHost>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<RedirectionHost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hostToDelete, setHostToDelete] = useState<RedirectionHost | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingHost, setViewingHost] = useState<RedirectionHost | null>(null)
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderBy>('domain_names')
  const [groupByDomain, setGroupByDomain] = useState<boolean>(() => {
    const saved = localStorage.getItem('npm.redirectionHosts.groupByDomain')
    return saved === 'true'
  })
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('npm.redirectionHosts.expandedGroups')
    return saved ? JSON.parse(saved) : {}
  })
  
  const { user, shouldFilterByUser } = useAuthStore()
  const { canView, canManage: canManageRedirectionHosts, isAdmin } = usePermissions()

  useEffect(() => {
    loadHosts()
  }, [])

  // Handle URL parameter for editing or viewing
  useEffect(() => {
    if (location.pathname.includes('/new') && canManageRedirectionHosts('redirection_hosts')) {
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
        if (location.pathname.includes('/edit') && canManageRedirectionHosts('redirection_hosts')) {
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
        console.error(`Redirection host with id ${id} not found`)
        navigate('/hosts/redirection')
      }
      // If hosts.length === 0, we'll wait for hosts to load
    } else {
      // No ID in URL, close dialogs
      setDrawerOpen(false)
      setEditingHost(null)
      setDetailsDialogOpen(false)
      setViewingHost(null)
    }
  }, [id, hosts, location.pathname, navigate, loading, canManageRedirectionHosts])

  // Save groupByDomain to localStorage
  useEffect(() => {
    localStorage.setItem('npm.redirectionHosts.groupByDomain', groupByDomain.toString())
  }, [groupByDomain])

  // Save expandedGroups to localStorage
  useEffect(() => {
    localStorage.setItem('npm.redirectionHosts.expandedGroups', JSON.stringify(expandedGroups))
  }, [expandedGroups])

  const loadHosts = async () => {
    try {
      setLoading(true)
      setError(null)
      // Load both redirection hosts and proxy hosts
      const [redirectionData, proxyData] = await Promise.all([
        redirectionHostsApi.getAll(['owner', 'certificate']),
        proxyHostsApi.getAll()
      ])
      
      setHosts(redirectionData)
      setProxyHosts(proxyData)
      
      // Create lookup map for proxy hosts by domain
      const domainMap = new Map<string, ProxyHost>()
      proxyData.forEach(host => {
        host.domain_names.forEach(domain => {
          domainMap.set(domain.toLowerCase(), host)
        })
      })
      setProxyHostsByDomain(domainMap)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load hosts')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (host: RedirectionHost) => {
    try {
      if (host.enabled) {
        await redirectionHostsApi.disable(host.id)
      } else {
        await redirectionHostsApi.enable(host.id)
      }
      await loadHosts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle host status')
    }
  }

  const handleEdit = (host: RedirectionHost) => {
    navigate(`/hosts/redirection/${host.id}/edit`)
  }

  const handleView = (host: RedirectionHost) => {
    navigate(`/hosts/redirection/${host.id}/view`)
  }

  const handleAdd = () => {
    setEditingHost(null)
    navigate('/hosts/redirection/new')
  }

  const handleDelete = (host: RedirectionHost) => {
    setHostToDelete(host)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!hostToDelete) return
    
    try {
      await redirectionHostsApi.delete(hostToDelete.id)
      await loadHosts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete redirection host')
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

  const getComparator = (order: Order, orderBy: OrderBy): (a: RedirectionHost, b: RedirectionHost) => number => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy)
  }

  const descendingComparator = (a: RedirectionHost, b: RedirectionHost, orderBy: OrderBy) => {
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
      case 'forward_domain':
        aValue = `${a.forward_scheme}://${a.forward_domain_name}`
        bValue = `${b.forward_scheme}://${b.forward_domain_name}`
        break
      case 'http_code':
        aValue = a.forward_http_code
        bValue = b.forward_http_code
        break
      case 'ssl':
        aValue = !a.certificate_id ? 0 : (a.ssl_forced ? 2 : 1)
        bValue = !b.certificate_id ? 0 : (b.ssl_forced ? 2 : 1)
        break
      default:
        return 0
    }

    if (bValue < aValue) return -1
    if (bValue > aValue) return 1
    return 0
  }

  // Apply visibility filtering first
  const visibleHosts = useFilteredData(hosts, 'redirection_hosts')
  const filterInfo = useFilteredInfo(hosts, visibleHosts)
  
  // Then apply search filtering
  const filteredHosts = visibleHosts.filter(host => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      host.domain_names.some(domain => domain.toLowerCase().includes(query)) ||
      host.forward_domain_name.toLowerCase().includes(query)
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
          isExpanded: expandedGroups[groupId] !== false
        }
        groupMap.set(groupId, group)
        domainGroups.push(group)
      }
      
      groupMap.get(groupId)!.hosts.push(host)
    })
    
    if (orderBy === 'domain_names') {
      domainGroups.sort((a, b) => {
        const compare = a.domain.localeCompare(b.domain)
        return order === 'asc' ? compare : -compare
      })
    } else {
      domainGroups.sort((a, b) => {
        const aHost = a.hosts[0]
        const bHost = b.hosts[0]
        if (!aHost || !bHost) return 0
        
        const comparator = descendingComparator(aHost, bHost, orderBy)
        return order === 'desc' ? comparator : -comparator
      })
    }
  }

  const getStatusIcon = (host: RedirectionHost) => {
    if (!host.enabled) {
      return <Tooltip title="Disabled"><CancelIcon color="disabled" /></Tooltip>
    }
    if (host.meta.nginx_online === false) {
      return <Tooltip title={host.meta.nginx_err || 'Offline'}><CancelIcon color="error" /></Tooltip>
    }
    return <Tooltip title="Online"><CheckCircleIcon color="success" /></Tooltip>
  }

  const getSSLIcon = (host: RedirectionHost) => {
    if (!host.certificate_id) {
      return <Tooltip title="No SSL"><LockOpenIcon color="disabled" /></Tooltip>
    }
    if (host.ssl_forced) {
      return <Tooltip title="SSL Forced"><LockIcon color="primary" /></Tooltip>
    }
    return <Tooltip title="SSL Optional"><LockIcon color="action" /></Tooltip>
  }

  const getLinkedProxyHost = (forwardDomain: string): ProxyHost | undefined => {
    return proxyHostsByDomain.get(forwardDomain.toLowerCase())
  }

  const handleViewProxyHost = (proxyHost: ProxyHost, event: React.MouseEvent) => {
    event.stopPropagation()
    // Navigate to proxy host overview
    navigate(`/hosts/proxy/${proxyHost.id}/view/overview`)
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
          icon={<RedirectIcon sx={{ color: '#f1c40f' }} />}
          title="Redirection Hosts"
          description="Configure permanent redirects from one domain to another"
        />
        <PermissionButton
          resource="redirection_hosts"
          action="create"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Redirection Host
        </PermissionButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filterInfo.isFiltered && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing {filterInfo.visibleCount} of {filterInfo.totalCount} redirection hosts 
          (only your own entries are displayed)
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box p={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by domain name or forward domain..."
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
                  <Typography variant="subtitle2" fontWeight="bold">Source Domains</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'forward_domain'}
                  direction={orderBy === 'forward_domain' ? order : 'asc'}
                  onClick={() => handleRequestSort('forward_domain')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">Destination</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'http_code'}
                  direction={orderBy === 'http_code' ? order : 'asc'}
                  onClick={() => handleRequestSort('http_code')}
                >
                  <Typography variant="subtitle2" fontWeight="bold">HTTP Code</Typography>
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
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedHosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  {searchQuery ? 'No redirection hosts found matching your search.' : 'No redirection hosts configured yet.'}
                </TableCell>
              </TableRow>
            ) : groupByDomain ? (
              // Grouped view
              domainGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <TableRow 
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
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <RedirectIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {host.forward_scheme}://{host.forward_domain_name}
                            </Typography>
                          </Box>
                          {(() => {
                            const linkedProxy = getLinkedProxyHost(host.forward_domain_name)
                            if (linkedProxy) {
                              return (
                                <Box 
                                  display="flex" 
                                  alignItems="center" 
                                  gap={0.5} 
                                  ml={3}
                                  sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 }
                                  }}
                                  onClick={(e) => handleViewProxyHost(linkedProxy, e)}
                                >
                                  <Typography variant="caption" color="text.secondary">↳</Typography>
                                  <ProxyIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="action" />
                                  <Typography variant="caption" color="primary">
                                    Proxy Host
                                  </Typography>
                                </Box>
                              )
                            }
                            return null
                          })()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getHttpStatusLabel(host.forward_http_code)} 
                          size="small"
                          color={host.forward_http_code >= 300 && host.forward_http_code < 400 ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{getSSLIcon(host)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleView(host)
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <PermissionIconButton
                            resource="redirection_hosts"
                            action="edit"
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
                            resource="redirection_hosts"
                            action="edit"
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
                            resource="redirection_hosts"
                            action="delete"
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
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <RedirectIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {host.forward_scheme}://{host.forward_domain_name}
                        </Typography>
                      </Box>
                      {(() => {
                        const linkedProxy = getLinkedProxyHost(host.forward_domain_name)
                        if (linkedProxy) {
                          return (
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={0.5} 
                              ml={3}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              onClick={(e) => handleViewProxyHost(linkedProxy, e)}
                            >
                              <Typography variant="caption" color="text.secondary">↳</Typography>
                              <ProxyIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="action" />
                              <Typography variant="caption" color="primary">
                                Proxy Host
                              </Typography>
                            </Box>
                          )
                        }
                        return null
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getHttpStatusLabel(host.forward_http_code)} 
                      size="small"
                      color={host.forward_http_code >= 300 && host.forward_http_code < 400 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{getSSLIcon(host)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleView(host)
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <PermissionIconButton
                        resource="redirection_hosts"
                        action="edit"
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
                        resource="redirection_hosts"
                        action="edit"
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
                        resource="redirection_hosts"
                        action="delete"
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {canManageRedirectionHosts('redirection_hosts') && (
        <RedirectionHostDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            navigate('/hosts/redirection')
          }}
          host={editingHost}
          onSave={() => {
            loadHosts()
            navigate('/hosts/redirection')
          }}
        />
      )}

      <RedirectionHostDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          if (id) {
            navigate('/hosts/redirection')
          }
        }}
        host={viewingHost}
        onEdit={canManageRedirectionHosts('redirection_hosts') ? handleEdit : undefined}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Redirection Host?"
        message={`Are you sure you want to delete the redirection host for ${hostToDelete?.domain_names.join(', ')}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  )
}

export default RedirectionHosts
