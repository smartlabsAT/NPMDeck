import React from 'react'
import { Box } from '@mui/material'
import { DataTable } from './DataTable'
import MobileCard from './MobileCard'
import { useResponsiveMode } from '../../hooks/useResponsive'
import {
  ResponsiveTableColumn,
  ResponsiveTableConfig,
  ResponsiveTableProps,
  getVisibleColumns,
  shouldUseCardLayout,
} from './ResponsiveTypes'

/**
 * Responsive table wrapper that automatically switches between
 * table and card layout based on screen size
 */
export function ResponsiveTable<T extends Record<string, any>>(
  props: ResponsiveTableProps<T>
) {
  const {
    columns,
    data,
    config = { responsive: true },
    ...dataTableProps
  } = props
  const mode = useResponsiveMode()
  const useCards = shouldUseCardLayout(mode, config)
  
  // Filter columns based on current mode
  const visibleColumns = React.useMemo(() => {
    if (!config.responsive) return columns
    return getVisibleColumns(columns, mode)
  }, [columns, mode, config.responsive])
  
  // Render card layout for mobile
  if (useCards && config.responsive) {
    return (
      <Box sx={{ width: '100%', p: { xs: 1, sm: 2 } }}>
        {data.map((row, index) => {
          // Use custom card renderer if provided
          if (config.renderCard) {
            return (
              <Box key={index}>
                {config.renderCard(row, columns)}
              </Box>
            )
          }
          
          // Use default MobileCard component
          return (
            <MobileCard
              key={index}
              row={row}
              columns={columns}
              onRowClick={dataTableProps.onRowClick}
            />
          )
        })}
      </Box>
    )
  }
  
  // Render regular table with filtered columns
  return (
    // @ts-expect-error - TypeScript has issues with generic props spreading
    <DataTable
      {...dataTableProps}
      columns={visibleColumns as any}
      data={data}
    />
  )
}

/**
 * HOC to make any DataTable responsive
 */
export function withResponsiveTable<T extends Record<string, any>>(
  config?: ResponsiveTableConfig
) {
  return function ResponsiveTableHOC(props: ResponsiveTableProps<T>) {
    return <ResponsiveTable {...props} config={{ ...config, ...props.config }} />
  }
}

/**
 * Helper hook to use responsive table configuration
 */
export function useResponsiveTable<T>(
  columns: ResponsiveTableColumn<T>[],
  config?: ResponsiveTableConfig
) {
  const mode = useResponsiveMode()
  const visibleColumns = React.useMemo(() => {
    if (!config?.responsive) return columns
    return getVisibleColumns(columns, mode)
  }, [columns, mode, config?.responsive])
  
  const useCards = shouldUseCardLayout(mode, config)
  
  return {
    mode,
    visibleColumns,
    useCards,
    isCompact: mode === 'compact',
    isMobile: mode === 'mobile',
    isFullWidth: mode === 'full',
  }
}

export default ResponsiveTable