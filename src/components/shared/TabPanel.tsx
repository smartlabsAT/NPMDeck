import React, { ReactNode } from 'react'
import { Box, Fade, Slide, Grow, Collapse, type SxProps, type Theme } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'

/**
 * Animation types for tab panel transitions
 */
type TabPanelAnimation = 'none' | 'fade' | 'slide' | 'grow' | 'collapse'

/**
 * Direction for slide animations
 */
type SlideDirection = 'left' | 'right' | 'up' | 'down'

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
  sx?: SxProps<Theme>
  /** Padding inside the panel */
  padding?: number | string
  /** Whether panel is loading */
  loading?: boolean
  /** Loading placeholder */
  loadingComponent?: ReactNode
  /** Custom transition component */
  TransitionComponent?: React.ComponentType<TransitionProps & { children: React.ReactElement }>
  /** Additional props for the transition component */
  transitionProps?: Partial<TransitionProps>
  /** Role for accessibility */
  role?: string
  /** ARIA labelledby for accessibility */
  'aria-labelledby'?: string
  /** Additional ARIA props */
  ariaProps?: Record<string, string | boolean | number | undefined>
}

/**
 * Transition props type shared by all transition wrapper components
 */
type TransitionWrapperProps = TransitionProps & { children: React.ReactElement; ref?: React.Ref<unknown> }

/**
 * Slide transition component factory
 */
const createSlideTransition = (direction: SlideDirection) => {
  return function SlideTransition({ ref, ...props }: TransitionWrapperProps) {
    return <Slide direction={direction} ref={ref} {...props} />
  }
}

/**
 * Grow transition component
 */
function GrowTransition({ ref, ...props }: TransitionWrapperProps) {
  return <Grow ref={ref} {...props} />
}

/**
 * Collapse transition component
 */
function CollapseTransition({ ref, ...props }: TransitionWrapperProps) {
  return <Collapse ref={ref} {...props} />
}

/**
 * Fade transition component
 */
function FadeTransition({ ref, ...props }: TransitionWrapperProps) {
  return <Fade ref={ref} {...props} />
}

/**
 * No-op transition component (renders children directly)
 */
function NoTransition({ ref, children }: TransitionWrapperProps) {
  return React.cloneElement(children, { ref } as React.Attributes & { ref?: React.Ref<unknown> })
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
        return GrowTransition
      case 'collapse':
        return CollapseTransition
      case 'fade':
        return FadeTransition
      case 'none':
      default:
        return NoTransition
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

