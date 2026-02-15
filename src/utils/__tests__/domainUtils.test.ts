import { describe, it, expect } from 'vitest'
import { extractBaseDomain } from '../domainUtils'

describe('extractBaseDomain', () => {
  describe('standard domain extraction', () => {
    it('should return the input unchanged for a simple two-part domain', () => {
      expect(extractBaseDomain('example.com')).toBe('example.com')
    })

    it('should extract base domain from subdomain', () => {
      expect(extractBaseDomain('sub.example.com')).toBe('example.com')
    })

    it('should extract base domain from deeply nested subdomain', () => {
      expect(extractBaseDomain('a.b.c.example.com')).toBe('example.com')
    })

    it('should handle second-level TLDs like co.uk', () => {
      expect(extractBaseDomain('sub.example.co.uk')).toBe('example.co.uk')
    })

    it('should handle com.au as second-level TLD', () => {
      expect(extractBaseDomain('app.service.example.com.au')).toBe('example.com.au')
    })

    it('should return two-part domain with second-level TLD unchanged', () => {
      // "example.co" - "co" is in SECOND_LEVEL_DOMAINS but only 2 parts, no extra part to slice
      expect(extractBaseDomain('example.co')).toBe('example.co')
    })

    it('should return input unchanged when no dots are present', () => {
      expect(extractBaseDomain('localhost')).toBe('localhost')
    })
  })

  describe('with parseCompoundNames option', () => {
    it('should extract domain before separator " - "', () => {
      const result = extractBaseDomain('api.example.com - Production', { parseCompoundNames: true })
      expect(result).toBe('example.com')
    })

    it('should extract domain before separator " | "', () => {
      const result = extractBaseDomain('cdn.example.org | Staging', { parseCompoundNames: true })
      expect(result).toBe('example.org')
    })

    it('should extract domain before separator " / "', () => {
      const result = extractBaseDomain('mail.example.net / Internal', { parseCompoundNames: true })
      expect(result).toBe('example.net')
    })

    it('should handle plain domain with parseCompoundNames enabled', () => {
      const result = extractBaseDomain('example.com', { parseCompoundNames: true })
      expect(result).toBe('example.com')
    })

    it('should handle non-domain input with parseCompoundNames', () => {
      const result = extractBaseDomain('My Certificate', { parseCompoundNames: true })
      expect(result).toBe('My Certificate')
    })

    it('should use first separator found when multiple exist', () => {
      const result = extractBaseDomain('app.example.com - Prod | V2', { parseCompoundNames: true })
      expect(result).toBe('example.com')
    })
  })
})
