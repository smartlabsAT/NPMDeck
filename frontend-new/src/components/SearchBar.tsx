import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Paper,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Search as SearchIcon,
  SwapHoriz,
  TrendingFlat,
  Block,
  Stream,
  Security,
  VpnKey,
  Group,
  Add,
  CheckCircle,
  Cancel,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { useGlobalSearch } from '../contexts/GlobalSearchContext'
import { SearchResult, ResourceType } from '../types/search'

const getResourceIcon = (type: ResourceType, isAction: boolean = false) => {
  if (type === 'action' && !isAction) {
    return <Add sx={{ color: 'primary.main' }} />
  }
  
  switch (type) {
    case 'proxy_hosts':
      return <SwapHoriz sx={{ color: '#5eba00' }} />
    case 'redirection_hosts':
      return <TrendingFlat sx={{ color: '#f1c40f' }} />
    case 'dead_hosts':
      return <Block sx={{ color: '#cd201f' }} />
    case 'streams':
      return <Stream sx={{ color: '#467fcf' }} />
    case 'access_lists':
      return <Security sx={{ color: '#2bcbba' }} />
    case 'certificates':
      return <VpnKey sx={{ color: '#467fcf' }} />
    case 'users':
      return <Group sx={{ color: '#868e96' }} />
    default:
      return <Add sx={{ color: 'primary.main' }} />
  }
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'online':
      return <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
    case 'offline':
      return <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />
    case 'disabled':
      return <Cancel sx={{ color: 'text.disabled', fontSize: 16 }} />
    default:
      return null
  }
}

const SearchBar: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  
  console.log('SearchBar component rendering')
  
  // Try to use GlobalSearch context, return null if not available
  let searchContext
  try {
    searchContext = useGlobalSearch()
    console.log('SearchBar: GlobalSearch context found')
  } catch (error) {
    console.warn('SearchBar: GlobalSearchProvider not found', error)
    // SearchBar is being rendered outside of GlobalSearchProvider
    return null
  }
  
  const { searchState, preloadData, searchQuery, setSearchQuery, searchResults, quickActions } = searchContext
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [preventReopen, setPreventReopen] = useState(false)

  // Pre-load data when input is focused
  const handleFocus = () => {
    if (!preventReopen) {
      setOpen(true)
      preloadData()
    }
  }

  // Filter results based on search query
  const filteredResults = useMemo(() => {
    if (!inputValue.trim()) {
      return []
    }

    const query = inputValue.toLowerCase()
    return searchResults.filter(result => {
      const searchableText = `${result.title} ${result.subtitle || ''}`.toLowerCase()
      return searchableText.includes(query)
    })
  }, [inputValue, searchResults])

  // Combine quick actions and search results
  const allOptions = useMemo(() => {
    const options: (SearchResult | { type: 'divider' })[] = []
    
    // Add quick actions
    if (quickActions.length > 0) {
      quickActions.forEach(action => {
        options.push({
          id: action.id,
          type: 'action',
          title: action.title,
          metadata: action.metadata,
          action: action.action,
        })
      })
      
      if (filteredResults.length > 0) {
        options.push({ type: 'divider' })
      }
    }
    
    // Add search results
    options.push(...filteredResults)
    
    return options
  }, [quickActions, filteredResults])

  // Handle selection
  const handleSelect = (option: SearchResult | null) => {
    if (!option) return

    // Prevent reopening and close dropdown
    setPreventReopen(true)
    setOpen(false)
    setInputValue('')
    
    // Small delay to ensure dropdown is closed before navigation
    setTimeout(() => {
      if (option.type === 'action' && option.action) {
        option.action()
      } else {
      // Navigate to resource detail
      switch (option.type) {
        case 'proxy_hosts':
          navigate(`/hosts/proxy/${option.resource?.id}/view`)
          break
        case 'redirection_hosts':
          navigate(`/hosts/redirection/${option.resource?.id}/view`)
          break
        case 'dead_hosts':
          navigate(`/hosts/404/${option.resource?.id}`)
          break
        case 'streams':
          navigate(`/hosts/streams/${option.resource?.id}/view`)
          break
        case 'access_lists':
          navigate(`/security/access-lists/${option.resource?.id}/view`)
          break
        case 'certificates':
          navigate(`/security/certificates/${option.resource?.id}/view`)
          break
        case 'users':
          navigate(`/admin/users/${option.resource?.id}/view`)
          break
      }
    }
    
      // Reset prevent reopen flag after navigation
      setTimeout(() => {
        setPreventReopen(false)
      }, 500)
    }, 100) // 100ms delay to ensure dropdown animation completes
  }

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.querySelector('#global-search-input') as HTMLInputElement
        input?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isLoading = searchState.isLoading || Object.values(searchState.loadingProgress).some(loading => loading)

  return (
    <Autocomplete
      open={open}
      onOpen={() => {
        if (!preventReopen) {
          setOpen(true)
        }
      }}
      onClose={() => {
        setOpen(false)
        setInputValue('')
      }}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      options={allOptions}
      getOptionLabel={(option) => option.type === 'divider' ? '' : option.title}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onChange={(_, value) => handleSelect(value as SearchResult)}
      loading={isLoading}
      loadingText="Loading resources..."
      noOptionsText={inputValue ? "No results found" : "Start typing to search..."}
      sx={{ width: 400, ml: 2 }}
      renderInput={(params) => (
        <TextField
          {...params}
          id="global-search-input"
          placeholder="Search or press ⌘K"
          variant="outlined"
          size="small"
          onFocus={handleFocus}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              '&:hover': {
                backgroundColor: theme.palette.background.paper,
              },
            },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                {isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SearchIcon />
                )}
              </InputAdornment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        if (option.type === 'divider') {
          return <Divider key="divider" />
        }

        // Determine the icon to show
        let icon
        if (option.type === 'action' && option.metadata?.resourceType) {
          console.log('Rendering action with resourceType:', option.metadata.resourceType)
          // For actions, show the Add icon with the resource type icon
          icon = (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Add sx={{ fontSize: 18 }} />
              {getResourceIcon(option.metadata.resourceType)}
            </Box>
          )
        } else {
          // For regular resources, show the resource icon
          icon = getResourceIcon(option.type)
        }

        return (
          <ListItem {...props} key={option.id}>
            <ListItemIcon sx={{ minWidth: 56 }}>
              {icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  {option.title}
                  {option.metadata?.ssl && (
                    <VpnKey sx={{ fontSize: 16, color: 'success.main' }} />
                  )}
                  {option.metadata?.status && getStatusIcon(option.metadata.status)}
                </Box>
              }
              secondary={
                <Box>
                  {option.subtitle && (
                    <Typography variant="caption" color="text.secondary">
                      {option.subtitle}
                    </Typography>
                  )}
                  {option.metadata?.owner && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      • {option.metadata.owner}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        )
      }}
      PaperComponent={({ children }) => (
        <Paper elevation={8} sx={{ maxHeight: 400, overflow: 'auto' }}>
          {children}
        </Paper>
      )}
    />
  )
}

export default SearchBar