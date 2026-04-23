import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHookWithProviders } from '../../test/utils'
import { useResponsive, useResponsiveMode } from '../useResponsive'

// Helper to override the global matchMedia mock for specific tests.
// MUI's useMediaQuery calls window.matchMedia with the generated query string.
function setMatchMedia(matcher: (query: string) => boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matcher(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('useResponsive', () => {
  beforeEach(() => {
    // Default: no queries match (effectively an "xs" viewport)
    setMatchMedia(() => false)
  })

  it('returns false for all breakpoints when no queries match', () => {
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })

  it('reports isMobile=true when max-width:599.95px query matches', () => {
    // MUI default theme down('sm') generates (max-width:599.95px)
    setMatchMedia((q) => q.includes('max-width:599.95px'))
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isMobile).toBe(true)
  })

  it('reports isDesktop=true when min-width:1200px query matches', () => {
    // MUI default theme up('lg') generates (min-width:1200px)
    setMatchMedia((q) => q.includes('min-width:1200px'))
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isDesktop).toBe(true)
  })

  it('reports isMobileTable=true when max-width:900px query matches', () => {
    setMatchMedia((q) => q === '(max-width:900px)')
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isMobileTable).toBe(true)
  })

  it('reports isExtraSmall=true when max-width:480px query matches', () => {
    setMatchMedia((q) => q === '(max-width:480px)')
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isExtraSmall).toBe(true)
  })

  it('isBelow("md") returns true when no up breakpoint queries match', () => {
    // All queries return false → isMd is false → isBelow('md') = !isMd = true
    setMatchMedia(() => false)
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isBelow('md')).toBe(true)
  })

  it('isBelow("md") returns false when up("md") query matches', () => {
    // MUI default theme up('md') generates (min-width:900px)
    setMatchMedia((q) => q.includes('min-width:900px'))
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isBelow('md')).toBe(false)
  })

  it('isAbove returns true when the matching up-breakpoint query matches', () => {
    // Simulate viewport matching up('md') and up('sm') → isMd=true, isSm=true
    setMatchMedia((q) => q.includes('min-width:900px') || q.includes('min-width:600px'))
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isAbove('md')).toBe(true)
    expect(result.current.isAbove('sm')).toBe(true)
  })

  it('isAbove returns false when the matching up-breakpoint query does not match', () => {
    setMatchMedia(() => false)
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.isAbove('md')).toBe(false)
  })

  it('exposes stable BREAKPOINT_VALUES object with correct values', () => {
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.breakpoints.xs).toBe(0)
    expect(result.current.breakpoints.sm).toBe(600)
    expect(result.current.breakpoints.md).toBe(850)
    expect(result.current.breakpoints.lg).toBe(1250)
    expect(result.current.breakpoints.xl).toBe(1920)
  })

  it('getCurrentBreakpoint returns "xs" when no breakpoint queries match', () => {
    setMatchMedia(() => false)
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.getCurrentBreakpoint()).toBe('xs')
  })

  it('getCurrentBreakpoint returns "xl" when xl breakpoint matches', () => {
    // MUI default theme up('xl') generates (min-width:1536px)
    setMatchMedia((q) => q.includes('min-width:1536px') || q.includes('min-width:1200px') || q.includes('min-width:900px') || q.includes('min-width:600px'))
    const { result } = renderHookWithProviders(() => useResponsive())
    expect(result.current.getCurrentBreakpoint()).toBe('xl')
  })
})

describe('useResponsiveMode', () => {
  beforeEach(() => {
    setMatchMedia(() => false)
  })

  it('returns "full" when neither mobile nor compact queries match', () => {
    setMatchMedia(() => false)
    const { result } = renderHookWithProviders(() => useResponsiveMode())
    expect(result.current).toBe('full')
  })

  it('returns "mobile" when isMobileTable matches (max-width:900px)', () => {
    setMatchMedia((q) => q === '(max-width:900px)')
    const { result } = renderHookWithProviders(() => useResponsiveMode())
    expect(result.current).toBe('mobile')
  })

  it('returns "compact" when compact query matches', () => {
    setMatchMedia((q) => q === '(min-width:901px) and (max-width:1250px)')
    const { result } = renderHookWithProviders(() => useResponsiveMode())
    expect(result.current).toBe('compact')
  })
})
