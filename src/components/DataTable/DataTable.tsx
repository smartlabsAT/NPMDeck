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
} from '@mui/material'
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
  searchPlaceholder = 'Search...',
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
  } = useDataTable(data, columns, keyExtractor, {
    defaultSortField,
    defaultSortDirection,
    defaultRowsPerPage,
  })

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
                      <Typography variant="subtitle2" fontWeight="bold">
                        {column.label}
                      </Typography>
                      {sortField === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    <Typography variant="subtitle2" fontWeight="bold">
                      {column.label}
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
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
            ) : (
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