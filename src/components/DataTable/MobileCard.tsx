import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  Divider,
  Collapse,
  useTheme,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import { ResponsiveTableColumn } from './ResponsiveTypes'

interface MobileCardProps<T = any> {
  row: T
  columns: ResponsiveTableColumn<T>[]
  onRowClick?: (row: T) => void
  expanded?: boolean
  onExpandToggle?: () => void
  actions?: React.ReactNode
}

/**
 * Generic mobile card component for responsive tables
 * Renders table rows as cards on mobile devices
 */
export function MobileCard<T extends Record<string, any>>({
  row,
  columns,
  onRowClick,
  expanded = false,
  onExpandToggle,
  actions,
}: MobileCardProps<T>) {
  const theme = useTheme()
  const [localExpanded, setLocalExpanded] = React.useState(expanded)
  
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onExpandToggle) {
      onExpandToggle()
    } else {
      setLocalExpanded(!localExpanded)
    }
  }
  
  // Separate columns by display type
  const primaryColumns = columns.filter(col => col.priority === 'P1' && col.showInCard !== false)
  const secondaryColumns = columns.filter(col => col.priority === 'P2' && col.showInCard !== false)
  const detailColumns = columns.filter(col => col.priority === 'P3' && col.showInCard !== false)
  const actionColumn = columns.find(col => col.id === 'actions')
  
  // Get primary display value (usually name or title)
  const primaryColumn = primaryColumns[0]
  const primaryValue = primaryColumn ? 
    (primaryColumn.cardDisplay ? 
      primaryColumn.cardDisplay(primaryColumn.accessor(row), row) :
      primaryColumn.render ? 
        primaryColumn.render(primaryColumn.accessor(row), row) :
        primaryColumn.accessor(row)
    ) : null
  
  return (
    <Card
      sx={{
        mb: 1,
        cursor: onRowClick ? 'pointer' : 'default',
        '&:hover': onRowClick ? {
          boxShadow: theme.shadows[4],
          bgcolor: theme.palette.action.hover,
        } : {},
        position: 'relative',
        overflow: 'visible',
      }}
      onClick={() => onRowClick?.(row)}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Primary Section */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            {/* Primary Value */}
            {primaryValue && (
              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                {primaryValue}
              </Typography>
            )}
            
            {/* Secondary Values in same line */}
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {primaryColumns.slice(1).map((col) => {
                const value = col.cardDisplay ? 
                  col.cardDisplay(col.accessor(row), row) :
                  col.render ? 
                    col.render(col.accessor(row), row) :
                    col.accessor(row)
                
                if (!value) return null
                
                return (
                  <Box key={col.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {typeof value === 'string' || typeof value === 'number' ? (
                      <Chip
                        label={value}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20 }}
                      />
                    ) : (
                      value
                    )}
                  </Box>
                )
              })}
            </Stack>
            
            {/* Secondary Information */}
            {secondaryColumns.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {secondaryColumns.map((col) => {
                  const value = col.cardDisplay ? 
                    col.cardDisplay(col.accessor(row), row) :
                    col.render ? 
                      col.render(col.accessor(row), row) :
                      col.accessor(row)
                  
                  if (!value) return null
                  
                  return (
                    <Box key={col.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                        {col.mobileLabel || col.label}:
                      </Typography>
                      <Typography variant="body2">
                        {typeof value === 'string' || typeof value === 'number' ? value : <>{value}</>}
                      </Typography>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Box>
          
          {/* Actions Section */}
          {(actionColumn || actions || detailColumns.length > 0) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Quick Actions */}
              {actionColumn && (
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5 }}>
                  {actionColumn.render?.(actionColumn.accessor(row), row)}
                </Box>
              )}
              
              {/* Custom Actions */}
              {actions}
              
              {/* Expand Button if there are detail columns */}
              {detailColumns.length > 0 && (
                <IconButton
                  size="small"
                  onClick={handleExpandClick}
                  sx={{
                    transform: localExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: theme.transitions.create('transform'),
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
        
        {/* Expandable Details Section */}
        {detailColumns.length > 0 && (
          <Collapse in={localExpanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.5}>
              {detailColumns.map((col) => {
                const value = col.cardDisplay ? 
                  col.cardDisplay(col.accessor(row), row) :
                  col.render ? 
                    col.render(col.accessor(row), row) :
                    col.accessor(row)
                
                if (!value) return null
                
                return (
                  <Box key={col.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>
                      {col.mobileLabel || col.label}:
                    </Typography>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {typeof value === 'string' || typeof value === 'number' ? value : <>{value}</>}
                    </Typography>
                  </Box>
                )
              })}
            </Stack>
          </Collapse>
        )}
      </CardContent>
    </Card>
  )
}

export default MobileCard