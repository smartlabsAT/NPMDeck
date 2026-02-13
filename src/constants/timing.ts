/**
 * Timing constants for timeouts, delays, and durations
 */
export const TIMING = {
  /** Clipboard notification auto-reset (ms) */
  CLIPBOARD_RESET: 2000,
  /** Auto-save status reset delay (ms) */
  AUTOSAVE_RESET: 2000,
  /** Default toast notification duration (ms) */
  TOAST_DEFAULT: 6000,
  /** Error toast notification duration (ms) */
  TOAST_ERROR: 8000,
  /** Session token refresh delay (ms) */
  SESSION_REFRESH: 5000,
  /** Navigation delay after search selection (ms) */
  NAVIGATION_DELAY: 100,
  /** Delay to prevent dropdown from reopening (ms) */
  PREVENT_REOPEN: 500,
  /** Default animation transition duration (ms) */
  ANIMATION: 300,
  /** Global search cache time-to-live (ms) */
  SEARCH_CACHE_TTL: 5 * 60 * 1000,
  /** Modal close delay after success (ms) */
  MODAL_CLOSE_DELAY: 1500,
  /** Toast success notification duration (ms) */
  TOAST_SUCCESS: 3000,
  /** Auto-save delay for drawer forms (ms) */
  AUTOSAVE_DELAY: 3000,
} as const
