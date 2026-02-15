import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Typography,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Language as DefaultSiteIcon,
  Tune as PreferencesIcon,
  Celebration as CongratulationsIcon,
  ErrorOutline as Error404Icon,
  Block as NoResponseIcon,
  Code as CodeIcon,
} from '@mui/icons-material'
import { settingsApi, Setting } from '../api/settings'
import PageHeader from '../components/PageHeader'
import { NAVIGATION_CONFIG } from '../constants/navigation'
import { useUISettingsStore } from '../stores/uiSettingsStore'
import { usePermissions } from '../hooks/usePermissions'
import { useToast } from '../contexts/ToastContext'
import { useResponsive } from '../hooks/useResponsive'
import { DEFAULT_HTML } from './settings/htmlTemplates'
import DefaultSiteTab from './settings/DefaultSiteTab'
import UIPreferencesTab from './settings/UIPreferencesTab'


/** Palette color key used to resolve the actual color from the MUI theme */
type PaletteColorKey = 'success' | 'warning' | 'error' | 'info'

interface DefaultSiteOption {
  value: string
  label: string
  description: string
  icon: React.ReactNode
  paletteKey: PaletteColorKey
}

const DEFAULT_SITE_OPTIONS: DefaultSiteOption[] = [
  {
    value: 'congratulations',
    label: 'Congratulations Page',
    description: 'Default Nginx Proxy Manager welcome page',
    icon: <CongratulationsIcon />,
    paletteKey: 'success'
  },
  {
    value: '404',
    label: '404 Not Found',
    description: 'Standard 404 error page',
    icon: <Error404Icon />,
    paletteKey: 'warning'
  },
  {
    value: '444',
    label: 'No Response',
    description: 'Close connection without response',
    icon: <NoResponseIcon />,
    paletteKey: 'error'
  },
  {
    value: 'html',
    label: 'Custom HTML',
    description: 'Your own custom HTML content',
    icon: <CodeIcon />,
    paletteKey: 'info'
  }
]

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
    DEFAULT_SITE_OPTIONS.map((option) => {
      const color = theme.palette[option.paletteKey].main
      return (
        <Card
          key={option.value}
          variant={defaultSiteType === option.value ? 'elevation' : 'outlined'}
          elevation={defaultSiteType === option.value ? 3 : 0}
          sx={{
            cursor: 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            border: defaultSiteType === option.value ? `2px solid ${color}` : '2px solid transparent',
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
                  backgroundColor: alpha(color, 0.125),
                  color,
                  mr: 2
                }}
              >
                {React.cloneElement(option.icon as React.ReactElement<Record<string, unknown>>, { fontSize: 'large' })}
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
      )
    })
  ), [defaultSiteType, theme.shadows, theme.palette])

  const fetchSettings = useCallback(async (showLoader = true) => {
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
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabNameToIndex is stable
  }, [tab, activeTab])

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
    } catch (err: unknown) {
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
        <DefaultSiteTab
          activeTab={activeTab}
          defaultSiteType={defaultSiteType}
          defaultSiteHtml={defaultSiteHtml}
          defaultSiteCards={defaultSiteCards}
          saving={saving}
          onSetDefaultSiteHtml={setDefaultSiteHtml}
          onSaveDefaultSite={handleSaveDefaultSite}
          onCopyHtml={() => {
            navigator.clipboard.writeText(defaultSiteHtml)
            showSuccess('settings', 'copied', 'HTML')
          }}
        />

        {/* UI Preferences Tab */}
        <UIPreferencesTab
          activeTab={activeTab}
          containerPreferences={containerPreferences}
          drawerPosition={drawerPosition}
          drawerWidth={drawerWidth}
          visibleResources={getVisibleResources()}
          onSetContainerPreference={setContainerPreference}
          onSetDrawerPosition={setDrawerPosition}
          onSetDrawerWidth={setDrawerWidth}
          onResetToDefaults={resetToDefaults}
          canManage={canManage}
        />
      </Paper>
    </Box>
  );
}

export default Settings