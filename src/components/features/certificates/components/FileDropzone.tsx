import React, { useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  FormHelperText,
  Alert,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
} from '@mui/icons-material'

interface FileDropzoneProps {
  label: string
  icon: React.ReactNode
  file: File | null
  onFileSelect: (file: File) => void
  accept: string
  required?: boolean
  validateType?: 'certificate' | 'key'
  error?: string
  helperText?: string
}

// Validate file content helper
const validateFileContent = async (file: File, type: 'certificate' | 'key'): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const text = await file.text()
    
    if (type === 'certificate') {
      if (!text.includes('-----BEGIN CERTIFICATE-----')) {
        return {
          isValid: false,
          error: `${file.name} does not appear to be a certificate file. Certificate files should start with "-----BEGIN CERTIFICATE-----"`
        }
      }
    } else if (type === 'key') {
      if (!text.includes('-----BEGIN') || !text.includes('KEY-----')) {
        return {
          isValid: false,
          error: `${file.name} does not appear to be a private key file. Key files should start with "-----BEGIN PRIVATE KEY-----" or "-----BEGIN RSA PRIVATE KEY-----"`
        }
      }
    }
    
    return { isValid: true }
  } catch (err) {
    return {
      isValid: false,
      error: `Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`
    }
  }
}

export default function FileDropzone({
  label,
  icon,
  file,
  onFileSelect,
  accept,
  required = false,
  validateType,
  error,
  helperText
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const handleFileSelect = async (selectedFile: File) => {
    setValidationError(null)

    if (validateType) {
      const validation = await validateFileContent(selectedFile, validateType)
      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid file format')
        return
      }
    }

    onFileSelect(selectedFile)
  }

  const displayError = error || validationError

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label} {required && '*'}
      </Typography>
      
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: displayError ? 'error.main' : 'divider',
          backgroundColor: 'background.default',
          transition: 'all 0.3s',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: displayError ? 'error.main' : 'primary.main',
          },
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={async (e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) {
              await handleFileSelect(selectedFile)
            }
          }}
        />
        
        {file ? (
          <Box display="flex" alignItems="center" gap={2} width="100%">
            <CheckIcon color="success" sx={{ fontSize: 28 }} />
            <Box flex={1}>
              <Typography variant="body2" color="text.primary" noWrap>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={2} width="100%">
            <Box sx={{ '& > svg': { fontSize: 28 } }}>
              {icon}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Click to select file
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {accept.replace(/\./g, '').toUpperCase()} files
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {helperText && (
        <FormHelperText sx={{ mt: 1, color: 'text.secondary' }}>
          {helperText}
        </FormHelperText>
      )}

      {displayError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {displayError}
        </Alert>
      )}
    </Box>
  )
}