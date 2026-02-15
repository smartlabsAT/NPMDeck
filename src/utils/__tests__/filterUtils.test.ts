import { describe, it, expect } from 'vitest'
import { filterBySsl, filterByStatus } from '../filterUtils'

describe('filterBySsl', () => {
  const forcedSsl = { certificate_id: 1, ssl_forced: true }
  const optionalSsl = { certificate_id: 1, ssl_forced: false }
  const noSsl = { certificate_id: null, ssl_forced: false }

  describe('when filter is "all" or empty', () => {
    it('should return true for "all"', () => {
      expect(filterBySsl(forcedSsl, 'all')).toBe(true)
    })

    it('should return true for null', () => {
      expect(filterBySsl(forcedSsl, null)).toBe(true)
    })

    it('should return true for undefined', () => {
      expect(filterBySsl(forcedSsl, undefined)).toBe(true)
    })

    it('should return true for empty string', () => {
      expect(filterBySsl(forcedSsl, '')).toBe(true)
    })
  })

  describe('when filter is "forced"', () => {
    it('should include items with certificate_id and ssl_forced', () => {
      expect(filterBySsl(forcedSsl, 'forced')).toBe(true)
    })

    it('should exclude items without certificate_id', () => {
      expect(filterBySsl(noSsl, 'forced')).toBe(false)
    })

    it('should exclude items with certificate but not forced', () => {
      expect(filterBySsl(optionalSsl, 'forced')).toBe(false)
    })
  })

  describe('when filter is "optional"', () => {
    it('should include items with certificate_id but not forced', () => {
      expect(filterBySsl(optionalSsl, 'optional')).toBe(true)
    })

    it('should exclude items without certificate_id', () => {
      expect(filterBySsl(noSsl, 'optional')).toBe(false)
    })

    it('should exclude items with forced SSL', () => {
      expect(filterBySsl(forcedSsl, 'optional')).toBe(false)
    })
  })

  describe('when filter is "disabled"', () => {
    it('should include items without certificate_id', () => {
      expect(filterBySsl(noSsl, 'disabled')).toBe(true)
    })

    it('should exclude items with certificate_id', () => {
      expect(filterBySsl(forcedSsl, 'disabled')).toBe(false)
    })

    it('should exclude optional SSL items', () => {
      expect(filterBySsl(optionalSsl, 'disabled')).toBe(false)
    })
  })

  describe('ssl_forced as number', () => {
    it('should treat ssl_forced: 1 as truthy', () => {
      expect(filterBySsl({ certificate_id: 1, ssl_forced: 1 }, 'forced')).toBe(true)
    })

    it('should treat ssl_forced: 0 as falsy', () => {
      expect(filterBySsl({ certificate_id: 1, ssl_forced: 0 }, 'forced')).toBe(false)
    })
  })
})

describe('filterByStatus', () => {
  const enabled = { enabled: true }
  const disabled = { enabled: false }

  describe('when filter is "all" or empty', () => {
    it('should return true for "all"', () => {
      expect(filterByStatus(enabled, 'all')).toBe(true)
    })

    it('should return true for null', () => {
      expect(filterByStatus(enabled, null)).toBe(true)
    })

    it('should return true for undefined', () => {
      expect(filterByStatus(enabled, undefined)).toBe(true)
    })
  })

  describe('when filter is "enabled"', () => {
    it('should include enabled items', () => {
      expect(filterByStatus(enabled, 'enabled')).toBe(true)
    })

    it('should exclude disabled items', () => {
      expect(filterByStatus(disabled, 'enabled')).toBe(false)
    })
  })

  describe('when filter is "disabled"', () => {
    it('should include disabled items', () => {
      expect(filterByStatus(disabled, 'disabled')).toBe(true)
    })

    it('should exclude enabled items', () => {
      expect(filterByStatus(enabled, 'disabled')).toBe(false)
    })
  })
})
