import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Box,
  CircularProgress,
  Typography
} from '@mui/material'
import { useFilteredData, useFilteredInfo } from '../hooks/useFilteredData'

interface Column<T> {
  id: string
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T) => React.ReactNode
}

interface FilteredDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  onRowClick?: (item: T) => void
  renderRow?: (item: T, columns: Column<T>[]) => React.ReactNode
  emptyMessage?: string
  keyExtractor?: (item: T) => string | number
}

function FilteredDataTable<T extends { id?: number; owner_user_id?: number }>({
  data,
  columns,
  loading = false,
  error = null,
  onRowClick,
  renderRow,
  emptyMessage = 'Keine Daten vorhanden',
  keyExtractor = (item) => item.id || Math.random()
}: FilteredDataTableProps<T>) {
  // Apply visibility filtering
  const visibleData = useFilteredData(data)
  const filterInfo = useFilteredInfo(data, visibleData)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
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
    <>
      {filterInfo.isFiltered && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Zeige {filterInfo.visibleCount} von {filterInfo.totalCount} Einträgen 
          (nur eigene Einträge werden angezeigt)
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibleData.map((item) => {
                if (renderRow) {
                  return (
                    <TableRow
                      key={keyExtractor(item)}
                      hover={!!onRowClick}
                      onClick={() => onRowClick?.(item)}
                      sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    >
                      {renderRow(item, columns)}
                    </TableRow>
                  )
                }

                return (
                  <TableRow
                    key={keyExtractor(item)}
                    hover={!!onRowClick}
                    onClick={() => onRowClick?.(item)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align}>
                        {column.render ? column.render(item) : (item as any)[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

export default FilteredDataTable