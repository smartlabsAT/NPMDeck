/**
 * Layout dimension constants
 */
export const LAYOUT = {
  /** Side navigation drawer width in pixels */
  DRAWER_WIDTH: 240,
  /** Top toolbar height in pixels */
  TOOLBAR_HEIGHT: 64,
  /** Breakpoint width (px) for compact table layout */
  COMPACT_BREAKPOINT: 1250,
  /** Breakpoint width (px) for switching to card layout on DataTable */
  CARD_BREAKPOINT: 900,
  /** Max width (px) for mobile search/filter buttons */
  MOBILE_BUTTON_MAX_WIDTH: 400,
  /** Standard drawer panel width (px) for entity create/edit drawers */
  DRAWER_PANEL_WIDTH: 600,
} as const

/**
 * Z-index hierarchy for layered UI elements.
 * Higher values appear above lower values.
 */
export const Z_INDEX = {
  /** Loading progress bar in the navigation layout */
  LOADING_BAR: 1201,
  /** Search dropdown/autocomplete overlay */
  SEARCH_DROPDOWN: 1300,
  /** Toast notification base z-index (stacked toasts add their index) */
  TOAST: 1400,
  /** Token expiry warning alert */
  EXPIRY_WARNING: 1500,
  /** Token refresh progress indicator */
  TOKEN_REFRESH: 2000,
} as const

/**
 * Font weight constants to avoid magic numbers.
 */
export const FONT_WEIGHT = {
  MEDIUM: 500,
  SEMI_BOLD: 600,
} as const
