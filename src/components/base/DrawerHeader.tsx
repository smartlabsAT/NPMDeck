import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * Props for DrawerHeader
 */
export interface DrawerHeaderProps {
  /** Title content displayed in the header */
  title: React.ReactNode;
  /** Optional icon displayed before the title */
  titleIcon?: React.ReactNode;
  /** Optional subtitle displayed below the title */
  subtitle?: React.ReactNode;
  /** Called when the close button is clicked */
  onClose: () => void;
}

/**
 * DrawerHeader - Sticky header for BaseDrawer containing title, subtitle, and close button
 */
const DrawerHeader = ({ title, titleIcon, subtitle, onClose }: DrawerHeaderProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 2,
      borderBottom: 1,
      borderColor: 'divider',
      position: 'sticky',
      top: 0,
      backgroundColor: 'background.paper',
      zIndex: 1,
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {titleIcon}
        <Typography
          variant="h6"
          component="h2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Typography>
      </Box>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
    <IconButton onClick={onClose} size="small" aria-label="Close drawer" sx={{ ml: 1 }}>
      <CloseIcon />
    </IconButton>
  </Box>
);

export default DrawerHeader;
