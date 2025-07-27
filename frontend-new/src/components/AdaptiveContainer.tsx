import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useUISettingsStore } from '../stores/uiSettingsStore'
import { EntityType, Operation } from '../types/uiSettings'

interface AdaptiveContainerProps {
  open: boolean
  onClose: () => void
  entity: EntityType
  operation: Operation
  title: string | React.ReactNode
  children: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({
  open,
  onClose,
  entity,
  operation,
  title,
  children,
  actions,
  maxWidth = 'md',
  fullWidth = true
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { getContainerType, drawerPosition, drawerWidth } = useUISettingsStore()
  
  // On mobile, always use full-screen dialog
  const containerType = isMobile ? 'dialog' : getContainerType(entity, operation)
  
  if (containerType === 'drawer' && !isMobile) {
    return (
      <Drawer
        anchor={drawerPosition}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: drawerWidth,
            maxWidth: '90vw',
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          {typeof title === 'string' ? (
            <Typography variant="h6">{title}</Typography>
          ) : (
            title
          )}
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          {children}
        </Box>
        
        {actions && (
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
              justifyContent: 'flex-end'
            }}
          >
            {actions}
          </Box>
        )}
      </Drawer>
    )
  }
  
  // Dialog layout
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions sx={{ p: 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default AdaptiveContainer