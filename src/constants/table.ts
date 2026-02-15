/**
 * Table-related constants shared across all DataTable pages.
 */

/** Default rows-per-page options for standard entity tables */
export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

/** Rows-per-page options for the audit log (higher defaults) */
export const AUDIT_LOG_ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200] as const
