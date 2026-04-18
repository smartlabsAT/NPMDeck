import { ReactNode } from 'react'
import {
  DialogTitle,
  IconButton,
  Box,
  Typography,
} from '@mui/material'
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material'
import { FONT_WEIGHT } from '../../constants/layout'

/**
 * Severity levels supported by the dialog header
 */
export type DialogSeverity = 'info' | 'warning' | 'error' | 'success'

/**
 * Color scheme returned by getSeverityColors
 */
interface SeverityColors {
  bg: string
  text: string
}

/**
 * Props for the DialogSeverityHeader component
 */
export interface DialogSeverityHeaderProps {
  /** Main title of the dialog */
  title: string
  /** Optional subtitle or description */
  subtitle?: string
  /** Severity level for styling and icon selection */
  severity?: DialogSeverity
  /** Custom header icon (overrides severity icon when provided) */
  headerIcon?: ReactNode
  /** Whether the close button is visible */
  showCloseButton?: boolean
  /** Whether the dialog is persistent (hides close button) */
  persistent?: boolean
  /** Whether a loading operation is in progress (disables close button) */
  loading?: boolean
  /** Called when the close button is clicked */
  onManualClose: () => void
}

/**
 * Get severity-based icon element
 */
function getSeverityIcon(severity: DialogSeverity | undefined, headerIcon: ReactNode): ReactNode {
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
}

/**
 * Get severity-based color scheme
 */
function getSeverityColors(severity: DialogSeverity | undefined): SeverityColors {
  switch (severity) {
    case 'error':
      return { bg: 'error.light', text: 'error.dark' }
    case 'warning':
      return { bg: 'warning.light', text: 'warning.dark' }
    case 'success':
      return { bg: 'success.light', text: 'success.dark' }
    case 'info':
    default:
      return { bg: 'info.light', text: 'info.dark' }
  }
}

/**
 * DialogSeverityHeader - Severity-aware dialog header with icon, title, subtitle, and close button
 *
 * Extracted from BaseDialog to keep the parent component focused on layout and behavior.
 */
const DialogSeverityHeader = ({
  title,
  subtitle,
  severity,
  headerIcon,
  showCloseButton = true,
  persistent = false,
  loading = false,
  onManualClose,
}: DialogSeverityHeaderProps) => {
  const severityColors = getSeverityColors(severity)

  return (
    <DialogTitle
      sx={{
        p: 3,
        pb: subtitle ? 1 : 2,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        ...(severity && {
          bgcolor: `${severityColors.bg}20`,
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pr: 2 }}>
        {(severity || headerIcon) && (
          <Box sx={{ mt: 0.5 }}>
            {getSeverityIcon(severity, headerIcon)}
          </Box>
        )}
        <Box>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: FONT_WEIGHT.SEMI_BOLD,
              ...(severity && { color: severityColors.text }),
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {showCloseButton && !persistent && (
        <IconButton
          aria-label="close"
          onClick={onManualClose}
          disabled={loading}
          sx={{ mt: -1, mr: -1 }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>
  )
}

export default DialogSeverityHeader
