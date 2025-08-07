import * as React from 'react'
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  Button,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import {
  Lock as LockIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { Certificate } from '../../api/certificates'

interface CertificateSelectorProps {
  value: Certificate | null
  onChange: (certificate: Certificate | null) => void
  certificates: Certificate[]
  loading?: boolean
  error?: string | boolean
  helperText?: string
  required?: boolean
  disabled?: boolean
  showDomainInfo?: boolean
  showAddButton?: boolean
  onAddClick?: () => void
  label?: string
  placeholder?: string
  fullWidth?: boolean
  includeNewOption?: boolean
  onNewOptionSelect?: () => void
}

export default function CertificateSelector({
  value,
  onChange,
  certificates,
  loading = false,
  error,
  helperText,
  required = false,
  disabled = false,
  showDomainInfo = true,
  showAddButton = true,
  onAddClick,
  label = "SSL Certificate",
  placeholder = "Search for a certificate...",
  fullWidth = true,
  includeNewOption = false,
  onNewOptionSelect,
}: CertificateSelectorProps) {
  
  // Helper function to get certificate status
  const getCertificateStatus = (cert: Certificate) => {
    const expiryDate = new Date(cert.expires_on)
    const now = new Date()
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return {
        color: 'error' as const,
        text: 'Expired',
        icon: ErrorIcon
      }
    } else if (daysUntilExpiry < 30) {
      return {
        color: 'warning' as const,
        text: `Expires in ${daysUntilExpiry} days`,
        icon: WarningIcon
      }
    } else {
      return {
        color: 'success' as const,
        text: `Valid for ${daysUntilExpiry} days`,
        icon: CheckCircleIcon
      }
    }
  }
  
  // Prepare options list
  const options = React.useMemo(() => {
    if (includeNewOption) {
      return [
        ...certificates,
        { id: 'new', nice_name: 'Request a new SSL Certificate', provider: 'letsencrypt' } as any
      ]
    }
    return certificates
  }, [certificates, includeNewOption])
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Autocomplete
        fullWidth={fullWidth}
        value={value}
        onChange={(_, newValue: any) => {
          if (newValue && newValue.id === 'new') {
            if (onNewOptionSelect) {
              onNewOptionSelect()
            }
          } else {
            onChange(newValue)
          }
        }}
        options={options}
        loading={loading}
        disabled={disabled}
        getOptionLabel={(option) => {
          // For custom certificates with nice_name, show that
          if (option.nice_name) {
            return option.nice_name
          }
          // For Let's Encrypt or certificates without nice_name, show domains
          if (option.domain_names && option.domain_names.length > 0) {
            // Show max 2 domains in the label
            const displayDomains = option.domain_names.slice(0, 2).join(', ')
            return option.domain_names.length > 2 
              ? `${displayDomains} +${option.domain_names.length - 2} more`
              : displayDomains
          }
          return `Certificate #${option.id}`
        }}
        renderOption={(props, option: any) => {
          // Special rendering for "new" option
          if (option.id === 'new') {
            return (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon color="primary" />
                  <Typography variant="body2" color="primary">
                    {option.nice_name}
                  </Typography>
                </Box>
              </Box>
            )
          }
          
          const status = getCertificateStatus(option)
          const StatusIcon = status.icon
          
          return (
            <Box component="li" {...props}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {option.nice_name || `Certificate #${option.id}`}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StatusIcon fontSize="small" color={status.color} />
                    <Typography variant="caption" color={`${status.color}.main`}>
                      {status.text}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip 
                    label={option.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom'} 
                    size="small" 
                    color={option.provider === 'letsencrypt' ? 'primary' : 'default'}
                  />
                  {option.domain_names && option.domain_names.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Domains: {option.domain_names.slice(0, 3).join(', ')}
                      {option.domain_names.length > 3 && ` +${option.domain_names.length - 3} more`}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={!!error}
            helperText={typeof error === 'string' ? error : helperText}
            required={required}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText={loading ? "Loading certificates..." : "No certificates found"}
      />
      
      {showDomainInfo && value && value.domain_names && value.domain_names.length > 0 && (
        <Alert severity="info" sx={{ mt: 1 }}>
          <Typography variant="caption">
            Certificate domains: {value.domain_names.join(', ')}
          </Typography>
        </Alert>
      )}
      
      {showAddButton && onAddClick && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="text"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddClick}
          >
            Request a new SSL Certificate
          </Button>
        </Box>
      )}
    </Box>
  )
}