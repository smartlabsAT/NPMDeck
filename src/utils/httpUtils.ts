/**
 * HTTP utility functions
 * Extracted from RedirectionHosts page and RedirectionHostDetailsDialog
 */

/** Map of HTTP redirect status codes to their labels */
export const HTTP_REDIRECT_STATUS_CODES: Record<number, string> = {
  300: '300 Multiple Choices',
  301: '301 Moved Permanently',
  302: '302 Found',
  303: '303 See Other',
  307: '307 Temporary Redirect',
  308: '308 Permanent Redirect',
}

/**
 * Get the human-readable label for an HTTP status code.
 *
 * @param code - HTTP status code number
 * @returns Label string (e.g. "301 Moved Permanently") or the code as string if unknown
 */
export function getHttpStatusLabel(code: number): string {
  return HTTP_REDIRECT_STATUS_CODES[code] || code.toString()
}
