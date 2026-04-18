/**
 * Validates an IP address or CIDR range string.
 * Accepts IPv4, IPv4+CIDR, IPv6, IPv6+CIDR, and the special keyword "all".
 *
 * @returns null when valid, or an error message string when invalid.
 */
export const validateIpCidr = (address: string): string | null => {
  if (!address || address.trim() === '') {
    return 'IP address is required'
  }

  // Allow special keyword 'all'
  if (address === 'all') {
    return null
  }

  // IPv4 with optional CIDR
  const ipv4CidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/

  // IPv6 with optional CIDR (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$/

  if (!ipv4CidrRegex.test(address) && !ipv6Regex.test(address)) {
    return 'Please enter a valid IP address, CIDR range, or "all"'
  }

  // Additional validation for IPv4
  if (ipv4CidrRegex.test(address)) {
    const parts = address.split('/')
    const ip = parts[0]
    const cidr = parts[1]

    // Validate IP octets
    const octets = ip.split('.')
    for (const octet of octets) {
      const num = parseInt(octet, 10)
      if (num < 0 || num > 255) {
        return 'Invalid IP address: each octet must be between 0-255'
      }
    }

    // Validate CIDR if present
    if (cidr) {
      const cidrNum = parseInt(cidr, 10)
      if (cidrNum < 0 || cidrNum > 32) {
        return 'Invalid CIDR: must be between 0-32'
      }
    }
  }

  return null
}
