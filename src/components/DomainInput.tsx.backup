import { Autocomplete, TextField, Box, InputAdornment, IconButton, Typography } from '@mui/material'
import { 
  Language as LanguageIcon, 
  Close as CloseIcon
} from '@mui/icons-material'
import { useState, useCallback, useMemo } from 'react'

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
  const [inputValue, setInputValue] = useState('')
  // Function to clean and extract domain from URL or domain string
  // Preserves: subdomains (including www), sub.sub.domains, ports, wildcards
  // Removes: protocol, paths, query params, hash fragments, spaces
  const cleanDomain = useCallback((input: string): string => {
    let domain = input.trim()
    
    // Remove emojis and unicode symbols
    domain = domain.replace(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    
    // Remove text in parentheses (like "(Wildcard)" or "(IPv4 mit Port)")
    domain = domain.replace(/\([^)]*\)/g, '')
    
    // Remove protocol (http://, https://, ftp://, etc.)
    domain = domain.replace(/^[a-zA-Z]+:\/\//, '')
    
    // Remove path, query parameters, and hash
    domain = domain.split('/')[0]
    domain = domain.split('?')[0]
    domain = domain.split('#')[0]
    
    // Remove all spaces (handles typos like "example . com")
    domain = domain.replace(/\s+/g, '')
    
    // Remove trailing dot if present
    domain = domain.replace(/\.$/, '')
    
    // Final trim
    domain = domain.trim()
    
    return domain
  }, [])
  
  // Validate if the input is a valid domain, IP, or special case
  const isValidDomain = useCallback((domain: string): boolean => {
    // Empty check
    if (!domain) return false
    
    // Check for invalid characters (only allow alphanumeric, dots, hyphens, colons, brackets, asterisks)
    // This excludes emojis, checkmarks, parentheses, etc.
    const validCharsRegex = /^[\w.\-:[\]*]+$/
    if (!validCharsRegex.test(domain)) {
      return false
    }
    
    // Wildcard domains (*.example.com)
    if (domain.startsWith('*.')) {
      const withoutWildcard = domain.substring(2)
      return isValidDomain(withoutWildcard)
    }
    
    // IPv4 address (with optional port)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/
    if (ipv4Regex.test(domain)) {
      const parts = domain.split(':')[0].split('.')
      return parts.every(part => {
        const num = parseInt(part, 10)
        return num >= 0 && num <= 255
      })
    }
    
    // IPv6 address (basic check, with optional port)
    if (domain.startsWith('[') && domain.includes(']')) {
      return true // Simplified IPv6 validation for bracketed format
    }
    if (domain.includes('::') && !domain.includes(' ')) {
      return true // Simplified IPv6 validation for :: notation
    }
    
    // Special cases
    if (domain === 'localhost' || domain.startsWith('localhost:')) {
      return true
    }
    
    // Development and local domains
    const SPECIAL_TLDS = ['.local', '.dev', '.test', '.localhost', '.example', '.invalid'] as const
    if (SPECIAL_TLDS.some(tld => domain.endsWith(tld))) {
      return true
    }
    
    // Standard domain (must contain at least one dot)
    if (domain.includes('.')) {
      // Basic validation - no consecutive dots, no starting/ending dots
      // Also check that it doesn't contain invalid patterns
      return !domain.includes('..') && 
             !domain.startsWith('.') && 
             !domain.endsWith('.') &&
             !domain.includes('.-') &&
             !domain.includes('-.')
    }
    
    return false
  }, [])
  
  const processDomains = useCallback((inputs: string[]): string[] => {
    const processed: string[] = []
    
    inputs.forEach(input => {
      // Check if the input contains multiple domains (newlines, commas, spaces, semicolons)
      if (input.includes('\n') || input.includes(',') || input.includes(';') || input.includes('\t')) {
        // Split by various delimiters
        const parts = input.split(/[\n,;\t]+/)
        parts.forEach(part => {
          const cleaned = cleanDomain(part)
          if (cleaned && isValidDomain(cleaned)) {
            processed.push(cleaned)
          }
        })
      } else if (input.includes(' ') && input.split(' ').length > 1) {
        // Handle space-separated domains
        const parts = input.split(/\s+/)
        parts.forEach(part => {
          const cleaned = cleanDomain(part)
          if (cleaned && isValidDomain(cleaned)) {
            processed.push(cleaned)
          }
        })
      } else {
        const cleaned = cleanDomain(input)
        if (cleaned && isValidDomain(cleaned)) {
          processed.push(cleaned)
        }
      }
    })
    
    return processed
  }, [cleanDomain, isValidDomain])
  
  const handleChange = useCallback((_event: React.SyntheticEvent, newValue: string[]) => {
    // Process new values with URL cleaning
    const processed = processDomains(newValue)
    
    // Remove duplicates
    const unique = Array.from(new Set(processed))
    onChange(unique)
  }, [onChange, processDomains])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedText = e.clipboardData.getData('text')
    
    // Check if paste contains multiple lines or delimiters
    if (pastedText.includes('\n') || pastedText.includes(',') || pastedText.includes(';') || pastedText.includes('\t')) {
      e.preventDefault()
      
      // Split by various delimiters and clean each domain
      const domains = pastedText
        .split(/[\n,;\t]+/)
        .map(d => cleanDomain(d))
        .filter(d => d && isValidDomain(d))
      
      if (domains.length > 0) {
        // Combine with existing domains and remove duplicates
        const combined = [...value, ...domains]
        const unique = Array.from(new Set(combined))
        onChange(unique)
        
        // Clear the input value
        setInputValue('')
      }
    } else {
      // For single domain, let the default behavior handle it but clean the domain
      // We'll process it when the user presses Enter
      const cleaned = cleanDomain(pastedText)
      if (cleaned !== pastedText) {
        e.preventDefault()
        setInputValue(cleaned)
      }
    }
  }, [value, onChange, cleanDomain, isValidDomain])
  
  const handleInputChange = useCallback((_event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue)
  }, [])
  
  // Process input when Enter is pressed
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault()
      const cleaned = cleanDomain(inputValue)
      if (cleaned && isValidDomain(cleaned)) {
        const combined = [...value, cleaned]
        const unique = Array.from(new Set(combined))
        onChange(unique)
        setInputValue('')
      }
    }
  }, [inputValue, value, onChange, cleanDomain, isValidDomain])
  
  // Clean URLs in input as user types - removed to prevent infinite loop
  // URL cleaning now happens on paste and when Enter is pressed

  const handleDelete = useCallback((index: number) => {
    const newDomains = [...value]
    newDomains.splice(index, 1)
    onChange(newDomains)
  }, [value, onChange])

  // Memoize sorted domains for display
  const sortedDomains = useMemo(() => [...value].sort(), [value])

  return (
    <>
      <Autocomplete
        multiple
        freeSolo
        options={[]}
        value={value}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        disabled={disabled}
        onKeyDown={handleKeyDown}
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
            onPaste={handlePaste}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <LanguageIcon />
                </InputAdornment>
              ),
            }}
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
          {sortedDomains.map((domain, index) => (
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