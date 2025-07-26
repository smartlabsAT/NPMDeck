import { Autocomplete, TextField, Box, InputAdornment, IconButton, Typography } from '@mui/material'
import { 
  Language as LanguageIcon, 
  Close as CloseIcon
} from '@mui/icons-material'

interface DomainInputProps {
  value: string[]
  onChange: (domains: string[]) => void
  label?: string
  placeholder?: string
  helperText?: string
  required?: boolean
  error?: boolean
  disabled?: boolean
}

export default function DomainInput({
  value,
  onChange,
  label = "Domain Names",
  placeholder = "Type domain and press Enter or paste multiple domains",
  helperText = "Press Enter after each domain or paste multiple domains (one per line)",
  required = false,
  error = false,
  disabled = false
}: DomainInputProps) {
  const handleChange = (_: any, newValue: string[]) => {
    // Process new values
    const processed: string[] = []
    
    newValue.forEach(value => {
      // Check if the value contains newlines or commas
      if (value.includes('\n') || value.includes(',')) {
        // Split by newlines and commas
        const parts = value.split(/[\n,]/)
        parts.forEach(part => {
          const trimmed = part.trim()
          if (trimmed) {
            processed.push(trimmed)
          }
        })
      } else {
        const trimmed = value.trim()
        if (trimmed) {
          processed.push(trimmed)
        }
      }
    })
    
    // Remove duplicates
    const unique = Array.from(new Set(processed))
    onChange(unique)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    
    // Split by newlines, commas, and multiple spaces
    const domains = pastedText
      .split(/[\n,]+/)
      .map(d => d.trim())
      .filter(d => d && d.includes('.')) // Basic domain validation
    
    if (domains.length > 0) {
      // Combine with existing domains and remove duplicates
      const combined = [...value, ...domains]
      const unique = Array.from(new Set(combined))
      onChange(unique)
      
      // Clear the input field
      const input = e.target as HTMLInputElement
      input.value = ''
    }
  }

  const handleDelete = (index: number) => {
    const newDomains = [...value]
    newDomains.splice(index, 1)
    onChange(newDomains)
  }

  return (
    <>
      <Autocomplete
        multiple
        freeSolo
        options={[]}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        renderTags={() => null} // Don't render tags in the input
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            helperText={helperText}
            margin="normal"
            required={required}
            error={error}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <LanguageIcon />
                </InputAdornment>
              ),
            }}
            onPaste={handlePaste}
          />
        )}
      />
      
      {/* Display tags below the input - vertical list */}
      {value.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Domains will be sorted alphabetically by the system.
          </Typography>
          <Box 
            sx={{ 
              mt: 1, 
              maxHeight: 300, 
              overflowY: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1
            }}
          >
          {/* Sort domains alphabetically for display */}
          {[...value].sort().map((domain, index) => (
            <Box
              key={domain}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                px: 1,
                mb: 0.5,
                backgroundColor: 'background.paper',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                },
                '&:last-child': {
                  mb: 0
                }
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  minWidth: 20,
                  color: 'text.secondary',
                  fontWeight: 'bold'
                }}
              >
                {index + 1}.
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2">{domain}</Typography>
              </Box>
              {!disabled && (
                <IconButton
                  size="small"
                  onClick={() => {
                    const originalIndex = value.indexOf(domain)
                    handleDelete(originalIndex)
                  }}
                  sx={{ p: 0.5 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          </Box>
        </>
      )}
    </>
  )
}