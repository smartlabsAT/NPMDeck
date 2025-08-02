import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Checkbox,
  TablePagination,
  IconButton,
  FormControlLabel,
  Switch,
  Collapse,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
} from '@mui/icons-material'
import { visuallyHidden } from '@mui/utils'
import { DataTableProps } from './types'
import { useDataTable } from '../../hooks/useDataTable'
import DataTableToolbar from './DataTableToolbar'
import DataTableBulkActions from './DataTableBulkActions'

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  bulkActions = [],
  filters = [],
  filterFunction,
  searchPlaceholder = 'Search...',
  searchFields,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  stickyHeader = true,
  defaultSortField,
  defaultSortDirection,
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50, 100],
  selectable = false,
  searchable = true,
  showPagination = true,
  dense = false,
  groupConfig,
  showGroupToggle = true,
}: DataTableProps<T>) {
  const {
    sortField,
    sortDirection,
    page,
    rowsPerPage,
    searchQuery,
    filters: activeFilters,
    selected,
    paginatedData,
    groups,
    groupingEnabled,
    totalCount,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    handleSort,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearch,
    handleFilter,
    handleClearFilters,
    handleSelect,
    handleSelectAll,
    handleClearSelection,
    handleToggleGroup,
    handleToggleAllGroups,
    handleToggleGrouping,
  } = useDataTable(data, columns, keyExtractor, {
    defaultSortField,
    defaultSortDirection,
    defaultRowsPerPage,
    filterFunction,
    searchFields,
  }, groupConfig)

  const showBulkActions = selectable && selectedCount > 0 && bulkActions.length > 0
  const hasActiveFilters = Object.values(activeFilters).some(
    value => value !== '' && value !== 'all' && value != null
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <DataTableToolbar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        filters={filters}
        activeFilters={activeFilters}
        onFilter={handleFilter}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
      />

      {groupConfig && showGroupToggle && (
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={groupingEnabled}
                  onChange={handleToggleGrouping}
                />
              }
              label={`Group by ${groupConfig.groupLabel('', [])}`}
            />
            {groupingEnabled && groups.length > 0 && (
              <>
                <IconButton
                  size="small"
                  onClick={() => handleToggleAllGroups(true)}
                  title="Expand All"
                >
                  <ExpandAllIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleToggleAllGroups(false)}
                  title="Collapse All"
                >
                  <CollapseAllIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
      )}

      {showBulkActions && (
        <DataTableBulkActions
          selectedCount={selectedCount}
          actions={bulkActions}
          selectedItems={selected}
          onClearSelection={handleClearSelection}
        />
      )}

      <TableContainer component={Paper}>
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    inputProps={{
                      'aria-label': 'select all items',
                    }}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ width: column.width }}
                  sortDirection={sortField === column.id ? sortDirection : false}
                >
                  {column.headerRender ? (
                    column.headerRender()
                  ) : column.sortable ? (
                    <TableSortLabel
                      active={sortField === column.id}
                      direction={sortField === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {column.icon}
                        <Typography variant="subtitle2" fontWeight="bold">
                          {column.label}
                        </Typography>
                      </Box>
                      {sortField === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {column.icon}
                      <Typography variant="subtitle2" fontWeight="bold">
                        {column.label}
                      </Typography>
                    </Box>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 && (!groupingEnabled || groups.length === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery || hasActiveFilters
                      ? 'No results found. Try adjusting your search or filters.'
                      : emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : groupingEnabled && groups.length > 0 ? (
              // Grouped view
              groups.map((group) => (
                <React.Fragment key={group.id}>
                  {/* Group header row */}
                  <TableRow
                    sx={{
                      backgroundColor: 'action.hover',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.selected' }
                    }}
                    onClick={() => handleToggleGroup(group.id)}
                  >
                    <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          {group.isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                        </IconButton>
                        {groupConfig?.groupHeaderRender ? (
                          groupConfig.groupHeaderRender(group.id, group.items, group.isExpanded)
                        ) : (
                          <>
                            {group.label}
                            <Typography variant="body2" color="text.secondary">
                              ({group.items.length})
                            </Typography>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  
                  {/* Group items */}
                  {group.isExpanded && group.items.map((item) => {
                    const itemKey = keyExtractor(item)
                    const isSelected = selected.some(
                      selectedItem => keyExtractor(selectedItem) === itemKey
                    )

                    return (
                      <TableRow
                        key={itemKey}
                        hover
                        onClick={onRowClick ? () => onRowClick(item) : undefined}
                        selected={isSelected}
                        sx={{ 
                          cursor: onRowClick ? 'pointer' : 'default',
                          '& > td:first-of-type': {
                            pl: 6 // Indent first cell for grouped items
                          }
                        }}
                      >
                        {selectable && (
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleSelect(item)}
                              inputProps={{
                                'aria-label': `select item ${itemKey}`,
                              }}
                            />
                          </TableCell>
                        )}
                        {columns.map((column) => {
                          const value = column.accessor(item)
                          return (
                            <TableCell key={column.id} align={column.align || 'left'}>
                              {column.render ? column.render(value, item) : value}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </React.Fragment>
              ))
            ) : (
              // Normal view
              paginatedData.map((item) => {
                const itemKey = keyExtractor(item)
                const isSelected = selected.some(
                  selectedItem => keyExtractor(selectedItem) === itemKey
                )

                return (
                  <TableRow
                    key={itemKey}
                    hover
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    selected={isSelected}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelect(item)}
                          inputProps={{
                            'aria-label': `select item ${itemKey}`,
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = column.accessor(item)
                      return (
                        <TableCell key={column.id} align={column.align || 'left'}>
                          {column.render ? column.render(value, item) : value}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </Box>
  )
}