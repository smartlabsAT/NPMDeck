import React, { ReactNode } from 'react'
import { Box, Fade, Slide, Grow, Collapse } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'

/**
 * Animation types for tab panel transitions
 */
export type TabPanelAnimation = 'none' | 'fade' | 'slide' | 'grow' | 'collapse'

/**
 * Direction for slide animations
 */
export type SlideDirection = 'left' | 'right' | 'up' | 'down'

/**
 * Props for the TabPanel component
 */
export interface TabPanelProps {
  /** Content of the tab panel */
  children?: ReactNode
  /** Current tab index */
  index: number
  /** Active tab value */
  value: number
  /** Animation type */
  animation?: TabPanelAnimation
  /** Animation timeout in ms */
  timeout?: number
  /** Slide direction (only for slide animation) */
  slideDirection?: SlideDirection
  /** Whether to keep the panel mounted when hidden */
  keepMounted?: boolean
  /** Custom styling */
  sx?: any
  /** Padding inside the panel */
  padding?: number | string
  /** Whether panel is loading */
  loading?: boolean
  /** Loading placeholder */
  loadingComponent?: ReactNode
  /** Custom transition component */
  TransitionComponent?: React.ComponentType<TransitionProps & { children: React.ReactElement<any, any> }>
  /** Additional props for the transition component */
  transitionProps?: any
  /** Role for accessibility */
  role?: string
  /** ARIA labelledby for accessibility */
  'aria-labelledby'?: string
  /** Additional ARIA props */
  ariaProps?: Record<string, any>
}

/**
 * Slide transition component factory
 */
const createSlideTransition = (direction: SlideDirection) => {
  return React.forwardRef<unknown, TransitionProps & { children: React.ReactElement<any, any> }>(
    function SlideTransition(props, ref) {
      return <Slide direction={direction} ref={ref} {...props} />
    }
  )
}

/**
 * TabPanel - A reusable component for tab content with smooth transitions
 * 
 * Features:
 * - Multiple animation types (fade, slide, grow, collapse)
 * - Configurable animation timing
 * - Accessibility support with ARIA attributes
 * - Loading states
 * - Keep mounted option for performance
 * - Custom transition components
 * - Responsive padding
 * 
 * @example
 * ```tsx
 * <TabPanel
 *   value={activeTab}
 *   index={0}
 *   animation="fade"
 *   timeout={300}
 *   padding={3}
 * >
 *   <Typography>Tab 1 Content</Typography>
 * </TabPanel>
 * 
 * <TabPanel
 *   value={activeTab}
 *   index={1}
 *   animation="slide"
 *   slideDirection="left"
 *   keepMounted
 * >
 *   <ComplexForm />
 * </TabPanel>
 * ```
 */
export default function TabPanel({
  children,
  index,
  value,
  animation = 'fade',
  timeout = 300,
  slideDirection = 'left',
  keepMounted = false,
  sx,
  padding = 2,
  loading = false,
  loadingComponent,
  TransitionComponent,
  transitionProps,
  role = 'tabpanel',
  'aria-labelledby': ariaLabelledBy,
  ariaProps,
  ...other
}: TabPanelProps) {
  const isActive = value === index
  const shouldRender = keepMounted || isActive

  /**
   * Get the appropriate transition component
   */
  const getTransitionComponent = () => {
    if (TransitionComponent) {
      return TransitionComponent
    }

    switch (animation) {
      case 'slide':
        return createSlideTransition(slideDirection)
      case 'grow':
        return React.forwardRef<unknown, TransitionProps & { children: React.ReactElement<any, any> }>(
          function GrowTransition(props, ref) {
            return <Grow ref={ref} {...props} />
          }
        )
      case 'collapse':
        return React.forwardRef<unknown, TransitionProps & { children: React.ReactElement<any, any> }>(
          function CollapseTransition(props, ref) {
            return <Collapse ref={ref} {...props} />
          }
        )
      case 'fade':
        return React.forwardRef<unknown, TransitionProps & { children: React.ReactElement<any, any> }>(
          function FadeTransition(props, ref) {
            return <Fade ref={ref} {...props} />
          }
        )
      case 'none':
      default:
        return React.forwardRef<unknown, TransitionProps & { children: React.ReactElement<any, any> }>(
          function NoTransition(props, ref) {
            return React.cloneElement(props.children, { ref })
          }
        )
    }
  }

  /**
   * Render content with or without animation
   */
  const renderContent = () => {
    const content = (
      <Box
        sx={{
          py: typeof padding === 'number' ? padding : 0,
          px: typeof padding === 'number' ? padding : 0,
          ...(typeof padding === 'string' && { p: padding }),
          height: '100%',
          ...sx,
        }}
      >
        {loading ? (
          loadingComponent || (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
              }}
            >
              Loading...
            </Box>
          )
        ) : (
          children
        )}
      </Box>
    )

    if (animation === 'none') {
      return content
    }

    const Transition = getTransitionComponent()
    
    return (
      <Transition
        in={isActive}
        timeout={timeout}
        mountOnEnter={!keepMounted}
        unmountOnExit={!keepMounted}
        {...transitionProps}
      >
        {content}
      </Transition>
    )
  }

  if (!shouldRender) {
    return null
  }

  return (
    <div
      role={role}
      hidden={!isActive}
      id={`tabpanel-${index}`}
      aria-labelledby={ariaLabelledBy || `tab-${index}`}
      {...ariaProps}
      {...other}
      style={{
        height: '100%',
        display: isActive ? 'block' : keepMounted ? 'none' : undefined,
      }}
    >
      {renderContent()}
    </div>
  )
}

/**
 * Convenience components for common tab panel patterns
 */

/**
 * FadeTabPanel - Pre-configured fade transition tab panel
 */
export interface FadeTabPanelProps extends Omit<TabPanelProps, 'animation'> {
  /** Fade timeout */
  fadeTimeout?: number
}

export function FadeTabPanel({ fadeTimeout = 300, ...props }: FadeTabPanelProps) {
  return (
    <TabPanel
      {...props}
      animation="fade"
      timeout={fadeTimeout}
    />
  )
}

/**
 * SlideTabPanel - Pre-configured slide transition tab panel
 */
export interface SlideTabPanelProps extends Omit<TabPanelProps, 'animation'> {
  /** Slide direction */
  direction?: SlideDirection
  /** Slide timeout */
  slideTimeout?: number
}

export function SlideTabPanel({ 
  direction = 'left', 
  slideTimeout = 300, 
  ...props 
}: SlideTabPanelProps) {
  return (
    <TabPanel
      {...props}
      animation="slide"
      slideDirection={direction}
      timeout={slideTimeout}
    />
  )
}

/**
 * NoAnimationTabPanel - Tab panel without transitions
 */
export type NoAnimationTabPanelProps = Omit<TabPanelProps, 'animation' | 'timeout'>

export function NoAnimationTabPanel(props: NoAnimationTabPanelProps) {
  return (
    <TabPanel
      {...props}
      animation="none"
    />
  )
}

/**
 * LazyTabPanel - Tab panel that only renders content when first activated
 */
export interface LazyTabPanelProps extends TabPanelProps {
  /** Whether content has been loaded */
  hasBeenActivated?: boolean
  /** Callback when panel is first activated */
  onFirstActivation?: () => void
}

export function LazyTabPanel({
  hasBeenActivated: externalHasBeenActivated,
  onFirstActivation,
  value,
  index,
  children,
  ...props
}: LazyTabPanelProps) {
  const [internalHasBeenActivated, setInternalHasBeenActivated] = React.useState(false)
  const hasBeenActivated = externalHasBeenActivated ?? internalHasBeenActivated
  const isActive = value === index

  React.useEffect(() => {
    if (isActive && !hasBeenActivated) {
      setInternalHasBeenActivated(true)
      if (onFirstActivation) {
        onFirstActivation()
      }
    }
  }, [isActive, hasBeenActivated, onFirstActivation])

  return (
    <TabPanel
      {...props}
      value={value}
      index={index}
      keepMounted={hasBeenActivated}
    >
      {(hasBeenActivated || isActive) ? children : null}
    </TabPanel>
  )
}