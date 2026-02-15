/**
 * localStorage key constants
 * Centralized to prevent typos and enable easy refactoring
 */
export const STORAGE_KEYS = {
  TOKEN: 'npm_token',
  USER: 'npm_user',
  TOKEN_STACK: 'npm_token_stack',
  THEME_MODE: 'npm-theme-mode',
  CERT_GROUP_BY_DOMAIN: 'npm.certificates.groupByDomain',
} as const
