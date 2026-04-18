import { alpha, type Theme } from '@mui/material'
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

/**
 * Severity levels for form sections
 */
export type FormSectionSeverity = 'info' | 'warning' | 'error' | 'success'

/**
 * Variant styles for form sections
 */
export type FormSectionVariant = 'minimal' | 'compact' | 'default'

/**
 * Color tokens derived from a severity level
 */
export interface FormSectionSeverityColors {
  border: string
  background: string
  text: string
  icon: string
}

/**
 * Returns the MUI color tokens appropriate for the given severity level.
 * Pass `subtle = true` to apply a faint primary tint when there is no severity.
 */
export function getFormSectionSeverityColors(
  severity: FormSectionSeverity | undefined,
  theme: Theme,
  subtle: boolean,
): FormSectionSeverityColors {
  switch (severity) {
    case 'error':
      return {
        border: theme.palette.error.main,
        background: alpha(theme.palette.error.light, 0.1),
        text: theme.palette.error.dark,
        icon: theme.palette.error.main,
      }
    case 'warning':
      return {
        border: theme.palette.warning.main,
        background: alpha(theme.palette.warning.light, 0.1),
        text: theme.palette.warning.dark,
        icon: theme.palette.warning.main,
      }
    case 'success':
      return {
        border: theme.palette.success.main,
        background: alpha(theme.palette.success.light, 0.1),
        text: theme.palette.success.dark,
        icon: theme.palette.success.main,
      }
    case 'info':
      return {
        border: theme.palette.info.main,
        background: alpha(theme.palette.info.light, 0.1),
        text: theme.palette.info.dark,
        icon: theme.palette.info.main,
      }
    default:
      return {
        border: theme.palette.divider,
        background: subtle ? alpha(theme.palette.primary.light, 0.02) : 'transparent',
        text: theme.palette.text.primary,
        icon: theme.palette.text.secondary,
      }
  }
}

/**
 * Returns the React element for the severity icon, or null when no icon is needed.
 */
export function getFormSectionSeverityIcon(
  severity: FormSectionSeverity | undefined,
  error: boolean,
): React.ReactElement | null {
  if (error) return <ErrorIcon fontSize="small" />

  switch (severity) {
    case 'error':
      return <ErrorIcon fontSize="small" />
    case 'warning':
      return <WarningIcon fontSize="small" />
    case 'info':
      return <InfoIcon fontSize="small" />
    default:
      return null
  }
}
