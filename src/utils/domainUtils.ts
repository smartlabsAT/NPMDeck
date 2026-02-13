/**
 * Domain utility functions
 * Extracted from ProxyHosts, RedirectionHosts, and Certificates pages
 */

/** Common second-level domain parts (e.g. co.uk, com.au) */
const SECOND_LEVEL_DOMAINS = ['co', 'com', 'net', 'org', 'gov', 'edu']

/** Separators used in certificate names */
const NAME_SEPARATORS = [' - ', ' – ', ' — ', ' | ', ' / ', ' \\ ']

/** Regex pattern to match domain names */
const DOMAIN_PATTERN = /([a-zA-Z0-9][a-zA-Z0-9-]*\.)*([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/

/**
 * Extract the base domain from a domain string or certificate name.
 *
 * Without options: splits a domain like "sub.example.com" into "example.com".
 * With `parseCompoundNames: true`: also handles certificate names containing
 * separators (e.g. "api.example.com - Production") and regex matching.
 *
 * @param input - Domain string or certificate name
 * @param options - Optional parsing configuration
 * @returns The extracted base domain
 */
export function extractBaseDomain(
  input: string,
  options?: { parseCompoundNames?: boolean },
): string {
  let domainPart = input

  if (options?.parseCompoundNames) {
    // Try to extract domain from name (before any separators)
    for (const sep of NAME_SEPARATORS) {
      if (input.includes(sep)) {
        domainPart = input.split(sep)[0].trim()
        break
      }
    }

    // Match domain pattern via regex
    const domainMatch = domainPart.match(DOMAIN_PATTERN)
    if (domainMatch && domainMatch[2]) {
      return domainMatch[2]
    }
  }

  // Standard domain extraction
  if (domainPart.includes('.')) {
    const parts = domainPart.split('.')
    if (parts.length > 2) {
      const secondLevel = parts[parts.length - 2]
      if (SECOND_LEVEL_DOMAINS.includes(secondLevel) && parts.length > 3) {
        return parts.slice(-3).join('.')
      }
      return parts.slice(-2).join('.')
    }
    return domainPart
  }

  return input
}
