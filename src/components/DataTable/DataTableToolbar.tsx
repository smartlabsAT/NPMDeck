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
  Chip,
  Stack,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  Typography,
} from '@mui/material'
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
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
        <Stack spacing={2}>
          {/* Search and Filters Row */}
          <Box display="flex" gap={2} alignItems="center">
            {searchable && (
              <TextField
                fullWidth
                variant="outlined"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
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
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {filters.map((filter) => (
              <FormControl key={filter.id} sx={{ minWidth: 150 }} size="small">
                <InputLabel>{filter.label}</InputLabel>
                <Select
                  value={activeFilters[filter.id] || filter.defaultValue || 'all'}
                  onChange={handleFilterChange(filter.id)}
                  label={filter.label}
                >
                  <MenuItem value="all">All</MenuItem>
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
            ))}

            {hasActiveFilters && (
              <Tooltip title="Clear all filters">
                <IconButton onClick={onClearFilters} color="primary">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <FilterIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Active filters:
              </Typography>
              {filters.map((filter) => {
                const value = activeFilters[filter.id]
                if (!value || value === 'all') return null

                const option = filter.options?.find(opt => opt.value === value)
                const label = option ? option.label : value

                return (
                  <Chip
                    key={filter.id}
                    label={`${filter.label}: ${label}`}
                    size="small"
                    onDelete={() => onFilter(filter.id, '')}
                  />
                )
              })}
              <Chip
                label="Clear all"
                size="small"
                onClick={onClearFilters}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  )
}