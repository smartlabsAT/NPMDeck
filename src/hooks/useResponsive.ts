import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

/**
 * Generic responsive hook for consistent breakpoint handling
 * Uses Material-UI breakpoints for responsive behavior
 */
export function useResponsive() {
  const theme = useTheme()
  
  // Standard breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg')) // 600px - 1200px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')) // >= 1200px
  
  // Specific breakpoints for tables
  const isMobileTable = useMediaQuery('(max-width:900px)') // < 900px (use cards)
  const isCompactTable = useMediaQuery('(min-width:901px) and (max-width:1250px)') // 901px - 1250px (hide some columns)
  const isFullTable = useMediaQuery('(min-width:1251px)') // >= 1251px (all columns)
  
  // Extra small screens for very mobile-friendly layouts
  const isExtraSmall = useMediaQuery('(max-width:480px)') // < 480px (very compact cards)
  
  // Precompute all breakpoint states
  const isXl = useMediaQuery(theme.breakpoints.up('xl'))
  const isLg = useMediaQuery(theme.breakpoints.up('lg'))
  const isMd = useMediaQuery(theme.breakpoints.up('md'))
  const isSm = useMediaQuery(theme.breakpoints.up('sm'))
  
  // Helper function to get current breakpoint
  const getCurrentBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    if (isXl) return 'xl'
    if (isLg) return 'lg'
    if (isMd) return 'md'
    if (isSm) return 'sm'
    return 'xs'
  }
  
  // Helper to check if screen is smaller than breakpoint
  const isBelow = (breakpoint: 'sm' | 'md' | 'lg' | 'xl') => {
    switch (breakpoint) {
      case 'sm': return !isSm
      case 'md': return !isMd
      case 'lg': return !isLg
      case 'xl': return !isXl
    }
  }
  
  // Helper to check if screen is larger than breakpoint
  const isAbove = (breakpoint: 'xs' | 'sm' | 'md' | 'lg') => {
    switch (breakpoint) {
      case 'xs': return true
      case 'sm': return isSm
      case 'md': return isMd
      case 'lg': return isLg
    }
  }
  
  return {
    // Basic responsive states
    isMobile,
    isTablet,
    isDesktop,
    
    // Table-specific states
    isMobileTable,
    isCompactTable,
    isFullTable,
    isExtraSmall,
    
    // Utility functions
    getCurrentBreakpoint,
    isBelow,
    isAbove,
    
    // Raw breakpoint values for custom logic
    breakpoints: {
      xs: 0,
      sm: 600,
      md: 850,  // Adjusted to account for container margins (~50px total)
      lg: 1250,  // Adjusted to account for container margins
      xl: 1920,
    }
  }
}

// Type exports for TypeScript
export type ResponsiveMode = 'mobile' | 'compact' | 'full'

// This is a hook that must be used inside a component
export function useResponsiveMode(): ResponsiveMode {
  const { isMobileTable, isCompactTable } = useResponsive()
  
  if (isMobileTable) return 'mobile'
  if (isCompactTable) return 'compact'
  return 'full'
}

// Static version for use in getResponsiveMode
export function getResponsiveMode(): ResponsiveMode {
  // This function should not be used - use useResponsiveMode instead
  // Returning default value for type compatibility
  return 'full'
}