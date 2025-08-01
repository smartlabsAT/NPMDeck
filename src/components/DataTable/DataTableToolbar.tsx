import React from 'react'
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
  onClearFilters: () => void
  hasActiveFilters: boolean
  searchable: boolean
  searchPlaceholder: string
}

export default function DataTableToolbar({
  searchQuery,
  onSearch,
  filters,
  activeFilters,
  onFilter,
  onClearFilters,
  hasActiveFilters,
  searchable,
  searchPlaceholder,
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

  const activeFilterCount = getActiveFilterCount()

  if (!searchable && filters.length === 0) {
    return null
  }

  return (
    <Paper sx={{ mb: 2 }}>
      <Box p={2}>
        <Box display="flex" gap={2} alignItems="stretch">
          {searchable && (
            <TextField
              variant="outlined"
              size="small"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
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
              }}
            />
          )}

          {filters.map((filter) => {
            const currentValue = activeFilters[filter.id] || filter.defaultValue || 'all'
            const hasValue = currentValue !== 'all'
            
            return (
              <FormControl key={filter.id} sx={{ width: 200, flexShrink: 0 }} size="small">
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
                      <Box display="flex" alignItems="center" gap={1}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )
          })}
        </Box>
      </Box>
    </Paper>
  )
}