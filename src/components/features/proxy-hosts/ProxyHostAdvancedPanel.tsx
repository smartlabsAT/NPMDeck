import React from 'react'
import {
  Typography,
  Paper,
  Alert,
} from '@mui/material'
import { ProxyHost } from '../../../api/proxyHosts'

interface ProxyHostAdvancedPanelProps {
  host: ProxyHost
}

const ProxyHostAdvancedPanel: React.FC<ProxyHostAdvancedPanelProps> = ({
  host,
}) => {
  return (
    <>
      {host.advanced_config ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
            Custom Nginx Configuration
          </Typography>
          <Typography 
            variant="body2" 
            fontFamily="monospace" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              backgroundColor: 'background.default',
              p: 2,
              borderRadius: 1,
              mt: 1
            }}
          >
            {host.advanced_config}
          </Typography>
        </Paper>
      ) : (
        <Alert severity="info">
          No custom Nginx configuration defined for this proxy host.
        </Alert>
      )}
    </>
  )
}

export default ProxyHostAdvancedPanel