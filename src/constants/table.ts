/**
 * Table-related constants shared across all DataTable pages.
 */

/** Default rows-per-page options for standard entity tables */
export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

/** Rows-per-page options for the audit log (higher defaults) */
export const AUDIT_LOG_ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200] as const

/** Shared SSL filter options for entity tables */
export const SSL_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'forced', label: 'SSL Forced' },
  { value: 'optional', label: 'SSL Optional' },
  { value: 'disabled', label: 'No SSL' },
] as const

/** Shared status (enabled/disabled) filter options for entity tables */
export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
] as const
