import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Slider,
  Stack,
  Chip,
} from '@mui/material'
import { Settings as SettingsIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { settingsApi, Setting } from '../api/settings'
import PageHeader from '../components/PageHeader'
import { useUISettingsStore } from '../stores/uiSettingsStore'
import { usePermissions } from '../hooks/usePermissions'
import { EntityType, Operation, ContainerType, ENTITY_DISPLAY_NAMES } from '../types/uiSettings'

const Settings = () => {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [defaultSiteType, setDefaultSiteType] = useState<string>('congratulations')
  const [defaultSiteHtml, setDefaultSiteHtml] = useState<string>('')
  
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
  
  const { getVisibleResources, canView, canManage } = usePermissions()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  const handleSaveDefaultSite = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      
      let value: any = defaultSiteType
      
      if (defaultSiteType === 'html') {
        value = {
          type: 'html',
          html: defaultSiteHtml
        }
      }
      
      await settingsApi.update('default-site', { value })
      
      setSuccessMessage('Default site settings saved successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      
      // Refresh settings
      await fetchSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultSiteDescription = () => {
    switch (defaultSiteType) {
      case 'congratulations':
        return 'Shows the standard Nginx Proxy Manager congratulations page'
      case 'html':
        return 'Shows your custom HTML content'
      case '404':
        return 'Returns a standard 404 Not Found error'
      case '444':
        return 'Closes the connection without sending a response (HTTP 444)'
      default:
        return ''
    }
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
      <Box mb={3}>
        <PageHeader
          icon={<SettingsIcon sx={{ color: '#6c757d' }} />}
          title="Settings"
          description="Configure system-wide settings for Nginx Proxy Manager"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Default Site
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose what visitors see when they access your server directly or via an unmatched domain
          </Typography>

          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup
              value={defaultSiteType}
              onChange={(e) => setDefaultSiteType(e.target.value)}
            >
              <FormControlLabel 
                value="congratulations" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1">Congratulations Page</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Default Nginx Proxy Manager welcome page
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel 
                value="404" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1">404 Page</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Standard 404 Not Found error page
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel 
                value="444" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1">No Response</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Close connection without response (HTTP 444)
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel 
                value="html" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1">Custom HTML</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your own custom HTML content
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {defaultSiteType === 'html' && (
            <Box mt={3}>
              <TextField
                fullWidth
                multiline
                rows={10}
                variant="outlined"
                label="Custom HTML Content"
                value={defaultSiteHtml}
                onChange={(e) => setDefaultSiteHtml(e.target.value)}
                placeholder="<!DOCTYPE html>&#10;<html>&#10;<head>&#10;    <title>Welcome</title>&#10;</head>&#10;<body>&#10;    <h1>Welcome to my server</h1>&#10;</body>&#10;</html>"
                helperText="Enter your custom HTML content that will be displayed as the default page"
              />
            </Box>
          )}

          {defaultSiteType && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                <strong>Current behavior:</strong> {getDefaultSiteDescription()}
              </Typography>
            </Box>
          )}
        </CardContent>
        
        <Divider />
        
        <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveDefaultSite}
            disabled={saving || (defaultSiteType === 'html' && !defaultSiteHtml.trim())}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardActions>
      </Card>

      {/* UI Preferences Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            UI Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Customize how forms and details are displayed throughout the application
          </Typography>

          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Container Display Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose whether to use drawers or dialogs for each type of operation
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Resource</TableCell>
                    <TableCell align="center">View</TableCell>
                    <TableCell align="center">Edit</TableCell>
                    <TableCell align="center">Create</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getVisibleResources().map((resource) => {
                    const entityKey = resource as EntityType
                    const hasManagePermission = canManage(resource)
                    
                    return (
                      <TableRow key={resource}>
                        <TableCell>{ENTITY_DISPLAY_NAMES[entityKey]}</TableCell>
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
          </Box>

          <Box mt={4}>
            <Typography variant="subtitle1" gutterBottom>
              Drawer Settings
            </Typography>
            
            <Box mt={2}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Drawer Position</FormLabel>
                <RadioGroup
                  row
                  value={drawerPosition}
                  onChange={(e) => setDrawerPosition(e.target.value as 'left' | 'right')}
                >
                  <FormControlLabel value="left" control={<Radio />} label="Left" />
                  <FormControlLabel value="right" control={<Radio />} label="Right" />
                </RadioGroup>
              </FormControl>
            </Box>

            <Box mt={3}>
              <Typography gutterBottom>Drawer Width: {drawerWidth}px</Typography>
              <Slider
                value={drawerWidth}
                onChange={(_, value) => setDrawerWidth(value as number)}
                min={400}
                max={1200}
                step={50}
                marks={[
                  { value: 400, label: '400px' },
                  { value: 600, label: '600px' },
                  { value: 800, label: '800px' },
                  { value: 1000, label: '1000px' },
                  { value: 1200, label: '1200px' },
                ]}
              />
            </Box>
          </Box>

          <Box mt={3} p={2} bgcolor="info.main" color="info.contrastText" borderRadius={1}>
            <Typography variant="body2">
              <strong>Note:</strong> On mobile devices, all forms will display as full-screen dialogs for better usability.
            </Typography>
          </Box>
        </CardContent>
        
        <Divider />
        
        <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </Button>
          <Typography variant="body2" color="text.secondary">
            UI preferences are saved automatically
          </Typography>
        </CardActions>
      </Card>

      {/* Future settings sections can be added here */}
      <Box mt={3}>
        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            More settings will be available in future updates
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default Settings