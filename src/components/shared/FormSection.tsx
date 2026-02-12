import { ReactNode, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Collapse,
  Chip,
  Fade,
  useTheme,
  alpha,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
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
 * Props for the FormSection component
 */
export interface FormSectionProps {
  /** Section title */
  title: string
  /** Optional description text */
  description?: string
  /** Optional icon to display */
  icon?: ReactNode
  /** Section content */
  children: ReactNode
  /** Whether the section can be collapsed */
  collapsible?: boolean
  /** Default expanded state */
  defaultExpanded?: boolean
  /** Whether the section is required */
  required?: boolean
  /** Severity level for styling */
  severity?: FormSectionSeverity
  /** Whether the section has validation errors */
  error?: boolean
  /** Number of errors in this section */
  errorCount?: number
  /** Whether the section content is loading */
  loading?: boolean
  /** Custom styling */
  sx?: any
  /** Additional content for the header (badges, chips, etc.) */
  headerContent?: ReactNode
  /** Whether to animate the collapse/expand */
  animated?: boolean
  /** Custom expand/collapse icon */
  expandIcon?: ReactNode
  /** Custom collapse icon */
  collapseIcon?: ReactNode
  /** Callback when section is expanded/collapsed */
  onToggle?: (expanded: boolean) => void
  /** Whether section is disabled */
  disabled?: boolean
  /** Elevation level for the paper */
  elevation?: number
  /** Whether to show a subtle background */
  subtle?: boolean
  /** Visual variant of the section */
  variant?: FormSectionVariant
}

/**
 * FormSection - A reusable component for organizing form content into sections
 * 
 * Features:
 * - Collapsible content with smooth animations
 * - Multiple severity levels with appropriate styling
 * - Error state handling with error counts
 * - Loading states
 * - Customizable headers with icons and badges
 * - Accessibility support
 * - Responsive design
 * - Required field indicators
 * 
 * @example
 * ```tsx
 * <FormSection
 *   title="Basic Settings"
 *   description="Configure the fundamental settings for your proxy host"
 *   icon={<SettingsIcon />}
 *   required
 *   collapsible
 *   errorCount={fieldErrors.basic}
 * >
 *   <TextField label="Domain Name" />
 *   <TextField label="Forward Host" />
 * </FormSection>
 * 
 * <FormSection
 *   title="SSL Configuration"
 *   description="Configure SSL certificates and security settings"
 *   icon={<LockIcon />}
 *   severity="warning"
 *   collapsible
 *   defaultExpanded={false}
 * >
 *   <SSLConfigForm />
 * </FormSection>
 * ```
 */
export default function FormSection({
  title,
  description,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  required = false,
  severity,
  error = false,
  errorCount,
  loading = false,
  sx,
  headerContent,
  animated = true,
  expandIcon,
  collapseIcon,
  onToggle,
  disabled = false,
  elevation,
  subtle = false,
  variant = 'minimal',
}: FormSectionProps) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(defaultExpanded)

  /**
   * Handle section toggle
   */
  const handleToggle = useCallback(() => {
    if (!collapsible || disabled || loading) return
    
    const newExpanded = !expanded
    setExpanded(newExpanded)
    
    if (onToggle) {
      onToggle(newExpanded)
    }
  }, [collapsible, disabled, loading, expanded, onToggle])

  /**
   * Get severity-based colors
   */
  const getSeverityColors = useCallback(() => {
    const baseSeverity = error ? 'error' : severity
    
    switch (baseSeverity) {
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
  }, [error, severity, theme, subtle])

  /**
   * Get severity icon
   */
  const getSeverityIcon = useCallback(() => {
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
  }, [error, severity])

  const colors = getSeverityColors()
  const severityIcon = getSeverityIcon()

  // Get spacing based on variant
  const getSpacing = () => {
    switch (variant) {
      case 'minimal':
        return { mb: 2, headerPadding: 0, contentPadding: 0 }
      case 'compact':
        return { mb: 2, headerPadding: 1.5, contentPadding: 1.5 }
      case 'default':
        return { mb: 3, headerPadding: 2, contentPadding: 2 }
    }
  }

  const spacing = getSpacing()

  // Minimal variant - no Paper wrapper
  if (variant === 'minimal') {
    return (
      <Box sx={{ mb: spacing.mb, ...sx }}>
        {/* Header */}
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            cursor: collapsible && !disabled && !loading ? 'pointer' : 'default',
            opacity: disabled ? 0.6 : 1,
          }}
          onClick={handleToggle}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? expanded : undefined}
          aria-controls={collapsible ? `section-content-${title}` : undefined}
          tabIndex={collapsible && !disabled ? 0 : undefined}
          onKeyDown={(e) => {
            if (collapsible && !disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              handleToggle()
            }
          }}
        >
          {/* Icon */}
          {(icon || severityIcon) && (
            <Box sx={{ mr: 1.5, color: colors.icon, display: 'flex', alignItems: 'center' }}>
              {severityIcon || icon}
            </Box>
          )}
          
          {/* Title and Description */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              component="h3"
              sx={{
                fontWeight: 600,
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {title}
              {required && (
                <Typography
                  component="span"
                  sx={{ color: 'error.main' }}
                  aria-label="required"
                >
                  *
                </Typography>
              )}
              {/* Error Count Badge */}
              {errorCount && errorCount > 0 && (
                <Chip
                  label={errorCount}
                  size="small"
                  color="error"
                  sx={{ ml: 1, minWidth: 24, height: 20, fontSize: '0.75rem' }}
                />
              )}
            </Typography>
            
            {description && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 0.25
                }}>
                {description}
              </Typography>
            )}
          </Box>

          {/* Header Content */}
          {headerContent && (
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {headerContent}
            </Box>
          )}

          {/* Expand/Collapse Button */}
          {collapsible && (
            <IconButton
              size="small"
              sx={{ ml: 1 }}
              disabled={disabled || loading}
              onClick={(e) => {
                e.stopPropagation()
                handleToggle()
              }}
              aria-label={expanded ? 'collapse section' : 'expand section'}
            >
              {loading ? (
                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {expanded ? (
                    collapseIcon || <ExpandLessIcon />
                  ) : (
                    expandIcon || <ExpandMoreIcon />
                  )}
                </Box>
              ) : expanded ? (
                collapseIcon || <ExpandLessIcon />
              ) : (
                expandIcon || <ExpandMoreIcon />
              )}
            </IconButton>
          )}
        </Box>
        {/* Divider for minimal variant */}
        <Divider sx={{ my: 0.5 }} />
        {/* Content */}
        {collapsible ? (
          <Collapse 
            in={expanded} 
            timeout={animated ? 300 : 0}
            id={`section-content-${title}`}
          >
            <Box>
              {animated ? (
                <Fade in={expanded} timeout={200}>
                  <Box>{children}</Box>
                </Fade>
              ) : (
                children
              )}
            </Box>
          </Collapse>
        ) : (
          <Box>
            {children}
          </Box>
        )}
      </Box>
    );
  }

  // Compact and Default variants - use Paper
  return (
    <Paper
      variant="outlined"
      elevation={elevation}
      sx={{
        mb: spacing.mb,
        borderColor: colors.border,
        backgroundColor: colors.background,
        opacity: disabled ? 0.6 : 1,
        transition: theme.transitions.create(['border-color', 'background-color', 'opacity']),
        ...sx,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: spacing.headerPadding,
          display: 'flex',
          alignItems: 'center',
          cursor: collapsible && !disabled && !loading ? 'pointer' : 'default',
          transition: theme.transitions.create(['background-color']),
          '&:hover': collapsible && !disabled && !loading ? { 
            backgroundColor: alpha(theme.palette.action.hover, 0.5) 
          } : {},
        }}
        onClick={handleToggle}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? expanded : undefined}
        aria-controls={collapsible ? `section-content-${title}` : undefined}
        tabIndex={collapsible && !disabled ? 0 : undefined}
        onKeyDown={(e) => {
          if (collapsible && !disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleToggle()
          }
        }}
      >
        {/* Icon */}
        {(icon || severityIcon) && (
          <Box sx={{ mr: 2, color: colors.icon, display: 'flex', alignItems: 'center' }}>
            {severityIcon || icon}
          </Box>
        )}
        
        {/* Title and Description */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: description ? 0.5 : 0 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
              {required && (
                <Typography
                  component="span"
                  sx={{ color: 'error.main', ml: 0.5 }}
                  aria-label="required"
                >
                  *
                </Typography>
              )}
            </Typography>
            
            {/* Error Count Badge */}
            {errorCount && errorCount > 0 && (
              <Chip
                label={errorCount}
                size="small"
                color="error"
                sx={{ minWidth: 24, height: 20, fontSize: '0.75rem' }}
              />
            )}
          </Box>
          
          {description && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: collapsible && !expanded ? 1 : 3,
                WebkitBoxOrient: 'vertical'
              }}>
              {description}
            </Typography>
          )}
        </Box>

        {/* Header Content */}
        {headerContent && (
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            {headerContent}
          </Box>
        )}

        {/* Expand/Collapse Button */}
        {collapsible && (
          <IconButton
            size="small"
            sx={{ ml: 1 }}
            disabled={disabled || loading}
            onClick={(e) => {
              e.stopPropagation()
              handleToggle()
            }}
            aria-label={expanded ? 'collapse section' : 'expand section'}
          >
            {loading ? (
              <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Could add a small loading spinner here */}
                {expanded ? (
                  collapseIcon || <ExpandLessIcon />
                ) : (
                  expandIcon || <ExpandMoreIcon />
                )}
              </Box>
            ) : expanded ? (
              collapseIcon || <ExpandLessIcon />
            ) : (
              expandIcon || <ExpandMoreIcon />
            )}
          </IconButton>
        )}
      </Box>
      {/* Content */}
      {collapsible ? (
        <Collapse 
          in={expanded} 
          timeout={animated ? 300 : 0}
          id={`section-content-${title}`}
        >
          <Divider />
          <Box sx={{ p: spacing.contentPadding }}>
            {animated ? (
              <Fade in={expanded} timeout={200}>
                <Box>{children}</Box>
              </Fade>
            ) : (
              children
            )}
          </Box>
        </Collapse>
      ) : (
        <>
          <Divider />
          <Box sx={{ p: spacing.contentPadding }}>
            {children}
          </Box>
        </>
      )}
    </Paper>
  );
}

/**
 * Convenience components for specific section types
 */

/**
 * ErrorFormSection - Pre-configured error section
 */
export interface ErrorFormSectionProps extends Omit<FormSectionProps, 'severity' | 'error'> {
  errorCount: number
}

export function ErrorFormSection(props: ErrorFormSectionProps) {
  return (
    <FormSection
      {...props}
      severity="error"
      error={props.errorCount > 0}
    />
  )
}

/**
 * WarningFormSection - Pre-configured warning section
 */
export type WarningFormSectionProps = Omit<FormSectionProps, 'severity'>

export function WarningFormSection(props: WarningFormSectionProps) {
  return (
    <FormSection
      {...props}
      severity="warning"
    />
  )
}

/**
 * RequiredFormSection - Pre-configured required section
 */
export type RequiredFormSectionProps = Omit<FormSectionProps, 'required'>

export function RequiredFormSection(props: RequiredFormSectionProps) {
  return (
    <FormSection
      {...props}
      required
    />
  )
}