import { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { AccessList, CreateAccessList, UpdateAccessList, accessListsApi } from '../api/accessLists'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`access-list-tabpanel-${index}`}
      aria-labelledby={`access-list-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

interface AccessListDrawerProps {
  open: boolean
  onClose: () => void
  accessList?: AccessList | null
  onSave: () => void
}

interface AuthItem {
  username: string
  password: string
}

interface AccessRule {
  address: string
  directive: 'allow' | 'deny'
}

export default function AccessListDrawer({ open, onClose, accessList, onSave }: AccessListDrawerProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [satisfyAny, setSatisfyAny] = useState(false)
  const [passAuth, setPassAuth] = useState(false)
  const [authItems, setAuthItems] = useState<AuthItem[]>([{ username: '', password: '' }])
  const [accessRules, setAccessRules] = useState<AccessRule[]>([{ address: '', directive: 'allow' }])

  const isEditMode = !!accessList

  useEffect(() => {
    if (accessList) {
      // Load existing access list data
      setName(accessList.name)
      setSatisfyAny(accessList.satisfy_any)
      setPassAuth(accessList.pass_auth)
      
      // Load auth items
      if (accessList.items && accessList.items.length > 0) {
        setAuthItems(accessList.items.map(item => ({
          username: item.username,
          password: '' // Password is not returned by API for security
        })))
      } else {
        setAuthItems([{ username: '', password: '' }])
      }
      
      // Load access rules
      if (accessList.clients && accessList.clients.length > 0) {
        setAccessRules(accessList.clients.map(client => ({
          address: client.address,
          directive: client.directive
        })))
      } else {
        setAccessRules([{ address: '', directive: 'allow' }])
      }
    } else {
      // Reset form for new access list
      setName('')
      setSatisfyAny(false)
      setPassAuth(false)
      setAuthItems([{ username: '', password: '' }])
      setAccessRules([{ address: '', directive: 'allow' }])
      setActiveTab(0)
    }
    setError(null)
  }, [accessList])

  const handleAddAuthItem = () => {
    setAuthItems([...authItems, { username: '', password: '' }])
  }

  const handleRemoveAuthItem = (index: number) => {
    if (authItems.length > 1) {
      setAuthItems(authItems.filter((_, i) => i !== index))
    }
  }

  const handleAuthItemChange = (index: number, field: 'username' | 'password', value: string) => {
    const updated = [...authItems]
    updated[index][field] = value
    setAuthItems(updated)
  }

  const handleAddAccessRule = () => {
    setAccessRules([...accessRules, { address: '', directive: 'allow' }])
  }

  const handleRemoveAccessRule = (index: number) => {
    if (accessRules.length > 1) {
      setAccessRules(accessRules.filter((_, i) => i !== index))
    }
  }

  const handleAccessRuleChange = (index: number, field: 'address' | 'directive', value: string) => {
    const updated = [...accessRules]
    updated[index][field] = value as any
    setAccessRules(updated)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate
      if (!name.trim()) {
        throw new Error('Name is required')
      }

      // Filter out empty auth items
      const validAuthItems = authItems.filter(item => item.username.trim())
      
      // Filter out empty access rules
      const validAccessRules = accessRules.filter(rule => rule.address.trim())

      // Check if at least one rule exists
      if (validAuthItems.length === 0 && validAccessRules.length === 0) {
        throw new Error('You must specify at least one Authorization or Access rule')
      }

      const data: CreateAccessList | UpdateAccessList = {
        name: name.trim(),
        satisfy_any: satisfyAny,
        pass_auth: passAuth,
        items: validAuthItems.length > 0 ? validAuthItems : undefined,
        clients: validAccessRules.length > 0 ? validAccessRules : undefined,
      }

      if (isEditMode) {
        await accessListsApi.update(accessList.id, data)
      } else {
        await accessListsApi.create(data)
      }

      onSave()
      onClose()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 
                         err.response?.data?.message || 
                         err.message || 
                         'Failed to save access list'
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 600 } }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon color="primary" />
            <Typography variant="h6">
              {isEditMode ? 'Edit Access List' : 'New Access List'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab 
              label="Details" 
              icon={<InfoIcon />} 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              label="Authorization" 
              icon={<LockIcon />} 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              label="Access" 
              icon={<CheckIcon />} 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <TabPanel value={activeTab} index={0}>
            {/* Details Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                Access Lists allow you to control who can access your proxied hosts using IP-based rules and/or HTTP Basic Authentication.
              </Alert>

              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                helperText="A descriptive name for this access list"
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Options
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={satisfyAny}
                      onChange={(e) => setSatisfyAny(e.target.checked)}
                    />
                  }
                  label="Satisfy Any"
                />
                <FormHelperText sx={{ ml: 2 }}>
                  When enabled, access is granted if ANY rule matches (Authorization OR Access).
                  When disabled, ALL rules must match (Authorization AND Access).
                </FormHelperText>

                <FormControlLabel
                  control={
                    <Switch
                      checked={passAuth}
                      onChange={(e) => setPassAuth(e.target.checked)}
                    />
                  }
                  label="Pass Authentication to Host"
                  sx={{ mt: 1 }}
                />
                <FormHelperText sx={{ ml: 2 }}>
                  Forward the Authorization header to the proxied host.
                </FormHelperText>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* Authorization Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                HTTP Basic Authentication requires users to provide a username and password to access the host.
              </Alert>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Users
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddAuthItem}
                    size="small"
                  >
                    Add User
                  </Button>
                </Box>

                {authItems.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="Username"
                      value={item.username}
                      onChange={(e) => handleAuthItemChange(index, 'username', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={item.password}
                      onChange={(e) => handleAuthItemChange(index, 'password', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                      placeholder={isEditMode && !item.password ? '••••••••' : ''}
                    />
                    <IconButton
                      onClick={() => handleRemoveAuthItem(index)}
                      disabled={authItems.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}

                {isEditMode && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> Leave password fields empty to keep existing passwords unchanged.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {/* Access Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                Control access based on client IP addresses. Supports IPv4, IPv6, and CIDR notation.
              </Alert>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Access Rules
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddAccessRule}
                    size="small"
                  >
                    Add Rule
                  </Button>
                </Box>

                {accessRules.map((rule, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>Action</InputLabel>
                      <Select
                        value={rule.directive}
                        onChange={(e) => handleAccessRuleChange(index, 'directive', e.target.value)}
                        label="Action"
                      >
                        <MenuItem value="allow">Allow</MenuItem>
                        <MenuItem value="deny">Deny</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="IP Address / CIDR"
                      value={rule.address}
                      onChange={(e) => handleAccessRuleChange(index, 'address', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                      placeholder="e.g., 192.168.1.0/24"
                      helperText={index === 0 ? "Examples: 192.168.1.1, 10.0.0.0/8, ::1" : ""}
                    />
                    <IconButton
                      onClick={() => handleRemoveAccessRule(index)}
                      disabled={accessRules.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}

                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Important:</strong> Rules are processed in order. Deny rules should typically come before allow rules.
                  </Typography>
                </Alert>
              </Box>
            </Box>
          </TabPanel>
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}