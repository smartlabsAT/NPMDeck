import { describe, it, expect } from 'vitest'
import { LAYOUT, Z_INDEX, FONT_WEIGHT } from '../layout'

describe('LAYOUT', () => {
  it('should be defined', () => {
    expect(LAYOUT).toBeDefined()
  })

  it('should have DRAWER_WIDTH as a positive number', () => {
    expect(typeof LAYOUT.DRAWER_WIDTH).toBe('number')
    expect(LAYOUT.DRAWER_WIDTH).toBeGreaterThan(0)
  })

  it('should have TOOLBAR_HEIGHT as a positive number', () => {
    expect(typeof LAYOUT.TOOLBAR_HEIGHT).toBe('number')
    expect(LAYOUT.TOOLBAR_HEIGHT).toBeGreaterThan(0)
  })

  it('should have COMPACT_BREAKPOINT greater than CARD_BREAKPOINT', () => {
    expect(LAYOUT.COMPACT_BREAKPOINT).toBeGreaterThan(LAYOUT.CARD_BREAKPOINT)
  })

  it('should have CARD_BREAKPOINT as a positive number', () => {
    expect(typeof LAYOUT.CARD_BREAKPOINT).toBe('number')
    expect(LAYOUT.CARD_BREAKPOINT).toBeGreaterThan(0)
  })

  it('should have MOBILE_BUTTON_MAX_WIDTH as a positive number', () => {
    expect(typeof LAYOUT.MOBILE_BUTTON_MAX_WIDTH).toBe('number')
    expect(LAYOUT.MOBILE_BUTTON_MAX_WIDTH).toBeGreaterThan(0)
  })

  it('should have DRAWER_PANEL_WIDTH as a positive number', () => {
    expect(typeof LAYOUT.DRAWER_PANEL_WIDTH).toBe('number')
    expect(LAYOUT.DRAWER_PANEL_WIDTH).toBeGreaterThan(0)
  })

  it('should have expected constant values', () => {
    expect(LAYOUT.DRAWER_WIDTH).toBe(240)
    expect(LAYOUT.TOOLBAR_HEIGHT).toBe(64)
    expect(LAYOUT.COMPACT_BREAKPOINT).toBe(1250)
    expect(LAYOUT.CARD_BREAKPOINT).toBe(900)
    expect(LAYOUT.MOBILE_BUTTON_MAX_WIDTH).toBe(400)
    expect(LAYOUT.DRAWER_PANEL_WIDTH).toBe(600)
  })
})

describe('Z_INDEX', () => {
  it('should be defined', () => {
    expect(Z_INDEX).toBeDefined()
  })

  it('should have all values as positive numbers', () => {
    for (const [, value] of Object.entries(Z_INDEX)) {
      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThan(0)
    }
  })

  it('should have ascending z-index hierarchy', () => {
    expect(Z_INDEX.LOADING_BAR).toBeLessThan(Z_INDEX.SEARCH_DROPDOWN)
    expect(Z_INDEX.SEARCH_DROPDOWN).toBeLessThan(Z_INDEX.TOAST)
    expect(Z_INDEX.TOAST).toBeLessThan(Z_INDEX.EXPIRY_WARNING)
    expect(Z_INDEX.EXPIRY_WARNING).toBeLessThan(Z_INDEX.TOKEN_REFRESH)
  })

  it('should have expected constant values', () => {
    expect(Z_INDEX.LOADING_BAR).toBe(1201)
    expect(Z_INDEX.SEARCH_DROPDOWN).toBe(1300)
    expect(Z_INDEX.TOAST).toBe(1400)
    expect(Z_INDEX.EXPIRY_WARNING).toBe(1500)
    expect(Z_INDEX.TOKEN_REFRESH).toBe(2000)
  })
})

describe('FONT_WEIGHT', () => {
  it('should be defined', () => {
    expect(FONT_WEIGHT).toBeDefined()
  })

  it('should have MEDIUM and SEMI_BOLD as numbers', () => {
    expect(typeof FONT_WEIGHT.MEDIUM).toBe('number')
    expect(typeof FONT_WEIGHT.SEMI_BOLD).toBe('number')
  })

  it('should have SEMI_BOLD greater than MEDIUM', () => {
    expect(FONT_WEIGHT.SEMI_BOLD).toBeGreaterThan(FONT_WEIGHT.MEDIUM)
  })

  it('should have expected constant values', () => {
    expect(FONT_WEIGHT.MEDIUM).toBe(500)
    expect(FONT_WEIGHT.SEMI_BOLD).toBe(600)
  })
})
