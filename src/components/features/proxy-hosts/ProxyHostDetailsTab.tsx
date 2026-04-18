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
  RadioGroup,
  Radio,
  FormLabel,
  InputAdornment,
} from '@mui/material'
import { Security as SecurityIcon } from '@mui/icons-material'
import { AccessList } from '../../../api/accessLists'
import FormSection from '../../shared/FormSection'
import DomainInput from '../../DomainInput'
import type { ProxyHostFormData } from './proxyHostFormTypes'

interface DetailsTabProps {
  data: ProxyHostFormData
  setFieldValue: (field: keyof ProxyHostFormData, value: ProxyHostFormData[keyof ProxyHostFormData]) => void
  errors: Partial<Record<keyof ProxyHostFormData, string>>
  accessLists: AccessList[]
}

const ProxyHostDetailsTab = React.memo(({ data, setFieldValue, errors, accessLists }: DetailsTabProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormSection title="Host Details" required>
        <DomainInput
          value={data.domainNames}
          onChange={(domainNames) => setFieldValue('domainNames', domainNames)}
          helperText={errors.domainNames || "Press Enter after each domain or paste multiple domains. Wildcards are supported."}
          error={!!errors.domainNames}
          required
        />
      </FormSection>
      <FormSection title="Forward Configuration" required>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Scheme</FormLabel>
          <RadioGroup
            row
            value={data.forwardScheme}
            onChange={(e) => setFieldValue('forwardScheme', e.target.value as 'http' | 'https')}
          >
            <FormControlLabel value="http" control={<Radio />} label="HTTP" />
            <FormControlLabel value="https" control={<Radio />} label="HTTPS" />
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Forward Hostname / IP"
            value={data.forwardHost}
            onChange={(e) => setFieldValue('forwardHost', e.target.value)}
            placeholder="192.168.1.1 or example.com"
            error={!!errors.forwardHost}
            helperText={errors.forwardHost}
            required
            sx={{ flex: 1 }}
          />
          <TextField
            label="Forward Port"
            value={data.forwardPort}
            onChange={(e) => setFieldValue('forwardPort', parseInt(e.target.value) || 0)}
            type="number"
            error={!!errors.forwardPort}
            helperText={errors.forwardPort}
            required
            sx={{ width: 120 }}
            slotProps={{
              input: {
                inputProps: { min: 1, max: 65535 }
              }
            }}
          />
        </Box>
      </FormSection>
      <FormSection title="Options">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={data.cacheAssets}
                onChange={(e) => setFieldValue('cacheAssets', e.target.checked)}
              />
            }
            label="Cache Assets"
          />
          <FormControlLabel
            control={
              <Switch
                checked={data.blockExploits}
                onChange={(e) => setFieldValue('blockExploits', e.target.checked)}
              />
            }
            label="Block Common Exploits"
          />
          <FormControlLabel
            control={
              <Switch
                checked={data.websocketSupport}
                onChange={(e) => setFieldValue('websocketSupport', e.target.checked)}
              />
            }
            label="Websockets Support"
          />
        </Box>
      </FormSection>
      <FormSection title="Access Control">
        <FormControl fullWidth>
          <InputLabel>Access List</InputLabel>
          <Select
            value={data.accessListId}
            onChange={(e) => setFieldValue('accessListId', Number(e.target.value))}
            label="Access List"
            startAdornment={
              <InputAdornment position="start">
                <SecurityIcon />
              </InputAdornment>
            }
          >
            <MenuItem value={0}>
              <em>Publicly Accessible</em>
            </MenuItem>
            {accessLists.map((list) => (
              <MenuItem key={list.id} value={list.id}>
                {list.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FormSection>
    </Box>
  )
})

ProxyHostDetailsTab.displayName = 'DetailsTab'

export default ProxyHostDetailsTab
