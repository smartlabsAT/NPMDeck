// Authentication related constants

// Token refresh intervals
export const TOKEN_REFRESH_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes
export const TOKEN_EXPIRY_WARNING_MINUTES = 5 // Show warning 5 minutes before expiry

// Get warning time from environment or use default
const envWarningMinutes = import.meta.env.VITE_TOKEN_WARNING_MINUTES
export const CONFIGURED_WARNING_MINUTES = envWarningMinutes ? 
  parseInt(envWarningMinutes, 10) : 
  TOKEN_EXPIRY_WARNING_MINUTES