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
  Chip,
  // Divider,
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
  // OpenInNew as PreviewIcon,
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  SwapHoriz as ProxyIcon,
  TrendingFlat as RedirectIcon,
  Block as DeadIcon,
  Stream as StreamIcon,
  VpnKey as CertificateIcon,
  Security as AccessListIcon,
  Group as UserIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import Editor from 'react-simple-code-editor'
// @ts-expect-error - prismjs type declarations don't cover all exports
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-markup'
import { settingsApi, Setting } from '../api/settings'
import PageHeader from '../components/PageHeader'
import TabPanel from '../components/shared/TabPanel'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import FormSection from '../components/shared/FormSection'
import { useUISettingsStore } from '../stores/uiSettingsStore'
import { usePermissions } from '../hooks/usePermissions'
import { EntityType, ContainerType, ENTITY_DISPLAY_NAMES } from '../types/uiSettings'
import { useToast } from '../contexts/ToastContext'
import { useResponsive } from '../hooks/useResponsive'

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

// Resource icons mapping with navigation colors
const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  proxy_hosts: <ProxyIcon sx={{ color: '#5eba00' }} />,
  redirection_hosts: <RedirectIcon sx={{ color: '#f1c40f' }} />,
  dead_hosts: <DeadIcon sx={{ color: '#cd201f' }} />,
  streams: <StreamIcon sx={{ color: '#467fcf' }} />,
  access_lists: <AccessListIcon sx={{ color: '#2bcbba' }} />,
  certificates: <CertificateIcon sx={{ color: '#467fcf' }} />,
  users: <UserIcon sx={{ color: '#868e96' }} />,
}

const Settings = () => {
  const theme = useTheme()
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { isMobile } = useResponsive()
  
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
  const [_error, setError] = useState<string | null>(null)
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
        elevation={defaultSiteType === option.value ? 3 : 0}
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
              {React.cloneElement(option.icon as React.ReactElement<any>, { fontSize: 'large' })}
            </Box>
            <Typography variant="h6" component="div">
              {option.label}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
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
    if (tab && tabNameToIndex[tab] !== undefined) {
      const newTabIndex = tabNameToIndex[tab]
      if (newTabIndex !== activeTab) {
        setActiveTab(newTabIndex)
      }
    } else if (!tab && activeTab !== 0) {
      setActiveTab(0)
    }
    // tabNameToIndex is a constant, so it's safe to exclude from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activeTab])

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
        } else if (typeof defaultSiteSetting.value === 'object' && defaultSiteSetting.value !== null) {
          const valueObj = defaultSiteSetting.value
          if (typeof valueObj.type === 'string') {
            setDefaultSiteType(valueObj.type)
            if (valueObj.type === 'html' && typeof valueObj.html === 'string') {
              setDefaultSiteHtml(valueObj.html)
            }
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px"
        }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <title>Settings - NPMDeck</title>
      <Box sx={{
        mb: 3
      }}>
        <PageHeader
          icon={React.createElement(NAVIGATION_CONFIG.settings.icon, { sx: { color: NAVIGATION_CONFIG.settings.color } })}
          title={NAVIGATION_CONFIG.settings.text}
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
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTabScrollButton-root': { display: 'flex' },
            // Adjust padding on mobile
            ...(isMobile && {
              '& .MuiTab-root': {
                minWidth: 'auto',
                px: 2
              }
            })
          }}
        >
          {tabs.map((tab, _index) => (
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
        <TabPanel value={activeTab} index={0} padding={isMobile ? 2 : 3} animation="none">
          <FormSection title="Choose Default Page" sx={{ mb: 4 }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 3
              }}>
              Select what visitors see when they access your server directly or via an unmatched domain
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              {defaultSiteCards}
            </Box>
          </FormSection>

          {defaultSiteType === 'html' && (
            <FormSection title="Custom HTML Content">
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                gap: 1, 
                flexDirection: isMobile ? 'column' : 'row',
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                alignItems: isMobile ? 'stretch' : 'flex-start'
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    width: '100%',
                    mb: 1
                  }}>
                  Quick Templates:
                </Typography>
                <Box sx={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 1,
                  width: isMobile ? '100%' : 'auto',
                  flex: isMobile ? '1' : 'none'
                }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setDefaultSiteHtml(HTML_TEMPLATES.basic)}
                    fullWidth={isMobile}
                  >
                    Basic Page
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setDefaultSiteHtml(HTML_TEMPLATES.styled)}
                    fullWidth={isMobile}
                  >
                    Styled Welcome
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setDefaultSiteHtml(HTML_TEMPLATES.maintenance)}
                    fullWidth={isMobile}
                  >
                    Maintenance
                  </Button>
                </Box>
                {!isMobile && <Box sx={{ flexGrow: 1 }} />}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: isMobile ? 'center' : 'flex-end',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <Tooltip title="Copy HTML">
                    <IconButton size="small" onClick={() => {
                      navigator.clipboard.writeText(defaultSiteHtml)
                      showSuccess('settings', 'copied', 'HTML')
                    }}>
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Paper
                variant="outlined"
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fafafa',
                  borderRadius: 1,
                  overflow: 'hidden',
                  width: '100%',
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
                  padding={isMobile ? 12 : 16}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: isMobile ? 12 : 14,
                    minHeight: isMobile ? 300 : 400,
                    width: '100%',
                    color: theme.palette.mode === 'dark' ? '#abb2bf' : '#383a42',
                    backgroundColor: 'transparent',
                    overflowX: 'auto'
                  }}
                  placeholder="Enter your custom HTML content here..."
                />
              </Paper>
              
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  mt: 1,
                  display: 'block'
                }}>
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
        <TabPanel value={activeTab} index={1} padding={isMobile ? 2 : 3} animation="none">
          <FormSection title="Container Display Preferences" sx={{ mb: 4 }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 3
              }}>
              Choose whether to use drawers or dialogs for different operations
            </Typography>

{/* Mobile: Card layout */}
            {isMobile ? (
              <Stack spacing={2}>
                {getVisibleResources().map((resource) => {
                  const entityKey = resource as EntityType
                  const hasManagePermission = canManage(resource)
                  
                  return (
                    <Card key={resource} variant="outlined">
                      <CardContent sx={{ pb: 2 }}>
                        {/* Resource Header */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          mb: 2,
                          pb: 1,
                          borderBottom: 1,
                          borderColor: 'divider'
                        }}>
                          {RESOURCE_ICONS[entityKey] ? (
                            React.cloneElement(RESOURCE_ICONS[entityKey] as React.ReactElement<any>, {
                              fontSize: 'small'
                            })
                          ) : (
                            <CodeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          )}
                          <Typography variant="subtitle1" sx={{
                            fontWeight: "medium"
                          }}>
                            {ENTITY_DISPLAY_NAMES[entityKey]}
                          </Typography>
                        </Box>
                        
                        {/* View Details Setting */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <ViewIcon fontSize="small" sx={{ color: '#467fcf' }} />
                            <Typography variant="body2" sx={{
                              fontWeight: "medium"
                            }}>
                              View Details
                            </Typography>
                          </Box>
                          <ToggleButtonGroup
                            size="small"
                            value={containerPreferences[entityKey]?.view || 'dialog'}
                            exclusive
                            onChange={(_, value) => value && setContainerPreference(entityKey, 'view', value as ContainerType)}
                            fullWidth
                            sx={{ height: 36 }}
                          >
                            <ToggleButton value="dialog">
                              Dialog
                            </ToggleButton>
                            <ToggleButton value="drawer">
                              Drawer
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Box>
                        
                        {/* Edit Setting */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <EditIcon fontSize="small" sx={{ color: '#f59f00' }} />
                            <Typography variant="body2" sx={{
                              fontWeight: "medium"
                            }}>
                              Edit
                            </Typography>
                          </Box>
                          {hasManagePermission ? (
                            <ToggleButtonGroup
                              size="small"
                              value={containerPreferences[entityKey]?.edit || 'drawer'}
                              exclusive
                              onChange={(_, value) => value && setContainerPreference(entityKey, 'edit', value as ContainerType)}
                              fullWidth
                              sx={{ height: 36 }}
                            >
                              <ToggleButton value="dialog">
                                Dialog
                              </ToggleButton>
                              <ToggleButton value="drawer">
                                Drawer
                              </ToggleButton>
                            </ToggleButtonGroup>
                          ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Chip label="No Permission" size="small" variant="outlined" />
                            </Box>
                          )}
                        </Box>
                        
                        {/* Create New Setting */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <AddIcon fontSize="small" sx={{ color: '#5eba00' }} />
                            <Typography variant="body2" sx={{
                              fontWeight: "medium"
                            }}>
                              Create New
                            </Typography>
                          </Box>
                          {hasManagePermission ? (
                            <ToggleButtonGroup
                              size="small"
                              value={containerPreferences[entityKey]?.create || 'drawer'}
                              exclusive
                              onChange={(_, value) => value && setContainerPreference(entityKey, 'create', value as ContainerType)}
                              fullWidth
                              sx={{ height: 36 }}
                            >
                              <ToggleButton value="dialog">
                                Dialog
                              </ToggleButton>
                              <ToggleButton value="drawer">
                                Drawer
                              </ToggleButton>
                            </ToggleButtonGroup>
                          ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Chip label="No Permission" size="small" variant="outlined" />
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            ) : (
              /* Desktop: Table layout */
              (<TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Resource</TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5
                          }}>
                          <ViewIcon fontSize="small" sx={{ color: '#467fcf' }} />
                          View Details
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5
                          }}>
                          <EditIcon fontSize="small" sx={{ color: '#f59f00' }} />
                          Edit
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5
                          }}>
                          <AddIcon fontSize="small" sx={{ color: '#5eba00' }} />
                          Create New
                        </Box>
                      </TableCell>
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
                                React.cloneElement(RESOURCE_ICONS[entityKey] as React.ReactElement<any>, {
                                  fontSize: 'small'
                                })
                              ) : (
                                <CodeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              )}
                              {ENTITY_DISPLAY_NAMES[entityKey]}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <ToggleButtonGroup
                              size="small"
                              value={containerPreferences[entityKey]?.view || 'dialog'}
                              exclusive
                              onChange={(_, value) => value && setContainerPreference(entityKey, 'view', value as ContainerType)}
                              sx={{ height: 32 }}
                            >
                              <ToggleButton value="dialog" sx={{ px: 2 }}>
                                Dialog
                              </ToggleButton>
                              <ToggleButton value="drawer" sx={{ px: 2 }}>
                                Drawer
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </TableCell>
                          <TableCell align="center">
                            {hasManagePermission ? (
                              <ToggleButtonGroup
                                size="small"
                                value={containerPreferences[entityKey]?.edit || 'drawer'}
                                exclusive
                                onChange={(_, value) => value && setContainerPreference(entityKey, 'edit', value as ContainerType)}
                                sx={{ height: 32 }}
                              >
                                <ToggleButton value="dialog" sx={{ px: 2 }}>
                                  Dialog
                                </ToggleButton>
                                <ToggleButton value="drawer" sx={{ px: 2 }}>
                                  Drawer
                                </ToggleButton>
                              </ToggleButtonGroup>
                            ) : (
                              <Chip label="No Permission" size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {hasManagePermission ? (
                              <ToggleButtonGroup
                                size="small"
                                value={containerPreferences[entityKey]?.create || 'drawer'}
                                exclusive
                                onChange={(_, value) => value && setContainerPreference(entityKey, 'create', value as ContainerType)}
                                sx={{ height: 32 }}
                              >
                                <ToggleButton value="dialog" sx={{ px: 2 }}>
                                  Dialog
                                </ToggleButton>
                                <ToggleButton value="drawer" sx={{ px: 2 }}>
                                  Drawer
                                </ToggleButton>
                              </ToggleButtonGroup>
                            ) : (
                              <Chip label="No Permission" size="small" variant="outlined" />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>)
            )}
          </FormSection>

          <FormSection title="Drawer Settings">
            <Stack spacing={isMobile ? 3 : 4}>
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
                  sx={{
                    ...(isMobile && {
                      '& .MuiToggleButton-root': {
                        flexDirection: 'column',
                        gap: 0.5,
                        py: 1.5
                      }
                    })
                  }}
                >
                  <ToggleButton value="left">
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: isMobile ? 0.5 : 1,
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <LeftIcon />
                      <Typography variant={isMobile ? "caption" : "body2"}>Left Side</Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="right">
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: isMobile ? 0.5 : 1,
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <Typography variant={isMobile ? "caption" : "body2"}>Right Side</Typography>
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
                    { value: 400, label: isMobile ? '' : 'Compact' },
                    { value: 600, label: isMobile ? '' : 'Default' },
                    { value: 800, label: isMobile ? '' : 'Wide' },
                    { value: 1000, label: isMobile ? '' : 'Extra Wide' },
                    { value: 1200, label: isMobile ? '' : 'Maximum' },
                  ]}
                  sx={{ 
                    mt: 2, 
                    mb: 1,
                    ...(isMobile && {
                      '& .MuiSlider-markLabel': {
                        fontSize: '0.75rem'
                      }
                    })
                  }}
                />
                {isMobile && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    mt: 1,
                    px: 1
                  }}>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      Compact
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      Default
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      Wide
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      Extra
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      Max
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          </FormSection>

          <Alert severity="info" sx={{ mt: 4 }}>
            <Typography variant="body2">
              <strong>Note:</strong> On mobile devices, all forms will display as full-screen dialogs for optimal usability.
              UI preferences are saved automatically as you make changes.
            </Typography>
          </Alert>

          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: isMobile ? 'center' : 'space-between', 
            alignItems: 'center',
            gap: isMobile ? 2 : 0
          }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetToDefaults}
              fullWidth={isMobile}
            >
              Reset to Defaults
            </Button>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: isMobile ? 'center' : 'right'
              }}>
              Changes are saved automatically
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default Settings