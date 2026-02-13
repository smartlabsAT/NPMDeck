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
import MobileCard from './MobileCard'
import { useResponsiveMode } from '../../hooks/useResponsive'
import { ResponsiveTableColumn, getVisibleColumns, shouldUseCardLayout } from './ResponsiveTypes'

export function DataTable<T extends object>({
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
  responsive = false,
  cardBreakpoint = 'md',
  compactBreakpoint = 'lg',
  renderCard,
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

  const mode = useResponsiveMode()
  const useCards = responsive && shouldUseCardLayout(mode, { 
    responsive, 
    cardBreakpoint, 
    compactBreakpoint 
  })
  
  // Filter columns based on priority for responsive mode
  const visibleColumns = React.useMemo(() => {
    if (!responsive) return columns
    // Check if columns have priority properties
    const hasResponsiveColumns = columns.some((col) => 'priority' in col && col.priority)
    if (!hasResponsiveColumns) return columns
    return getVisibleColumns(columns as ResponsiveTableColumn<T>[], mode)
  }, [columns, mode, responsive])
  
  const showBulkActions = selectable && selectedCount > 0 && bulkActions.length > 0
  const hasActiveFilters = Object.values(activeFilters).some(
    value => value !== '' && value !== 'all' && value != null
  )

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px"
        }}>
        <CircularProgress />
      </Box>
    );
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
        _onClearFilters={handleClearFilters}
        _hasActiveFilters={hasActiveFilters}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        isMobile={useCards}
      />
      {groupConfig && showGroupToggle && !useCards && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            py: 1
          }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2
            }}>
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
      {showBulkActions && !useCards && (
        <DataTableBulkActions
          selectedCount={selectedCount}
          actions={bulkActions}
          selectedItems={selected}
          onClearSelection={handleClearSelection}
        />
      )}
      {/* Render card layout for mobile when responsive mode is enabled */}
      {useCards ? (
        <Box sx={{ 
          width: '100%', 
          p: 0, // No padding - cards use full width
          minWidth: 0, // Ensure proper flex behavior
          overflow: 'hidden', // Prevent horizontal scroll
        }}>
          {paginatedData.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2, mx: 0 }}>
              {searchQuery || hasActiveFilters
                ? 'No results found. Try adjusting your search or filters.'
                : emptyMessage}
            </Alert>
          ) : (
            paginatedData.map((item) => {
              const itemKey = keyExtractor(item)
              
              // Use custom card renderer if provided
              if (renderCard) {
                return (
                  <Box key={itemKey}>
                    {renderCard(item, columns as ResponsiveTableColumn<T>[], {
                      isSelected: false, // Selection disabled in card view
                      onSelect: () => {}, // No-op selection in card view
                      onRowClick: onRowClick ? () => onRowClick(item) : undefined,
                    })}
                  </Box>
                )
              }
              
              // Use default MobileCard component
              return (
                <MobileCard
                  key={itemKey}
                  row={item}
                  columns={columns as ResponsiveTableColumn<T>[]}
                  onRowClick={onRowClick}
                  // No checkbox in card view - selection disabled for mobile
                />
              )
            })
          )}
        </Box>
      ) : (
        /* Original table layout */
        (<TableContainer component={Paper}>
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
                {visibleColumns.map((column) => (
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5
                        }}>
                        {column.icon}
                        <Typography variant="subtitle2" sx={{
                          fontWeight: "bold"
                        }}>
                          {column.label}
                        </Typography>
                      </Box>
                      {sortField === column.id ? (
                        <Box component="span" sx={visuallyHidden as Record<string, unknown>}>
                          {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5
                      }}>
                      {column.icon}
                      <Typography variant="subtitle2" sx={{
                        fontWeight: "bold"
                      }}>
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
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    {searchQuery || hasActiveFilters
                      ? 'No results found. Try adjusting your search or filters.'
                      : emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : groupingEnabled && groups.length > 0 ? (
              // Grouped view
              (groups.map((group) => (
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
                    <TableCell colSpan={visibleColumns.length + (selectable ? 1 : 0)}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1
                        }}>
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          {group.isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                        </IconButton>
                        {groupConfig?.groupHeaderRender ? (
                          groupConfig.groupHeaderRender(group.id, group.items, group.isExpanded)
                        ) : (
                          <>
                            {group.label}
                            <Typography variant="body2" sx={{
                              color: "text.secondary"
                            }}>
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
                        {visibleColumns.map((column) => {
                          const value = column.accessor(item)
                          return (
                            <TableCell key={column.id} align={column.align || 'left'}>
                              {column.render ? column.render(value, item) : value as React.ReactNode}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </React.Fragment>
              )))
            ) : (
              // Normal view
              (paginatedData.map((item) => {
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
                    {visibleColumns.map((column) => {
                      const value = column.accessor(item)
                      return (
                        <TableCell key={column.id} align={column.align || 'left'}>
                          {column.render ? column.render(value, item) : value as React.ReactNode}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              }))
            )}
          </TableBody>
          </Table>
        </TableContainer>)
      )}
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
  );
}