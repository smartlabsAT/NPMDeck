import { useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { LAYOUT } from '../constants/layout'

// Module-level constant — stable reference across renders
const BREAKPOINT_VALUES = {
  xs: 0,
  sm: 600,
  md: 850,  // Adjusted to account for container margins (~50px total)
  lg: LAYOUT.COMPACT_BREAKPOINT,  // Adjusted to account for container margins
  xl: 1920,
} as const

interface UseResponsiveReturn {
  // Basic responsive states
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean

  // Table-specific states
  isMobileTable: boolean
  isCompactTable: boolean
  isFullTable: boolean
  isExtraSmall: boolean

  // Utility functions
  getCurrentBreakpoint: () => 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isBelow: (breakpoint: 'sm' | 'md' | 'lg' | 'xl') => boolean
  isAbove: (breakpoint: 'xs' | 'sm' | 'md' | 'lg') => boolean

  // Raw breakpoint values for custom logic
  breakpoints: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
}

/**
 * Generic responsive hook for consistent breakpoint handling
 * Uses Material-UI breakpoints for responsive behavior
 */
export function useResponsive(): UseResponsiveReturn {
  const theme = useTheme()
  
  // Standard breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg')) // 600px - 1200px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')) // >= 1200px
  
  // Specific breakpoints for tables
  const isMobileTable = useMediaQuery('(max-width:900px)') // < 900px (use cards)
  const isCompactTable = useMediaQuery(`(min-width:901px) and (max-width:${LAYOUT.COMPACT_BREAKPOINT}px)`) // 901px - compact breakpoint (hide some columns)
  const isFullTable = useMediaQuery(`(min-width:${LAYOUT.COMPACT_BREAKPOINT + 1}px)`) // > compact breakpoint (all columns)
  
  // Extra small screens for very mobile-friendly layouts
  const isExtraSmall = useMediaQuery('(max-width:480px)') // < 480px (very compact cards)
  
  // Precompute all breakpoint states
  const isXl = useMediaQuery(theme.breakpoints.up('xl'))
  const isLg = useMediaQuery(theme.breakpoints.up('lg'))
  const isMd = useMediaQuery(theme.breakpoints.up('md'))
  const isSm = useMediaQuery(theme.breakpoints.up('sm'))
  
  // Helper function to get current breakpoint
  const getCurrentBreakpoint = useCallback((): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    if (isXl) return 'xl'
    if (isLg) return 'lg'
    if (isMd) return 'md'
    if (isSm) return 'sm'
    return 'xs'
  }, [isXl, isLg, isMd, isSm])

  // Helper to check if screen is smaller than breakpoint
  const isBelow = useCallback((breakpoint: 'sm' | 'md' | 'lg' | 'xl'): boolean => {
    switch (breakpoint) {
      case 'sm': return !isSm
      case 'md': return !isMd
      case 'lg': return !isLg
      case 'xl': return !isXl
    }
  }, [isSm, isMd, isLg, isXl])

  // Helper to check if screen is larger than breakpoint
  const isAbove = useCallback((breakpoint: 'xs' | 'sm' | 'md' | 'lg'): boolean => {
    switch (breakpoint) {
      case 'xs': return true
      case 'sm': return isSm
      case 'md': return isMd
      case 'lg': return isLg
    }
  }, [isSm, isMd, isLg])
  
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
    breakpoints: BREAKPOINT_VALUES
  }
}

// Type exports for TypeScript
type ResponsiveMode = 'mobile' | 'compact' | 'full'

// This is a hook that must be used inside a component
export function useResponsiveMode(): ResponsiveMode {
  const { isMobileTable, isCompactTable } = useResponsive()
  
  if (isMobileTable) return 'mobile'
  if (isCompactTable) return 'compact'
  return 'full'
}

