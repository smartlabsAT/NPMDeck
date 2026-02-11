import React, { ReactNode, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
} from '@mui/material'
import { 
  Close as CloseIcon, 
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material'
import { TransitionProps } from '@mui/material/transitions'

/**
 * Dialog severity levels for styling and icons
 */
export type DialogSeverity = 'info' | 'warning' | 'error' | 'success'

/**
 * Dialog size options
 */
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Props for the BaseDialog component
 */
export interface BaseDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when the dialog should be closed */
  onClose: () => void
  /** Main title of the dialog */
  title: string
  /** Optional subtitle or description */
  subtitle?: string
  /** Main content message */
  message?: string
  /** Content of the dialog */
  children?: ReactNode
  /** Maximum width of the dialog */
  maxWidth?: DialogSize
  /** Whether dialog is full width */
  fullWidth?: boolean
  /** Whether dialog takes full screen on mobile */
  fullScreen?: boolean
  /** Whether to show the close button in header */
  showCloseButton?: boolean
  /** Whether clicking backdrop closes dialog */
  disableBackdropClick?: boolean
  /** Whether pressing escape closes dialog */
  disableEscapeKeyDown?: boolean
  /** Severity level for styling */
  severity?: DialogSeverity
  /** Whether the dialog action is loading */
  loading?: boolean
  /** Loading message */
  loadingMessage?: string
  /** Error message to display */
  error?: string | null
  /** Success message to display */
  success?: string | null
  /** Custom action buttons */
  actions?: ReactNode
  /** Primary action button text */
  confirmText?: string
  /** Secondary action button text */
  cancelText?: string
  /** Primary action button color */
  confirmColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  /** Callback for primary action */
  onConfirm?: () => void | Promise<void>
  /** Callback for secondary action */
  onCancel?: () => void
  /** Whether to show default actions */
  showActions?: boolean
  /** Whether primary action is disabled */
  disableConfirm?: boolean
  /** Whether secondary action is disabled */
  disableCancel?: boolean
  /** Animation transition component */
  TransitionComponent?: React.ComponentType<TransitionProps & { children: React.ReactElement<any, any> }>
  /** Whether to animate content */
  animateContent?: boolean
  /** Custom header icon */
  headerIcon?: ReactNode
  /** Whether dialog is persistent (can't be closed by user actions) */
  persistent?: boolean
}

/**
 * Slide up transition for dialogs
 */
function SlideTransition({ ref, ...props }: TransitionProps & { children: React.ReactElement<any, any>; ref?: React.Ref<unknown> }) {
  return <Slide direction="up" ref={ref} {...props} />
}

/**
 * BaseDialog - A reusable dialog component for confirmations, forms, and content
 * 
 * Features:
 * - Multiple severity levels with appropriate styling
 * - Responsive sizing and full-screen mobile support
 * - Loading states with overlay
 * - Error and success message handling
 * - Customizable actions and callbacks
 * - Smooth animations and transitions
 * - Accessibility support
 * - Persistent mode for critical dialogs
 * 
 * @example
 * ```tsx
 * // Confirmation Dialog
 * <BaseDialog
 *   open={open}
 *   onClose={handleClose}
 *   title="Delete User"
 *   message="Are you sure you want to delete this user? This action cannot be undone."
 *   severity="error"
 *   confirmText="Delete"
 *   confirmColor="error"
 *   onConfirm={handleDelete}
 *   loading={deleting}
 * />
 * 
 * // Form Dialog
 * <BaseDialog
 *   open={open}
 *   onClose={handleClose}
 *   title="Create New Certificate"
 *   maxWidth="md"
 *   fullWidth
 *   showActions
 *   confirmText="Create"
 *   onConfirm={handleCreate}
 *   loading={creating}
 *   error={error}
 * >
 *   <CertificateForm />
 * </BaseDialog>
 * ```
 */
export default function BaseDialog({
  open,
  onClose,
  title,
  subtitle,
  message,
  children,
  maxWidth = 'sm',
  fullWidth = false,
  fullScreen = false,
  showCloseButton = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  severity,
  loading = false,
  loadingMessage = 'Processing...',
  error,
  success,
  actions,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
  showActions = false,
  disableConfirm = false,
  disableCancel = false,
  TransitionComponent = SlideTransition,
  animateContent = true,
  headerIcon,
  persistent = false,
}: BaseDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  // Auto full-screen on mobile for larger dialogs
  const shouldFullScreen = fullScreen || (isMobile && ['lg', 'xl'].includes(maxWidth))

  /**
   * Get severity-based icon
   */
  const getSeverityIcon = useCallback(() => {
    if (headerIcon) return headerIcon
    
    const iconProps = { fontSize: 'large' as const }
    
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" {...iconProps} />
      case 'warning':
        return <WarningIcon color="warning" {...iconProps} />
      case 'success':
        return <SuccessIcon color="success" {...iconProps} />
      case 'info':
      default:
        return <InfoIcon color="info" {...iconProps} />
    }
  }, [severity, headerIcon])

  /**
   * Get severity-based color scheme
   */
  const getSeverityColors = useCallback(() => {
    switch (severity) {
      case 'error':
        return { 
          bg: 'error.light', 
          border: 'error.main',
          text: 'error.dark'
        }
      case 'warning':
        return { 
          bg: 'warning.light', 
          border: 'warning.main',
          text: 'warning.dark'
        }
      case 'success':
        return { 
          bg: 'success.light', 
          border: 'success.main',
          text: 'success.dark'
        }
      case 'info':
      default:
        return { 
          bg: 'info.light', 
          border: 'info.main',
          text: 'info.dark'
        }
    }
  }, [severity])

  /**
   * Handle dialog close with persistence check
   */
  const handleClose = useCallback((event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (persistent || loading) return
    
    if (reason === 'backdropClick' && disableBackdropClick) return
    if (reason === 'escapeKeyDown' && disableEscapeKeyDown) return
    
    onClose()
  }, [persistent, loading, disableBackdropClick, disableEscapeKeyDown, onClose])

  /**
   * Handle manual close (close button)
   */
  const handleManualClose = useCallback(() => {
    if (persistent || loading) return
    onClose()
  }, [persistent, loading, onClose])

  /**
   * Handle confirm action with loading
   */
  const handleConfirm = useCallback(async () => {
    if (onConfirm && !loading && !disableConfirm) {
      await onConfirm()
    }
  }, [onConfirm, loading, disableConfirm])

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      handleManualClose()
    }
  }, [onCancel, handleManualClose])

  const severityColors = getSeverityColors()

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={shouldFullScreen}
      TransitionComponent={TransitionComponent}
      PaperProps={{
        sx: {
          borderRadius: shouldFullScreen ? 0 : 2,
          boxShadow: theme.shadows[8],
          ...(severity && {
            borderTop: `4px solid`,
            borderTopColor: severityColors.border,
          }),
          // Fixed height for non-fullscreen dialogs to prevent jumping
          ...(!shouldFullScreen && {
            height: '90vh',
            maxHeight: '90vh',
            minHeight: '90vh'
          })
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
          }
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 3,
          pb: subtitle ? 1 : 2,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          ...(severity && {
            bgcolor: `${severityColors.bg}20`,
          })
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pr: 2 }}>
          {(severity || headerIcon) && (
            <Box sx={{ mt: 0.5 }}>
              {getSeverityIcon()}
            </Box>
          )}
          <Box>
            <Typography 
              variant="h6" 
              component="h2"
              sx={{ 
                fontWeight: 600,
                ...(severity && { color: severityColors.text })
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        
        {showCloseButton && !persistent && (
          <IconButton
            aria-label="close"
            onClick={handleManualClose}
            disabled={loading}
            sx={{ mt: -1, mr: -1 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ 
        p: 3, 
        pt: subtitle ? 2 : 1, 
        position: 'relative',
        // Make content scrollable for fixed height dialogs
        ...(!shouldFullScreen && {
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 200px)', // Account for header and actions
        })
      }}>
        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(2px)',
              zIndex: 10,
              gap: 2,
            }}
          >
            <CircularProgress size={40} />
            {loadingMessage && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {loadingMessage}
              </Typography>
            )}
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => {}}
          >
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            onClose={() => {}}
          >
            {success}
          </Alert>
        )}

        {/* Message */}
        {message && (
          <DialogContentText sx={{ mb: children ? 2 : 0 }}>
            {message}
          </DialogContentText>
        )}

        {/* Custom Content */}
        {children && (
          <Box 
            sx={{ 
              opacity: loading ? 0.5 : 1,
              pointerEvents: loading ? 'none' : 'auto',
              transition: 'opacity 0.2s ease-in-out'
            }}
          >
            {animateContent ? (
              <Fade in={open} timeout={300}>
                <Box>{children}</Box>
              </Fade>
            ) : (
              children
            )}
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      {(showActions || actions || onConfirm) && (
        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          {actions || (
            <>
              {(onCancel || !persistent) && (
                <Button
                  onClick={handleCancel}
                  disabled={loading || disableCancel}
                  variant="outlined"
                  size="large"
                >
                  {cancelText}
                </Button>
              )}
              {onConfirm && (
                <Button
                  onClick={handleConfirm}
                  disabled={loading || disableConfirm}
                  color={confirmColor}
                  variant="contained"
                  startIcon={loading && <CircularProgress size={18} />}
                  size="large"
                >
                  {loading ? loadingMessage : confirmText}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  )
}

/**
 * Convenience components for common dialog types
 */

/**
 * ConfirmDialog - Pre-configured confirmation dialog
 */
export interface ConfirmDialogProps extends Omit<BaseDialogProps, 'children' | 'showActions'> {
  message: string
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <BaseDialog
      {...props}
      severity={props.severity || 'warning'}
      showActions
      confirmColor={props.confirmColor || 'primary'}
    />
  )
}

/**
 * ErrorDialog - Pre-configured error dialog
 */
export interface ErrorDialogProps extends Omit<BaseDialogProps, 'severity' | 'confirmColor'> {
  message: string
}

export function ErrorDialog(props: ErrorDialogProps) {
  return (
    <BaseDialog
      {...props}
      severity="error"
      confirmColor="error"
      showActions
    />
  )
}

/**
 * InfoDialog - Pre-configured info dialog
 */
export interface InfoDialogProps extends Omit<BaseDialogProps, 'severity'> {
  message: string
}

export function InfoDialog(props: InfoDialogProps) {
  return (
    <BaseDialog
      {...props}
      severity="info"
      showActions
    />
  )
}