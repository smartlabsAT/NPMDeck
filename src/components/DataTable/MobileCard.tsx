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
  
  // Separate columns by display type (exclude actions column from regular columns)
  const primaryColumns = columns.filter(col => col.priority === 'P1' && col.showInCard !== false && col.id !== 'actions')
  const secondaryColumns = columns.filter(col => col.priority === 'P2' && col.showInCard !== false && col.id !== 'actions')
  const detailColumns = columns.filter(col => col.priority === 'P3' && col.showInCard !== false && col.id !== 'actions')
  // Action column is handled separately in the actions section
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
        width: '100%', // Full width
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
      <CardContent sx={{ 
        pb: 1,
        p: { xs: 1.5, sm: 2 }, // Consistent padding
      }}>
        {/* Primary Section - More flexible layout for small screens */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: 1,
          flexDirection: 'row', // Always horizontal to maximize space
          width: '100%',
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Primary Value */}
            {primaryValue && (
              <Typography 
                variant="subtitle1" 
                component="div" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '1rem',
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {primaryValue}
              </Typography>
            )}
            
            {/* Secondary Values - More flexible wrapping */}
            <Box sx={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              mt: 0.5,
            }}>
              {primaryColumns.slice(1).map((col) => {
                const value = col.cardDisplay ? 
                  col.cardDisplay(col.accessor(row), row) :
                  col.render ? 
                    col.render(col.accessor(row), row) :
                    col.accessor(row)
                
                if (!value) return null
                
                return (
                  <Box key={col.id} sx={{ display: 'flex', alignItems: 'center' }}>
                    {typeof value === 'string' || typeof value === 'number' ? (
                      <Chip
                        label={value}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 24,
                          maxWidth: '200px',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            px: 1,
                          }
                        }}
                      />
                    ) : (
                      value
                    )}
                  </Box>
                )
              })}
            </Box>
            
            {/* Secondary Information - Responsive layout */}
            {secondaryColumns.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {secondaryColumns.map((col) => {
                  const value = col.cardDisplay ? 
                    col.cardDisplay(col.accessor(row), row) :
                    col.render ? 
                      col.render(col.accessor(row), row) :
                      col.accessor(row)
                  
                  if (!value) return null
                  
                  // If no mobileLabel and label is explicitly set to empty, show value only
                  const showLabel = col.mobileLabel !== '' && (col.mobileLabel || col.label)
                  
                  return (
                    <Box key={col.id} sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}>
                      {showLabel && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            minWidth: 80,
                            fontSize: '0.75rem',
                            flexShrink: 0
                          }}>
                          {col.mobileLabel || col.label}:
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{
                          fontSize: '0.875rem',
                          wordBreak: 'break-word',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {typeof value === 'string' || typeof value === 'number' ? value : <>{value}</>}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
          
          {/* Actions Section - Show action buttons and expand button */}
          {(actionColumn || actions || detailColumns.length > 0) && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}>
              {/* Action buttons from column (edit, delete, etc.) */}
              {actionColumn && (
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5 }}>
                  {actionColumn.render?.(actionColumn.accessor(row), row)}
                </Box>
              )}
              
              {/* Custom Actions (like checkbox) */}
              {actions}
              
              {/* Expand Button if there are detail columns - always at the end */}
              {detailColumns.length > 0 && (
                <IconButton
                  size="small"
                  onClick={handleExpandClick}
                  sx={{
                    transform: localExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: theme.transitions.create('transform'),
                    p: { xs: 0.5, sm: 1 },
                    ml: 'auto', // Push to the right
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
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        minWidth: 100
                      }}>
                      {col.mobileLabel || col.label}:
                    </Typography>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {typeof value === 'string' || typeof value === 'number' ? value : <>{value}</>}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
}

export default MobileCard