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

const AccessRuleComponent = React.memo(({ value, onChange, onDelete, index }: any) => (
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
        error={false}
        helperText="Examples: 192.168.1.0/24, 10.0.0.5, all"
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
))

export default function AccessListDrawer({ open, onClose, accessList, onSave }: AccessListDrawerProps) {
  const [activeTab, setActiveTab] = React.useState(0)
  
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
    onSubmit: async (data) => {
      const payload: CreateAccessList | UpdateAccessList = {
        name: data.name,
        satisfy_any: data.satisfyAny,
        pass_auth: data.passAuth,
        items: data.authItems.filter(item => item.username && item.password),
        clients: data.accessRules.filter(rule => rule.address),
      }

      if (accessList) {
        await accessListsApi.update(accessList.id, payload)
      } else {
        await accessListsApi.create(payload)
      }
    },
    onSuccess: () => {
      onSave()
      onClose()
    },
  })

  const tabs = [
    { id: 'details', label: 'Details', icon: <InfoIcon /> },
    { id: 'authorization', label: 'Authorization', icon: <LockIcon /> },
    { id: 'access', label: 'Access', icon: <SecurityIcon /> },
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
      subtitle="Manage access control and authorization"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={() => handleSubmit()}
      loading={loading}
      error={globalError || undefined}
    >
      {/* Details Tab */}
      <TabPanel value={activeTab} index={0} keepMounted animation="none">
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
          />
        </FormSection>

        <FormSection
          title="Authentication Settings"
          description="Configure how multiple authentication methods are handled"
          icon={<LockIcon />}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.satisfyAny}
                  onChange={(e) => setFieldValue('satisfyAny', e.target.checked)}
                />
              }
              label="Satisfy Any"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={data.passAuth}
                  onChange={(e) => setFieldValue('passAuth', e.target.checked)}
                />
              }
              label="Pass Auth"
            />
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
            helperText="Add users that can authenticate against this access list"
            defaultValue={{ username: '', password: '' }}
            addButtonText="Add User"
            emptyPlaceholder="No users added yet. Add users to enable authentication."
            ItemComponent={AuthItemWithAccessList}
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
            helperText="Define IP addresses and ranges that should be allowed or denied"
            defaultValue={{ address: '', directive: 'allow' }}
            addButtonText="Add Rule"
            emptyPlaceholder="No access rules defined. Add rules to control IP-based access."
            ItemComponent={AccessRuleComponent}
          />
        </FormSection>
      </TabPanel>
    </BaseDrawer>
  )
}