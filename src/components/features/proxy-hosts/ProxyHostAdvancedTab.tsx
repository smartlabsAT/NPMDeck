import React from 'react'
import {
  TextField,
  Alert,
} from '@mui/material'
import FormSection from '../../shared/FormSection'
import type { ProxyHostFormData } from './proxyHostFormTypes'

interface AdvancedTabProps {
  data: ProxyHostFormData
  setFieldValue: (field: keyof ProxyHostFormData, value: ProxyHostFormData[keyof ProxyHostFormData]) => void
}

const ProxyHostAdvancedTab = React.memo(({ data, setFieldValue }: AdvancedTabProps) => {
  return (
    <FormSection title="Custom Configuration">
      <Alert severity="warning" sx={{ mb: 2 }}>
        Please note, that any add_header or set_header directives added here will not be
        used by nginx. You will have to add a custom location &apos;/&apos; and add the header
        directives there.
      </Alert>

      <TextField
        label="Custom Nginx Configuration"
        multiline
        rows={10}
        value={data.advancedConfig}
        onChange={(e) => setFieldValue('advancedConfig', e.target.value)}
        placeholder="# Add your custom Nginx configuration here"
        fullWidth
        sx={{
          '& .MuiInputBase-root': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }
        }}
      />
    </FormSection>
  )
})

ProxyHostAdvancedTab.displayName = 'AdvancedTab'

export default ProxyHostAdvancedTab
