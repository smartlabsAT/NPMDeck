import React from 'react'
import { 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Card, 
  CardContent,
  Skeleton,
  Chip,
  IconButton,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  useTheme
} from '@mui/material'
import { 
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectIcon,
  Block as DeadIcon,
  Stream as StreamIcon,
  VpnKey as CertificateIcon,
  Security as AccessListIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { usePermissions } from '../hooks/usePermissions'
import PermissionButton from '../components/PermissionButton'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  path: string
  active?: number
  inactive?: number
  loading?: boolean
}

const StatCard = ({ title, value, icon, color, path, active, inactive, loading }: StatCardProps) => {
  const navigate = useNavigate()
  const theme = useTheme()
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
      onClick={() => navigate(path)}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {loading ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={20} height={20} />
            </Box>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ 
                p: 1, 
                borderRadius: 1.5, 
                backgroundColor: `${color}15`,
                display: 'inline-flex'
              }}>
                {React.cloneElement(icon as React.ReactElement, { 
                  sx: { fontSize: 24, color } 
                })}
              </Box>
              <ArrowIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </Box>
            
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {value}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {title}
            </Typography>
            
            {(active !== undefined || inactive !== undefined) && (
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
                {active !== undefined && (
                  <Typography variant="caption" color="success.main">
                    {active} active
                  </Typography>
                )}
                {active !== undefined && inactive !== undefined && (
                  <Typography variant="caption" color="text.secondary">•</Typography>
                )}
                {inactive !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    {inactive} inactive
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

const getDaysUntilExpiry = (expiresOn: string | null) => {
  if (!expiresOn) return null
  const expiryDate = new Date(expiresOn)
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const Dashboard = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { canView, canManage } = usePermissions()
  const stats = useDashboardStats()
  
  const statsCards = [
    {
      title: 'Proxy Hosts',
      value: stats.proxyHosts.total,
      active: stats.proxyHosts.active,
      inactive: stats.proxyHosts.inactive,
      icon: <ProxyIcon />,
      color: '#5eba00',
      path: '/hosts/proxy',
      show: canView('proxy_hosts')
    },
    {
      title: 'Redirection Hosts',
      value: stats.redirectionHosts.total,
      active: stats.redirectionHosts.active,
      inactive: stats.redirectionHosts.inactive,
      icon: <RedirectIcon />,
      color: '#f1c40f',
      path: '/hosts/redirection',
      show: canView('redirection_hosts')
    },
    {
      title: '404 Hosts',
      value: stats.deadHosts.total,
      active: stats.deadHosts.active,
      inactive: stats.deadHosts.inactive,
      icon: <DeadIcon />,
      color: '#cd201f',
      path: '/hosts/404',
      show: canView('dead_hosts')
    },
    {
      title: 'Streams',
      value: stats.streams.total,
      active: stats.streams.active,
      inactive: stats.streams.inactive,
      icon: <StreamIcon />,
      color: '#467fcf',
      path: '/hosts/streams',
      show: canView('streams')
    },
    {
      title: 'SSL Certificates',
      value: stats.certificates.total,
      icon: <CertificateIcon />,
      color: '#467fcf',
      path: '/security/certificates',
      show: canView('certificates')
    },
    {
      title: 'Access Lists',
      value: stats.accessLists.total,
      icon: <AccessListIcon />,
      color: '#2bcbba',
      path: '/security/access-lists',
      show: canView('access_lists')
    }
  ]

  const quickActions = [
    {
      label: 'New Proxy Host',
      icon: <ProxyIcon />,
      path: '/hosts/proxy/new',
      color: '#5eba00',
      resource: 'proxy_hosts'
    },
    {
      label: 'New Certificate',
      icon: <CertificateIcon />,
      path: '/security/certificates/new',
      color: '#467fcf',
      resource: 'certificates'
    },
    {
      label: 'New Redirection',
      icon: <RedirectIcon />,
      path: '/hosts/redirection/new',
      color: '#f1c40f',
      resource: 'redirection_hosts'
    },
    {
      label: 'New Access List',
      icon: <AccessListIcon />,
      path: '/security/access-lists/new',
      color: '#2bcbba',
      resource: 'access_lists'
    }
  ]

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Quick Actions - Now at the top */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {getGreeting()}, {user?.name || user?.email}!
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip 
                      label={user?.roles.includes('admin') ? 'Administrator' : 'User'} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                      <ScheduleIcon sx={{ fontSize: 14, verticalAlign: 'text-bottom', mr: 0.5 }} />
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mt: { xs: 2, sm: 0 } }}>
                  {quickActions.map((action, index) => (
                    <PermissionButton
                      key={index}
                      resource={action.resource}
                      action="create"
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(action.path)}
                      sx={{
                        color: action.color,
                        borderColor: action.color,
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: `${action.color}08`,
                          borderColor: action.color
                        },
                        minWidth: 'auto',
                        px: 2,
                        py: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                        <AddIcon sx={{ fontSize: 16 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {React.cloneElement(action.icon as React.ReactElement, {
                            sx: { fontSize: 16 }
                          })}
                          <Typography variant="caption" sx={{ fontWeight: 500, letterSpacing: 0.3 }}>
                            {action.label.replace('New ', '')}
                          </Typography>
                        </Box>
                      </Box>
                    </PermissionButton>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        {statsCards.filter(card => card.show).map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard 
              {...card} 
              loading={stats.loading}
            />
          </Grid>
        ))}

        {/* Expiring Certificates */}
        {canView('certificates') && stats.expiringCertificates.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <WarningIcon sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Expiring Certificates
                  </Typography>
                </Box>
                
                <List sx={{ py: 0 }}>
                  {stats.expiringCertificates.slice(0, 5).map((cert, index) => {
                    const days = getDaysUntilExpiry(cert.expires_on) || 0
                    const isExpired = days < 0
                    const isCritical = days <= 7
                    
                    return (
                      <React.Fragment key={cert.id}>
                        {index > 0 && <Divider />}
                        <ListItem 
                          button
                          onClick={() => navigate(`/security/certificates/${cert.id}/view`)}
                        >
                          <ListItemIcon>
                            {isExpired ? (
                              <ErrorIcon color="error" />
                            ) : isCritical ? (
                              <WarningIcon color="error" />
                            ) : (
                              <WarningIcon color="warning" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={cert.nice_name || cert.domain_names.join(', ')}
                            secondary={
                              isExpired 
                                ? 'Expired'
                                : `Expires in ${days} day${days !== 1 ? 's' : ''}`
                            }
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={cert.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom'}
                              size="small"
                              variant="outlined"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </React.Fragment>
                    )
                  })}
                </List>
                
                {stats.expiringCertificates.length > 5 && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/security/certificates')}
                    >
                      View all {stats.expiringCertificates.length} certificates
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}


        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                System Overview
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <CheckIcon sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Nginx Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Operational
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {stats.certificates.valid}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Valid Certificates
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.certificates.total > 0 ? (stats.certificates.valid / stats.certificates.total) * 100 : 0}
                      sx={{ mt: 0.5, height: 4, borderRadius: 1 }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {stats.proxyHosts.active + stats.redirectionHosts.active + stats.deadHosts.active + stats.streams.active}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Active Services
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All types
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard