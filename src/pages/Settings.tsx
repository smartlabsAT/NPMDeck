import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
} from '@mui/material'
import {
  Language as DefaultSiteIcon,
  Tune as PreferencesIcon,
  Celebration as CongratulationsIcon,
  ErrorOutline as Error404Icon,
  Block as NoResponseIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Save as SaveIcon,
  OpenInNew as PreviewIcon,
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectIcon,
  Block as DeadIcon,
  Stream as StreamIcon,
  VpnKey as CertificateIcon,
  Security as AccessListIcon,
  Person as UserIcon,
} from '@mui/icons-material'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-markup'
import { settingsApi, Setting } from '../api/settings'
import PageHeader from '../components/PageHeader'
import TabPanel from '../components/shared/TabPanel'
import FormSection from '../components/shared/FormSection'
import { useUISettingsStore } from '../stores/uiSettingsStore'
import { usePermissions } from '../hooks/usePermissions'
import { EntityType, ContainerType, ENTITY_DISPLAY_NAMES } from '../types/uiSettings'
import { useToast } from '../contexts/ToastContext'

// HTML Templates
const HTML_TEMPLATES = {
  basic: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome to my server</h1>
</body>
</html>`,
  styled: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome</h1>
        <p>This server is powered by Nginx Proxy Manager</p>
    </div>
</body>
</html>`,
  maintenance: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Under Maintenance</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
            color: #333;
        }
        .maintenance {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            color: #e74c3c;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="maintenance">
        <div class="icon">🔧</div>
        <h1>Under Maintenance</h1>
        <p>We're currently performing scheduled maintenance. We'll be back online shortly!</p>
    </div>
</body>
</html>`
}

// Default HTML for different site types
const DEFAULT_HTML = {
  congratulations: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Congratulations!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }
        h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
        }
        .icon {
            font-size: 5rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            opacity: 0.95;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🎉</div>
        <h1>Congratulations!</h1>
        <p>You've successfully reached this server.</p>
        <p>This page is served by Nginx Proxy Manager.</p>
    </div>
</body>
</html>`,
  '404': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }
        h1 {
            font-size: 6rem;
            margin: 0;
            color: #ff9800;
            font-weight: bold;
        }
        h2 {
            font-size: 2rem;
            margin: 1rem 0;
            color: #555;
        }
        p {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #666;
        }
        a {
            color: #ff9800;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <p><a href="/">Go back to homepage</a></p>
    </div>
</body>
</html>`,
  '444': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connection Closed</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #263238;
            color: #eceff1;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #ff5252;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🚫</div>
        <h1>Connection Closed</h1>
        <p>The server has closed the connection without sending a response.</p>
        <p>This is intentional behavior configured by the administrator.</p>
    </div>
</body>
</html>`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Page</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 2rem;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2196f3;
            margin-bottom: 1rem;
        }
        p {
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Custom Default Page</h1>
        <p>This is a custom page configured by the administrator.</p>
        <p>You can edit this content to display any information you want.</p>
    </div>
</body>
</html>`
}

interface DefaultSiteOption {
  value: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const DEFAULT_SITE_OPTIONS: DefaultSiteOption[] = [
  {
    value: 'congratulations',
    label: 'Congratulations Page',
    description: 'Default Nginx Proxy Manager welcome page',
    icon: <CongratulationsIcon />,
    color: '#4caf50'
  },
  {
    value: '404',
    label: '404 Not Found',
    description: 'Standard 404 error page',
    icon: <Error404Icon />,
    color: '#ff9800'
  },
  {
    value: '444',
    label: 'No Response',
    description: 'Close connection without response',
    icon: <NoResponseIcon />,
    color: '#f44336'
  },
  {
    value: 'html',
    label: 'Custom HTML',
    description: 'Your own custom HTML content',
    icon: <CodeIcon />,
    color: '#2196f3'
  }
]

// Resource icons mapping
const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  proxy_hosts: <ProxyIcon />,
  redirection_hosts: <RedirectIcon />,
  dead_hosts: <DeadIcon />,
  streams: <StreamIcon />,
  access_lists: <AccessListIcon />,
  certificates: <CertificateIcon />,
  users: <UserIcon />,
}

const Settings = () => {
  const theme = useTheme()
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  
  // Map tab names to indices
  const tabNameToIndex: Record<string, number> = {
    'default-site': 0,
    'ui-preferences': 1
  }
  
  // Get initial tab from URL or default to 0
  const getInitialTab = () => {
    if (tab && tabNameToIndex[tab] !== undefined) {
      return tabNameToIndex[tab]
    }
    return 0
  }
  
  const [activeTab, setActiveTab] = useState(getInitialTab())
  const [_settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [defaultSiteType, setDefaultSiteType] = useState<string>('congratulations')
  const [defaultSiteHtml, setDefaultSiteHtml] = useState<string>(DEFAULT_HTML.html)
  
  
  // UI Settings
  const {
    containerPreferences,
    drawerPosition,
    drawerWidth,
    setContainerPreference,
    setDrawerPosition,
    setDrawerWidth,
    resetToDefaults
  } = useUISettingsStore()
  
  const { getVisibleResources, canManage } = usePermissions()

  // Memoize the default site cards to prevent re-renders
  const defaultSiteCards = useMemo(() => (
    DEFAULT_SITE_OPTIONS.map((option) => (
      <Card
        key={option.value}
        variant={defaultSiteType === option.value ? 'elevation' : 'outlined'}
        elevation={defaultSiteType === option.value ? 3 : 1}
        sx={{
          cursor: 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          border: defaultSiteType === option.value ? `2px solid ${option.color}` : '2px solid transparent',
          '&:hover': {
            boxShadow: theme.shadows[4],
          }
        }}
        onClick={() => setDefaultSiteType(option.value)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: `${option.color}20`,
                color: option.color,
                mr: 2
              }}
            >
              {React.cloneElement(option.icon as React.ReactElement, { fontSize: 'large' })}
            </Box>
            <Typography variant="h6" component="div">
              {option.label}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {option.description}
          </Typography>
        </CardContent>
      </Card>
    ))
  ), [defaultSiteType, theme.shadows])

  useEffect(() => {
    fetchSettings()
  }, [])
  
  // Update active tab when URL changes
  useEffect(() => {
    const newTab = getInitialTab()
    if (newTab !== activeTab) {
      setActiveTab(newTab)
    }
  }, [tab])

  const fetchSettings = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      }
      setError(null)
      const data = await settingsApi.getAll()
      setSettings(data)
      
      // Find default site setting
      const defaultSiteSetting = data.find(s => s.id === 'default-site')
      if (defaultSiteSetting && defaultSiteSetting.value) {
        if (typeof defaultSiteSetting.value === 'string') {
          setDefaultSiteType(defaultSiteSetting.value)
        } else if (defaultSiteSetting.value.type) {
          setDefaultSiteType(defaultSiteSetting.value.type)
          if (defaultSiteSetting.value.type === 'html' && defaultSiteSetting.value.html) {
            setDefaultSiteHtml(defaultSiteSetting.value.html)
          }
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  const handleSaveDefaultSite = async () => {
    try {
      setSaving(true)
      
      // For 'html' type, save with the HTML content
      if (defaultSiteType === 'html') {
        await settingsApi.update('default-site', { 
          value: {
            type: 'html',
            html: defaultSiteHtml
          }
        })
      } else {
        // For other types, just save the type string
        await settingsApi.update('default-site', { value: defaultSiteType })
      }
      
      showSuccess('settings', 'updated', 'Default site')
    } catch (err) {
      showError('settings', 'update', err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }


  const tabs = [
    {
      id: 'default-site',
      label: 'Default Site',
      icon: <DefaultSiteIcon />
    },
    {
      id: 'ui-preferences',
      label: 'UI Preferences',
      icon: <PreferencesIcon />
    }
  ]

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={3}>
        <PageHeader
          icon={<PreferencesIcon sx={{ color: '#6c757d' }} />}
          title="Settings"
          description="Configure system-wide settings for Nginx Proxy Manager"
        />
      </Box>


      <Paper>
        <Tabs
          value={activeTab}
          onChange={(_, value) => {
            setActiveTab(value)
            // Update URL based on tab
            const tabNames = ['default-site', 'ui-preferences']
            navigate(`/admin/settings/${tabNames[value]}`, { replace: true })
          }}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.icon}
                  <span>{tab.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Default Site Tab */}
        <TabPanel value={activeTab} index={0} padding={3} animation="none">
          <FormSection title="Choose Default Page" sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select what visitors see when they access your server directly or via an unmatched domain
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              {defaultSiteCards}
            </Box>
          </FormSection>

          {defaultSiteType === 'html' && (
            <FormSection title="Custom HTML Content">
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
                  Quick Templates:
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDefaultSiteHtml(HTML_TEMPLATES.basic)}
                >
                  Basic Page
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDefaultSiteHtml(HTML_TEMPLATES.styled)}
                >
                  Styled Welcome
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDefaultSiteHtml(HTML_TEMPLATES.maintenance)}
                >
                  Maintenance
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Copy HTML">
                  <IconButton size="small" onClick={() => {
                    navigator.clipboard.writeText(defaultSiteHtml)
                    showSuccess('settings', 'copied', 'HTML')
                  }}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Paper
                variant="outlined"
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fafafa',
                  borderRadius: 1,
                  overflow: 'hidden',
                  '& pre': {
                    margin: 0,
                  },
                  // Custom syntax highlighting colors for light/dark theme
                  '& .token.tag': {
                    color: theme.palette.mode === 'dark' ? '#e06c75' : '#e45649',
                  },
                  '& .token.attr-name': {
                    color: theme.palette.mode === 'dark' ? '#d19a66' : '#986801',
                  },
                  '& .token.attr-value': {
                    color: theme.palette.mode === 'dark' ? '#98c379' : '#50a14f',
                  },
                  '& .token.punctuation': {
                    color: theme.palette.mode === 'dark' ? '#abb2bf' : '#383a42',
                  },
                  '& .token.doctype': {
                    color: theme.palette.mode === 'dark' ? '#c678dd' : '#a626a4',
                  },
                  '& .token.comment': {
                    color: theme.palette.mode === 'dark' ? '#5c6370' : '#a0a1a7',
                    fontStyle: 'italic',
                  },
                  '& .token.string': {
                    color: theme.palette.mode === 'dark' ? '#98c379' : '#50a14f',
                  },
                  '& .token.selector': {
                    color: theme.palette.mode === 'dark' ? '#e06c75' : '#e45649',
                  },
                  '& .token.property': {
                    color: theme.palette.mode === 'dark' ? '#d19a66' : '#986801',
                  },
                  '& .token.function': {
                    color: theme.palette.mode === 'dark' ? '#61afef' : '#4078f2',
                  },
                }}
              >
                <Editor
                  value={defaultSiteHtml}
                  onValueChange={setDefaultSiteHtml}
                  highlight={code => highlight(code, languages.html, 'html')}
                  padding={16}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: 400,
                    color: theme.palette.mode === 'dark' ? '#abb2bf' : '#383a42',
                    backgroundColor: 'transparent',
                  }}
                  placeholder="Enter your custom HTML content here..."
                />
              </Paper>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Create your own custom HTML page that will be displayed as the default
              </Typography>
            </FormSection>
          )}
          
          {defaultSiteType !== 'html' && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                {defaultSiteType === 'congratulations' && 'The standard Nginx Proxy Manager congratulations page will be displayed.'}
                {defaultSiteType === '404' && 'A standard 404 Not Found error page will be displayed.'}
                {defaultSiteType === '444' && 'The connection will be closed without sending any response (HTTP 444).'}
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveDefaultSite}
              disabled={saving || (defaultSiteType === 'html' && !defaultSiteHtml.trim())}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Saving...' : 'Save Default Site Settings'}
            </Button>
          </Box>
        </TabPanel>

        {/* UI Preferences Tab */}
        <TabPanel value={activeTab} index={1} padding={3} animation="none">
          <FormSection title="Container Display Preferences" sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose whether to use drawers or dialogs for different operations
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Resource</TableCell>
                    <TableCell align="center">View Details</TableCell>
                    <TableCell align="center">Edit</TableCell>
                    <TableCell align="center">Create New</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getVisibleResources().map((resource) => {
                    const entityKey = resource as EntityType
                    const hasManagePermission = canManage(resource)
                    
                    return (
                      <TableRow key={resource}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {RESOURCE_ICONS[entityKey] ? (
                              React.cloneElement(RESOURCE_ICONS[entityKey] as React.ReactElement, {
                                fontSize: 'small',
                                sx: { color: 'text.secondary' }
                              })
                            ) : (
                              <CodeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            )}
                            {ENTITY_DISPLAY_NAMES[entityKey]}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Select
                            size="small"
                            value={containerPreferences[entityKey]?.view || 'dialog'}
                            onChange={(e) => setContainerPreference(entityKey, 'view', e.target.value as ContainerType)}
                          >
                            <MenuItem value="dialog">Dialog</MenuItem>
                            <MenuItem value="drawer">Drawer</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell align="center">
                          {hasManagePermission ? (
                            <Select
                              size="small"
                              value={containerPreferences[entityKey]?.edit || 'drawer'}
                              onChange={(e) => setContainerPreference(entityKey, 'edit', e.target.value as ContainerType)}
                            >
                              <MenuItem value="dialog">Dialog</MenuItem>
                              <MenuItem value="drawer">Drawer</MenuItem>
                            </Select>
                          ) : (
                            <Chip label="No Permission" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {hasManagePermission ? (
                            <Select
                              size="small"
                              value={containerPreferences[entityKey]?.create || 'drawer'}
                              onChange={(e) => setContainerPreference(entityKey, 'create', e.target.value as ContainerType)}
                            >
                              <MenuItem value="dialog">Dialog</MenuItem>
                              <MenuItem value="drawer">Drawer</MenuItem>
                            </Select>
                          ) : (
                            <Chip label="No Permission" size="small" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </FormSection>

          <FormSection title="Drawer Settings">
            <Stack spacing={4}>
              {/* Drawer Position */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Drawer Position
                </Typography>
                <ToggleButtonGroup
                  value={drawerPosition}
                  exclusive
                  onChange={(_, value) => value && setDrawerPosition(value)}
                  fullWidth
                >
                  <ToggleButton value="left">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LeftIcon />
                      <Typography>Left Side</Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>Right Side</Typography>
                      <RightIcon />
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Drawer Width */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Drawer Width: {drawerWidth}px
                </Typography>
                <Slider
                  value={drawerWidth}
                  onChange={(_, value) => setDrawerWidth(value as number)}
                  min={400}
                  max={1200}
                  step={50}
                  marks={[
                    { value: 400, label: 'Compact' },
                    { value: 600, label: 'Default' },
                    { value: 800, label: 'Wide' },
                    { value: 1000, label: 'Extra Wide' },
                    { value: 1200, label: 'Maximum' },
                  ]}
                  sx={{ mt: 2, mb: 1 }}
                />
              </Box>
            </Stack>
          </FormSection>

          <Alert severity="info" sx={{ mt: 4 }}>
            <Typography variant="body2">
              <strong>Note:</strong> On mobile devices, all forms will display as full-screen dialogs for optimal usability.
              UI preferences are saved automatically as you make changes.
            </Typography>
          </Alert>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </Button>
            <Typography variant="body2" color="text.secondary">
              Changes are saved automatically
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default Settings