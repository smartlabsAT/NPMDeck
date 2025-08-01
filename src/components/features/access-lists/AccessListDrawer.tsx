import React from 'react'
import {
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  Typography,
  Alert,
} from '@mui/material'
import {
  Info as InfoIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { AccessList, CreateAccessList, UpdateAccessList, accessListsApi } from '../../../api/accessLists'
import BaseDrawer from '../../base/BaseDrawer'
import TabPanel from '../../shared/TabPanel'
import FormSection from '../../shared/FormSection'
import ArrayFieldManager from '../../shared/ArrayFieldManager'
import { useDrawerForm } from '../../../hooks/useDrawerForm'
import { useToast } from '../../../contexts/ToastContext'

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

interface AccessListFormData {
  name: string
  satisfyAny: boolean
  passAuth: boolean
  authItems: AuthItem[]
  accessRules: AccessRule[]
}

// Memoized components to prevent re-renders and focus loss
const AuthItemComponent = React.memo(({ value, onChange, onDelete, index, accessList }: any) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      display: 'flex',
      gap: 2,
      alignItems: 'flex-start'
    }}
  >
    <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
      <TextField
        label="Username"
        value={value.username}
        onChange={(e) => {
          onChange({ ...value, username: e.target.value })
        }}
        error={false}
        helperText={undefined}
        fullWidth
        required
      />
      <TextField
        label="Password"
        type="password"
        value={value.password}
        onChange={(e) => {
          onChange({ ...value, password: e.target.value })
        }}
        error={false}
        helperText={undefined}
        fullWidth
        required={!accessList}
        placeholder={accessList ? 'Leave blank to keep current password' : 'Enter password'}
      />
    </Box>
  </Paper>
))

// IP/CIDR validation function
const validateIpCidr = (address: string): string | null => {
    if (!address || address.trim() === '') {
      return 'IP address is required'
    }
    
    // Allow special keyword 'all'
    if (address === 'all') {
      return null
    }
    
    // IPv4 with optional CIDR
    const ipv4CidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
    
    // IPv6 with optional CIDR (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$/
    
    if (!ipv4CidrRegex.test(address) && !ipv6Regex.test(address)) {
      return 'Please enter a valid IP address, CIDR range, or "all"'
    }
    
    // Additional validation for IPv4
    if (ipv4CidrRegex.test(address)) {
      const parts = address.split('/')
      const ip = parts[0]
      const cidr = parts[1]
      
      // Validate IP octets
      const octets = ip.split('.')
      for (const octet of octets) {
        const num = parseInt(octet, 10)
        if (num < 0 || num > 255) {
          return 'Invalid IP address: each octet must be between 0-255'
        }
      }
      
      // Validate CIDR if present
      if (cidr) {
        const cidrNum = parseInt(cidr, 10)
        if (cidrNum < 0 || cidrNum > 32) {
          return 'Invalid CIDR: must be between 0-32'
        }
      }
    }
    
    return null
}

const AccessRuleComponent = React.memo(({ value, onChange, onDelete, index }: any) => {
  const error = validateIpCidr(value.address)
  
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start'
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
        <TextField
          label="IP Address or Range"
          value={value.address}
          onChange={(e) => {
            onChange({ ...value, address: e.target.value })
          }}
          error={!!error}
          helperText={error || "Examples: 192.168.1.0/24, 10.0.0.5, all"}
          fullWidth
          required
        />
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Action</InputLabel>
        <Select
          value={value.directive}
          onChange={(e) => {
            onChange({ ...value, directive: e.target.value })
          }}
          label="Action"
        >
          <MenuItem value="allow">Allow</MenuItem>
          <MenuItem value="deny">Deny</MenuItem>
        </Select>
      </FormControl>
    </Box>
  </Paper>
  )
})

export default function AccessListDrawer({ open, onClose, accessList, onSave }: AccessListDrawerProps) {
  const [activeTab, setActiveTab] = React.useState(0)
  const { showSuccess, showError } = useToast()
  const isEditMode = !!accessList
  
  // Create memoized component with accessList in closure
  const AuthItemWithAccessList = React.useCallback(
    (props: any) => <AuthItemComponent {...props} accessList={accessList} />,
    [accessList]
  )

  const {
    data,
    setFieldValue,
    loading,
    globalError,
    errors,
    handleSubmit,
    resetForm,
    isDirty,
    isValid,
  } = useDrawerForm<AccessListFormData>({
    initialData: {
      name: accessList?.name || '',
      satisfyAny: accessList?.satisfy_any || false,
      passAuth: accessList?.pass_auth || false,
      authItems: accessList?.items?.map(item => ({
        username: item.username,
        password: '', // Password not returned by API
      })) || [{ username: '', password: '' }],
      accessRules: accessList?.clients?.map(client => ({
        address: client.address,
        directive: client.directive,
      })) || [{ address: '', directive: 'allow' }],
    },
    validate: (data) => {
      const errors: Partial<Record<keyof AccessListFormData | 'general', string>> = {}
      
      // Name validation
      if (!data.name || data.name.trim() === '') {
        errors.name = 'Name is required'
      }
      
      // At least one auth item or access rule is required
      const hasValidAuthItems = data.authItems.some(item => {
        if (!item.username) return false
        // In edit mode: password is optional (empty = keep existing)
        // In create mode: password is required
        return accessList ? true : !!item.password
      })
      const hasValidAccessRules = data.accessRules.some(rule => rule.address)
      
      if (!hasValidAuthItems && !hasValidAccessRules) {
        // Set a general error that will be displayed at the top of the drawer
        errors.general = 'Please add at least one authorization user OR one access rule. An access list must have either authentication users or IP-based access rules (or both).'
      }
      
      // Validate IP/CIDR addresses in access rules
      const ipValidationErrors: string[] = []
      data.accessRules.forEach((rule, index) => {
        if (rule.address) {
          const error = validateIpCidr(rule.address)
          if (error) {
            ipValidationErrors.push(`Rule ${index + 1}: ${error}`)
          }
        }
      })
      
      if (ipValidationErrors.length > 0) {
        errors.accessRules = ipValidationErrors.join(', ')
      }
      
      return Object.keys(errors).length > 0 ? errors : null
    },
    onSubmit: async (data) => {
      const payload: CreateAccessList | UpdateAccessList = {
        name: data.name,
        satisfy_any: data.satisfyAny,
        pass_auth: data.passAuth,
        items: data.authItems.filter(item => {
          // In edit mode: include items with username even without password
          // In create mode: only include items with both username and password
          return item.username && (accessList || item.password)
        }),
        clients: data.accessRules.filter(rule => rule.address),
      }

      if (accessList) {
        await accessListsApi.update(accessList.id, payload)
      } else {
        await accessListsApi.create(payload)
      }
    },
    onSuccess: (data) => {
      showSuccess('access-list', isEditMode ? 'updated' : 'created', data.name)
      onSave()
      onClose()
    },
    onError: (error) => {
      showError('access-list', isEditMode ? 'update' : 'create', error.message, data.name)
    },
  })

  const tabs = [
    { id: 'details', label: 'Details', icon: <InfoIcon />, hasError: Boolean(errors.name) },
    { id: 'authorization', label: 'Authorization', icon: <LockIcon />, hasError: Boolean(errors.authItems) },
    { id: 'access', label: 'Access', icon: <SecurityIcon />, hasError: Boolean(errors.accessRules) },
  ]

  const handleAuthItemChange = (index: number, field: 'username' | 'password', value: string) => {
    const updated = [...data.authItems]
    updated[index][field] = value
    setFieldValue('authItems', updated)
  }

  const handleAccessRuleChange = (index: number, field: 'address' | 'directive', value: string) => {
    const updated = [...data.accessRules]
    updated[index][field] = value as any
    setFieldValue('accessRules', updated)
  }

  // Reset form when accessList changes
  React.useEffect(() => {
    if (open) {
      resetForm({
        name: accessList?.name || '',
        satisfyAny: accessList?.satisfy_any || false,
        passAuth: accessList?.pass_auth || false,
        authItems: accessList?.items?.map(item => ({
          username: item.username,
          password: '', // Password not returned by API
        })) || [{ username: '', password: '' }],
        accessRules: accessList?.clients?.map(client => ({
          address: client.address,
          directive: client.directive,
        })) || [{ address: '', directive: 'allow' }],
      })
      setActiveTab(0)
    }
  }, [accessList, open, resetForm])

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={accessList ? 'Edit Access List' : 'Create Access List'}
      titleIcon={<SecurityIcon sx={{ color: '#2bcbba' }} />}
      subtitle="Manage access control and authorization"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSubmit}
      loading={loading}
      error={globalError || undefined}
      isDirty={isDirty}
      saveDisabled={!isValid}
      confirmClose={isDirty}
      saveText={isEditMode ? 'Save Changes' : 'Create Access List'}
    >
      {/* Details Tab */}
      <TabPanel value={activeTab} index={0} keepMounted animation="none">
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}
        <FormSection
          title="Basic Information"
          description="Configure the basic settings for this access list"
          icon={<InfoIcon />}
          required
        >
          <TextField
            label="Name"
            value={data.name}
            onChange={(e) => setFieldValue('name', e.target.value)}
            fullWidth
            required
            placeholder="Enter a descriptive name"
            error={!!errors.name}
            helperText={errors.name}
          />
        </FormSection>

        <FormSection
          title="Authentication Settings"
          description="Configure how multiple authentication methods are handled"
          icon={<LockIcon />}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={data.satisfyAny}
                    onChange={(e) => setFieldValue('satisfyAny', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Satisfy Any</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Allow access if ANY condition is met (IP rule OR authentication)
                    </Typography>
                  </Box>
                }
              />
            </Box>
            
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={data.passAuth}
                    onChange={(e) => setFieldValue('passAuth', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Pass Auth</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pass authentication headers to the proxied server
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </FormSection>
      </TabPanel>

      {/* Authorization Tab */}
      <TabPanel value={activeTab} index={1} keepMounted animation="none">
        <FormSection
          title="Authorization Users"
          description="Add users that can authenticate against this access list"
          icon={<LockIcon />}
        >
          <ArrayFieldManager<AuthItem>
            value={data.authItems}
            onChange={(value) => setFieldValue('authItems', value)}
            label="Authorization Users"
            helperText={errors.authItems || "Add users that can authenticate against this access list"}
            defaultValue={{ username: '', password: '' }}
            addButtonText="Add User"
            emptyPlaceholder="No users added yet. Add users to enable authentication."
            ItemComponent={AuthItemWithAccessList}
            error={!!errors.authItems}
          />
        </FormSection>
      </TabPanel>

      {/* Access Tab */}
      <TabPanel value={activeTab} index={2} keepMounted animation="none">
        <FormSection
          title="Access Rules"
          description="Define IP addresses and ranges that should be allowed or denied"
          icon={<SecurityIcon />}
        >
          <ArrayFieldManager<AccessRule>
            value={data.accessRules}
            onChange={(value) => setFieldValue('accessRules', value)}
            label="Access Rules"
            helperText={errors.accessRules || "Define IP addresses and ranges that should be allowed or denied"}
            defaultValue={{ address: '', directive: 'allow' }}
            addButtonText="Add Rule"
            emptyPlaceholder="No access rules defined. Add rules to control IP-based access."
            ItemComponent={AccessRuleComponent}
            error={!!errors.accessRules}
          />
        </FormSection>
      </TabPanel>
    </BaseDrawer>
  )
}