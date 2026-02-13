import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Search as SearchIcon,
} from '@mui/icons-material'
import { useGlobalSearch } from '../contexts/GlobalSearchContext'
import { TIMING } from '../constants/timing'
import { SearchResult } from '../types/search'
import SearchResultItem from './features/search/SearchResultItem'

const SearchBar = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  

  // Use GlobalSearch context - this must be called unconditionally
  const searchContext = useGlobalSearch()
  const { searchState, preloadData, searchResults, quickActions } = searchContext
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
      }, TIMING.PREVENT_REOPEN)
    }, TIMING.NAVIGATION_DELAY) // Delay to ensure dropdown animation completes
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
      getOptionLabel={(option) => 'type' in option && option.type === 'divider' ? '' : 'title' in option ? option.title : ''}
      isOptionEqualToValue={(option, value) => 'id' in option && 'id' in value && option.id === value.id}
      onChange={(_, value) => handleSelect(value as SearchResult)}
      loading={isLoading}
      loadingText="Loading resources..."
      noOptionsText={inputValue ? "No results found" : "Start typing to search..."}
      sx={{ width: '100%', maxWidth: 600 }}
      disablePortal={false}
      slotProps={{
        popper: {
          placement: 'bottom-start',
          sx: {
            zIndex: 1300,
          },
          modifiers: [
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                boundariesElement: 'viewport',
              },
            },
          ],
        },
      }}
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
          slotProps={{
            input: {
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
            }
          }}
        />
      )}
      renderOption={(props, option) => (
        <SearchResultItem key={'id' in option ? option.id : 'divider'} option={option} listItemProps={props} />
      )}
      slots={{
        paper: ({ children }) => (
          <Paper 
            elevation={8} 
            sx={{ 
              maxHeight: '60vh',
              overflow: 'auto'
            }}
          >
            {children}
          </Paper>
        )
      }}
    />
  );
}

export default SearchBar