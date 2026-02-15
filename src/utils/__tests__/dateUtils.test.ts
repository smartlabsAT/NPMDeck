import { describe, it, expect, vi, afterEach } from 'vitest'
import { getDaysUntilExpiry, formatDate } from '../dateUtils'

describe('getDaysUntilExpiry', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null when expiresOn is null', () => {
    expect(getDaysUntilExpiry(null)).toBeNull()
  })

  it('should return null when expiresOn is empty string', () => {
    expect(getDaysUntilExpiry('')).toBeNull()
  })

  it('should return positive days for future dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    const result = getDaysUntilExpiry('2026-01-31T00:00:00Z')
    expect(result).toBe(30)
  })

  it('should return negative days for past dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-01T00:00:00Z'))

    const result = getDaysUntilExpiry('2026-01-01T00:00:00Z')
    expect(result).toBeLessThan(0)
  })

  it('should return 0 or 1 for today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))

    const result = getDaysUntilExpiry('2026-01-15T23:59:59Z')
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })
})

describe('formatDate', () => {
  it('should return "N/A" when dateString is null', () => {
    expect(formatDate(null)).toBe('N/A')
  })

  it('should return "N/A" when dateString is empty string', () => {
    expect(formatDate('')).toBe('N/A')
  })

  it('should format a valid date string with default options', () => {
    const result = formatDate('2026-06-15T14:30:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('N/A')
    // Default format includes year, long month, day, hour, minute
    expect(result).toContain('2026')
    expect(result).toContain('June')
    expect(result).toContain('15')
  })

  it('should accept custom Intl.DateTimeFormatOptions', () => {
    const result = formatDate('2026-03-20T10:00:00Z', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    expect(result).toContain('2026')
    expect(result).toContain('Mar')
  })

  it('should use en-US locale', () => {
    const result = formatDate('2026-01-15T00:00:00Z')
    // en-US uses "January" not "Januar" etc.
    expect(result).toContain('January')
  })
})
