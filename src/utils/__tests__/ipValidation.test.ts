import { describe, it, expect } from 'vitest'
import { validateIpCidr } from '../ipValidation'

describe('validateIpCidr', () => {
  describe('special values', () => {
    it('accepts "all" as valid', () => {
      expect(validateIpCidr('all')).toBeNull()
    })

    it('rejects empty string', () => {
      expect(validateIpCidr('')).not.toBeNull()
    })
  })

  describe('IPv4', () => {
    it('accepts valid IPv4 without CIDR', () => {
      expect(validateIpCidr('192.168.1.1')).toBeNull()
    })

    it('accepts 0.0.0.0', () => {
      expect(validateIpCidr('0.0.0.0')).toBeNull()
    })

    it('accepts 255.255.255.255', () => {
      expect(validateIpCidr('255.255.255.255')).toBeNull()
    })

    it('rejects octet > 255', () => {
      expect(validateIpCidr('256.1.1.1')).not.toBeNull()
    })

    it('rejects too few octets', () => {
      expect(validateIpCidr('192.168.1')).not.toBeNull()
    })
  })

  describe('IPv4 CIDR', () => {
    it('accepts /24', () => {
      expect(validateIpCidr('192.168.1.0/24')).toBeNull()
    })

    it('accepts /0', () => {
      expect(validateIpCidr('0.0.0.0/0')).toBeNull()
    })

    it('accepts /32', () => {
      expect(validateIpCidr('192.168.1.1/32')).toBeNull()
    })

    it('rejects /33 (out of IPv4 range)', () => {
      expect(validateIpCidr('192.168.1.0/33')).not.toBeNull()
    })
  })

  describe('IPv6', () => {
    it('accepts compressed IPv6', () => {
      expect(validateIpCidr('2001:db8::1')).toBeNull()
    })

    it('accepts full IPv6', () => {
      expect(validateIpCidr('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBeNull()
    })

    it('accepts IPv6 with CIDR', () => {
      expect(validateIpCidr('2001:db8::/32')).toBeNull()
    })
  })

  describe('invalid formats', () => {
    it('rejects random string', () => {
      expect(validateIpCidr('not-an-ip')).not.toBeNull()
    })

    it('rejects hostname', () => {
      expect(validateIpCidr('example.com')).not.toBeNull()
    })

    it('rejects whitespace-only input', () => {
      expect(validateIpCidr('   ')).not.toBeNull()
    })
  })
})
