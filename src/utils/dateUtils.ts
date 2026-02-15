/**
 * Date utility functions
 * Extracted from Dashboard, Certificates, and multiple detail dialogs
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Default Intl.DateTimeFormatOptions for detailed date display */
const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

/**
 * Calculate the number of days until a given expiry date.
 *
 * @param expiresOn - ISO date string or null
 * @returns Number of days until expiry, or null if no date provided
 */
export function getDaysUntilExpiry(expiresOn: string | null): number | null {
  if (!expiresOn) return null
  const expiryDate = new Date(expiresOn)
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / MS_PER_DAY)
  return diffDays
}

/**
 * Format a date string for display.
 *
 * @param dateString - ISO date string or null
 * @param options - Intl.DateTimeFormatOptions (defaults to detailed format with month/day/year/time)
 * @returns Formatted date string, or 'N/A' if no date provided
 */
export function formatDate(
  dateString: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', options ?? DEFAULT_DATE_OPTIONS)
}
