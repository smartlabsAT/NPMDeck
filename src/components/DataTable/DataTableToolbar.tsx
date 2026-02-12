import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
} from '@mui/material'
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { Filter } from './types'

interface DataTableToolbarProps {
  searchQuery: string
  onSearch: (query: string) => void
  filters: Filter[]
  activeFilters: Record<string, any>
  onFilter: (filterId: string, value: any) => void
  _onClearFilters: () => void
  _hasActiveFilters: boolean
  searchable: boolean
  searchPlaceholder: string
  isMobile?: boolean
}

export default function DataTableToolbar({
  searchQuery,
  onSearch,
  filters,
  activeFilters,
  onFilter,
  _onClearFilters,
  _hasActiveFilters,
  searchable,
  searchPlaceholder,
  isMobile = false,
}: DataTableToolbarProps) {
  const handleFilterChange = (filterId: string) => (event: SelectChangeEvent) => {
    const value = event.target.value
    onFilter(filterId, value === 'all' ? '' : value)
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(
      value => value !== '' && value !== 'all' && value != null
    ).length
  }

  const _activeFilterCount = getActiveFilterCount()

  if (!searchable && filters.length === 0) {
    return null
  }

  return (
    <Paper sx={{ mb: 2 }}>
      <Box sx={{
        p: 2
      }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "stretch",
            flexDirection: isMobile ? 'column' : 'row'
          }}>
          {searchable && (
            <TextField
              variant="outlined"
              size="small"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              sx={{ 
                flex: isMobile ? 'unset' : 1,
                width: isMobile ? '100%' : 'auto',
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => onSearch('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />
          )}

          {filters.map((filter) => {
            const currentValue = activeFilters[filter.id] ?? filter.defaultValue ?? ''
            const hasValue = currentValue !== ''
            
            return (
              <FormControl 
                key={filter.id} 
                sx={{ 
                  width: isMobile ? '100%' : 200, 
                  flexShrink: 0 
                }} 
                size="small"
              >
                <InputLabel>{filter.label}</InputLabel>
                <Select
                  value={currentValue}
                  onChange={handleFilterChange(filter.id)}
                  label={filter.label}
                  endAdornment={
                    hasValue && (
                      <InputAdornment position="end" sx={{ mr: 3 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            onFilter(filter.id, '')
                          }}
                          sx={{ mr: -1 }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                >
                  {filter.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1
                        }}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}