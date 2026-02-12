import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

/**
 * Tab configuration interface for BaseDrawer
 */
export interface Tab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Optional icon component */
  icon?: ReactNode;
  /** Badge content (number or text) */
  badge?: string | number;
  /** Badge color */
  badgeColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Whether the tab has validation errors */
  hasError?: boolean;
}

/**
 * Props interface for BaseDrawer component
 */
export interface BaseDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Function to call when drawer should close */
  onClose: () => void;
  /** Title displayed in the drawer header */
  title: React.ReactNode;
  /** Optional icon for the title */
  titleIcon?: React.ReactNode;
  /** Optional subtitle */
  subtitle?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Error message to display */
  error?: string | null;
  /** Success message to display */
  success?: string;
  /** Tabs configuration */
  tabs?: Tab[];
  /** Active tab index */
  activeTab?: number;
  /** Tab change handler */
  onTabChange?: (index: number) => void;
  /** Content to display in the drawer */
  children: ReactNode;
  /** Actions to display in the footer */
  actions?: ReactNode;
  /** Whether the form has unsaved changes */
  isDirty?: boolean;
  /** Function to call when save is requested */
  onSave?: () => void;
  /** Function to call when cancel is requested */
  onCancel?: () => void;
  /** Whether save action is disabled */
  saveDisabled?: boolean;
  /** Custom save button text */
  saveText?: string;
  /** Custom cancel button text */
  cancelText?: string;
  /** Drawer width */
  width?: number | string;
  /** Whether to show close confirmation for dirty forms */
  confirmClose?: boolean;
  /** Custom confirm close message */
  confirmCloseMessage?: string;
  /** Additional CSS class name */
  className?: string;
  /** Whether to disable backdrop click to close */
  disableBackdropClick?: boolean;
  /** Whether to disable escape key to close */
  disableEscapeKeyDown?: boolean;
}

/**
 * BaseDrawer - A comprehensive, reusable drawer component for NPMDeck
 * 
 * This component provides a consistent interface for all drawer-based forms
 * in the application, including:
 * - Responsive design with mobile-first approach
 * - Tab support with badges and validation states
 * - Loading states and error handling
 * - Dirty state tracking with close confirmation
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Customizable actions and styling
 * 
 * @example
 * ```tsx
 * <BaseDrawer
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Edit Proxy Host"
 *   tabs={[
 *     { id: 'details', label: 'Details', hasError: hasDetailsError },
 *     { id: 'ssl', label: 'SSL', badge: certificateCount }
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   isDirty={formIsDirty}
 *   onSave={handleSave}
 *   loading={isSubmitting}
 * >
 *   {renderTabContent()}
 * </BaseDrawer>
 * ```
 */
export const BaseDrawer = ({
  open,
  onClose,
  title,
  titleIcon,
  subtitle,
  loading = false,
  loadingMessage = 'Loading...',
  error,
  success,
  tabs = [],
  activeTab = 0,
  onTabChange,
  children,
  actions,
  isDirty = false,
  onSave,
  onCancel,
  saveDisabled = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  width = 600,
  confirmClose = true,
  confirmCloseMessage = 'You have unsaved changes. Are you sure you want to close?',
  className,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
}: BaseDrawerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Calculate responsive width
  const drawerWidth = React.useMemo(() => {
    if (isMobile) return '100%';
    if (typeof width === 'number') return Math.min(width, window.innerWidth * 0.9);
    return width;
  }, [width, isMobile]);

  /**
   * Handle drawer close with dirty state confirmation
   */
  const handleClose = useCallback(() => {
    if (isDirty && confirmClose) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, confirmClose, onClose]);

  /**
   * Handle confirmed close
   */
  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    onClose();
  }, [onClose]);

  /**
   * Handle tab change with validation
   */
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    if (onTabChange && tabs[newValue] && !tabs[newValue].disabled) {
      onTabChange(newValue);
    }
  }, [onTabChange, tabs]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      // Escape key handling
      if (event.key === 'Escape' && !disableEscapeKeyDown) {
        event.preventDefault();
        handleClose();
      }

      // Tab navigation with Ctrl+Tab / Ctrl+Shift+Tab
      if (event.ctrlKey && event.key === 'Tab' && tabs.length > 1) {
        event.preventDefault();
        const direction = event.shiftKey ? -1 : 1;
        const newIndex = (activeTab + direction + tabs.length) % tabs.length;
        
        // Skip disabled tabs
        let finalIndex = newIndex;
        while (tabs[finalIndex]?.disabled && finalIndex !== activeTab) {
          finalIndex = (finalIndex + direction + tabs.length) % tabs.length;
        }
        
        if (onTabChange && !tabs[finalIndex]?.disabled) {
          onTabChange(finalIndex);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, activeTab, tabs, onTabChange, disableEscapeKeyDown, handleClose]);

  /**
   * Render tab with badge and error state
   */
  const renderTab = (tab: Tab, _index: number) => (
    <Tab
      key={tab.id}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <Badge
              badgeContent={tab.badge}
              color={tab.hasError ? 'error' : (tab.badgeColor || 'default')}
              variant={typeof tab.badge === 'string' ? 'dot' : 'standard'}
            />
          )}
          {tab.hasError && !tab.badge && (
            <Chip
              size="small"
              color="error"
              variant="outlined"
              label="!"
              sx={{ minWidth: 'auto', width: 20, height: 20 }}
            />
          )}
        </Box>
      }
      disabled={tab.disabled}
      sx={{
        color: tab.hasError ? theme.palette.error.main : undefined,
        '&.Mui-selected': {
          color: tab.hasError ? theme.palette.error.main : theme.palette.primary.main,
        },
      }}
    />
  );

  /**
   * Render default actions if not provided
   */
  const renderActions = () => {
    if (actions) return actions;
    
    if (!onSave && !onCancel) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
            startIcon={<CancelIcon />}
          >
            {cancelText}
          </Button>
        )}
        {onSave && (
          <Button
            variant="contained"
            onClick={onSave}
            disabled={loading || saveDisabled}
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saveText}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={disableBackdropClick ? undefined : handleClose}
        className={className}
        ModalProps={{
          keepMounted: false, // Better performance on mobile
        }}
        slotProps={{
          paper: {
            sx: {
              width: drawerWidth,
              maxWidth: '100vw',
              display: 'flex',
              flexDirection: 'column',
            },
          }
        }}
      >
        {/* Header */}
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
                  color: "text.secondary",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            aria-label="Close drawer"
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: (theme) => 
                theme.palette.mode === 'dark' 
                  ? 'rgba(0, 0, 0, 0.8)' 
                  : 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              {loadingMessage}
            </Typography>
          </Box>
        )}

        {/* Tabs */}
        {tabs.length > 0 && (
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              position: 'sticky',
              top: '73px',
              backgroundColor: 'background.paper',
              zIndex: 1,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons="auto"
              sx={{ '& .MuiTabScrollButton-root': { display: 'flex' } }}
              aria-label="Drawer navigation tabs"
            >
              {tabs.map((tab, index) => renderTab(tab, index))}
            </Tabs>
          </Box>
        )}

        {/* Messages */}
        {(error || success) && (
          <Box sx={{ px: 2, pt: 2, pb: 0 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 1 }}>
                {success}
              </Alert>
            )}
          </Box>
        )}

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            pt: (error || success) ? 1 : 2,
          }}
        >
          {children}
        </Box>

        {/* Footer Actions */}
        {(actions || onSave || onCancel) && (
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'background.paper',
            }}
          >
            {renderActions()}
          </Box>
        )}
      </Drawer>
      {/* Close Confirmation Dialog */}
      <Dialog
        open={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Unsaved Changes
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmCloseMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmClose(false)}>
            Continue Editing
          </Button>
          <Button onClick={handleConfirmClose} color="warning" variant="contained">
            Close Without Saving
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BaseDrawer;