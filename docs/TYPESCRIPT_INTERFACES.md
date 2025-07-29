# TypeScript Interface Documentation - NPMDeck Refactored System

This document provides comprehensive TypeScript interface definitions for the NPMDeck refactored system, ensuring type safety and developer productivity.

## Table of Contents

1. [Core Entity Interfaces](#core-entity-interfaces)
2. [Form Data Interfaces](#form-data-interfaces)
3. [Component Prop Interfaces](#component-prop-interfaces)
4. [Hook Interfaces](#hook-interfaces)
5. [API Interfaces](#api-interfaces)
6. [Utility Type Definitions](#utility-type-definitions)
7. [Validation Interfaces](#validation-interfaces)
8. [State Management Interfaces](#state-management-interfaces)

---

## Core Entity Interfaces

### Base Entity Interface

```typescript
/**
 * Base interface for all database entities
 * Contains common fields present in all resources
 */
interface BaseEntity {
  /** Unique identifier */
  id: number
  /** ISO 8601 creation timestamp */
  created_on: string
  /** ISO 8601 last modification timestamp */
  modified_on: string
  /** Whether the entity is enabled/active */
  enabled: boolean
}
```

### Proxy Host Interface

```typescript
/**
 * Proxy Host entity - HTTP/HTTPS reverse proxy configuration
 */
interface ProxyHost extends BaseEntity {
  /** Array of domain names this proxy handles */
  domain_names: string[]
  /** HTTP response code for redirections (301, 302, etc.) */
  forward_http_code: number
  /** Protocol scheme for forwarding (http/https) */
  forward_scheme: 'http' | 'https'
  /** Target hostname or IP address */
  forward_domain_name: string
  /** Target port number */
  forward_port: number
  /** Whether to preserve the original path */
  preserve_path: boolean
  /** Associated SSL certificate ID */
  certificate_id: number | null
  /** Force SSL redirect */
  ssl_forced: boolean
  /** Enable HTTP Strict Transport Security */
  hsts_enabled: boolean
  /** Include subdomains in HSTS */
  hsts_subdomains: boolean
  /** Enable common exploit blocking */
  block_exploits: boolean
  /** Enable HTTP/2 support */
  http2_support: boolean
  /** Custom nginx configuration */
  advanced_config: string
  /** Metadata object for additional information */
  meta: ProxyHostMeta
  
  // Expanded relationships (optional based on API request)
  /** Associated user/owner information */
  owner?: User
  /** Associated SSL certificate details */
  certificate?: Certificate
  /** Associated access list */
  access_list?: AccessList
}

/**
 * Proxy Host metadata structure
 */
interface ProxyHostMeta {
  /** Whether nginx is online for this host */
  nginx_online?: boolean
  /** Nginx error message if any */
  nginx_err?: string | null
  /** DNS challenge configuration for Let's Encrypt */
  dns_challenge?: boolean
  /** DNS provider for certificate validation */
  dns_provider?: string
  /** DNS provider credentials (encrypted) */
  dns_provider_credentials?: string
  /** DNS propagation wait time in seconds */
  propagation_seconds?: number
  /** Let's Encrypt email address */
  letsencrypt_email?: string
  /** Let's Encrypt terms agreement */
  letsencrypt_agree?: boolean
}
```

### Redirection Host Interface

```typescript
/**
 * Redirection Host entity - HTTP redirections
 */
interface RedirectionHost extends BaseEntity {
  /** Array of source domain names */
  domain_names: string[]
  /** HTTP response code (301, 302, 307, 308) */
  forward_http_code: 301 | 302 | 307 | 308
  /** Target URL scheme */
  forward_scheme: 'http' | 'https' | '$scheme'
  /** Target domain name */
  forward_domain_name: string
  /** Whether to preserve the original path */
  preserve_path: boolean
  /** Associated SSL certificate ID */
  certificate_id: number | null
  /** Force SSL redirect */
  ssl_forced: boolean
  /** Enable HSTS */
  hsts_enabled: boolean
  /** Include subdomains in HSTS */
  hsts_subdomains: boolean
  /** Enable exploit blocking */
  block_exploits: boolean
  /** Enable HTTP/2 support */
  http2_support: boolean
  /** Custom nginx configuration */
  advanced_config: string
  /** Metadata for additional configuration */
  meta: RedirectionHostMeta

  // Expanded relationships
  owner?: User
  certificate?: Certificate
  access_list?: AccessList
}

interface RedirectionHostMeta {
  nginx_online?: boolean
  nginx_err?: string | null
  dns_challenge?: boolean
  dns_provider?: string
  dns_provider_credentials?: string
  propagation_seconds?: number
  letsencrypt_email?: string
  letsencrypt_agree?: boolean
}
```

### Certificate Interface

```typescript
/**
 * SSL Certificate entity
 */
interface Certificate extends BaseEntity {
  /** Certificate provider (letsencrypt, other, etc.) */
  provider: 'letsencrypt' | 'other'
  /** Display name for the certificate */
  nice_name: string
  /** Array of domain names covered by certificate */
  domain_names: string[]
  /** Certificate expiration date (ISO 8601) */
  expires_on: string | null
  /** Certificate metadata */
  meta: CertificateMeta

  // Expanded relationships
  owner?: User
}

interface CertificateMeta {
  /** DNS challenge configuration */
  dns_challenge?: boolean
  /** DNS provider for validation */
  dns_provider?: string
  /** DNS provider credentials */
  dns_provider_credentials?: string
  /** DNS propagation seconds */
  propagation_seconds?: number
  /** Let's Encrypt email */
  letsencrypt_email?: string
  /** Let's Encrypt agreement */
  letsencrypt_agree?: boolean
  /** Certificate bundle in PEM format */
  certificate?: string
  /** Private key in PEM format */
  certificate_key?: string
  /** Intermediate certificates */
  intermediate_certificate?: string
}
```

### Access List Interface

```typescript
/**
 * Access List entity - Authentication and authorization
 */
interface AccessList extends BaseEntity {
  /** Display name for the access list */
  name: string
  /** Array of access list items */
  items: AccessListItem[]
  /** Metadata for additional configuration */
  meta: AccessListMeta

  // Expanded relationships
  owner?: User
}

interface AccessListItem {
  /** Item type (allow/deny) */
  directive: 'allow' | 'deny'
  /** IP address, range, or 'all' */
  address: string
  /** Optional description */
  description?: string
}

interface AccessListMeta {
  /** HTTP basic auth configuration */
  basic_auth?: boolean
  /** Username for basic auth */
  basic_auth_username?: string
  /** Password hash for basic auth */
  basic_auth_password?: string
}
```

### Stream Interface

```typescript
/**
 * Stream entity - TCP/UDP forwarding
 */
interface Stream extends BaseEntity {
  /** Incoming port number */
  incoming_port: number
  /** Target hostname or IP */
  forwarding_host: string
  /** Target port number */
  forwarding_port: number
  /** Protocol type */
  tcp_forwarding: boolean
  /** UDP forwarding enabled */
  udp_forwarding: boolean
  /** Metadata for stream configuration */
  meta: StreamMeta

  // Expanded relationships
  owner?: User
}

interface StreamMeta {
  /** Custom stream configuration */
  stream_config?: string
}
```

### User Interface

```typescript
/**
 * User entity - System users
 */
interface User extends BaseEntity {
  /** User email address (login) */
  email: string
  /** Display name */
  name: string
  /** User avatar/profile image */
  avatar?: string
  /** User roles and permissions */
  roles: UserRole[]
  /** Last login timestamp */
  last_login?: string
}

interface UserRole {
  /** Role identifier */
  id: string
  /** Role display name */
  name: string
  /** Array of permissions */
  permissions: Permission[]
}

interface Permission {
  /** Permission identifier */
  id: string
  /** Permission name */
  name: string
  /** Resource this permission applies to */
  resource: string
  /** Actions allowed (create, read, update, delete) */
  actions: string[]
}
```

---

## Form Data Interfaces

### Base Form Interface

```typescript
/**
 * Base interface for form data
 * Omits database-specific fields from entity interfaces
 */
type BaseFormData<T extends BaseEntity> = Omit<T, 'id' | 'created_on' | 'modified_on'>
```

### Proxy Host Form Data

```typescript
/**
 * Form data for creating/updating proxy hosts
 */
interface ProxyHostFormData {
  domain_names: string[]
  forward_scheme: 'http' | 'https'
  forward_domain_name: string
  forward_port: number
  preserve_path: boolean
  certificate_id: number | null
  ssl_forced: boolean
  hsts_enabled: boolean
  hsts_subdomains: boolean
  block_exploits: boolean
  http2_support: boolean
  advanced_config: string
  enabled: boolean
  
  // Meta fields flattened for easier form handling
  dns_challenge: boolean
  dns_provider: string
  dns_provider_credentials: string
  propagation_seconds: number
  letsencrypt_email: string
  letsencrypt_agree: boolean
}

/**
 * Create proxy host data (subset for creation)
 */
interface CreateProxyHostData extends Omit<ProxyHostFormData, 'enabled'> {
  // Enabled defaults to true for new hosts
}

/**
 * Update proxy host data (all fields optional except ID)
 */
interface UpdateProxyHostData extends Partial<ProxyHostFormData> {
  id: number
}
```

### Certificate Form Data

```typescript
/**
 * Form data for certificate management
 */
interface CertificateFormData {
  provider: 'letsencrypt' | 'other'
  nice_name: string
  domain_names: string[]
  
  // Let's Encrypt specific fields
  dns_challenge: boolean
  dns_provider: string
  dns_provider_credentials: string
  propagation_seconds: number
  letsencrypt_email: string
  letsencrypt_agree: boolean
  
  // Custom certificate fields (for 'other' provider)
  certificate: string
  certificate_key: string
  intermediate_certificate: string
}

interface CreateCertificateData extends CertificateFormData {}

interface UpdateCertificateData extends Partial<CertificateFormData> {
  id: number
}
```

### Access List Form Data

```typescript
/**
 * Form data for access list management
 */
interface AccessListFormData {
  name: string
  items: AccessListItemFormData[]
  
  // Basic auth configuration
  basic_auth: boolean
  basic_auth_username: string
  basic_auth_password: string
}

interface AccessListItemFormData {
  directive: 'allow' | 'deny'
  address: string
  description: string
}

interface CreateAccessListData extends AccessListFormData {}

interface UpdateAccessListData extends Partial<AccessListFormData> {
  id: number
}
```

---

## Component Prop Interfaces

### Base Drawer Props

```typescript
/**
 * Props for the BaseDrawer component
 */
interface BaseDrawerProps {
  // Core props
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  
  // State props
  loading?: boolean
  loadingMessage?: string
  error?: string | null
  success?: string | null
  isDirty?: boolean
  
  // Tab configuration
  tabs?: DrawerTab[]
  activeTab?: number
  onTabChange?: (index: number) => void
  
  // Action configuration
  actions?: React.ReactNode
  onSave?: () => void | Promise<void>
  onCancel?: () => void
  saveDisabled?: boolean
  saveText?: string
  cancelText?: string
  
  // Behavior configuration
  width?: number | string
  confirmClose?: boolean
  confirmCloseMessage?: string
  disableBackdropClick?: boolean
  disableEscapeKeyDown?: boolean
  
  // Styling
  className?: string
  sx?: Record<string, any>
}

/**
 * Tab configuration for drawer
 */
interface DrawerTab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  badgeColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  disabled?: boolean
  hasError?: boolean
}
```

### Form Section Props

```typescript
/**
 * Props for FormSection component
 */
interface FormSectionProps {
  // Content
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  
  // Behavior
  collapsible?: boolean
  defaultExpanded?: boolean
  required?: boolean
  disabled?: boolean
  
  // Validation state
  severity?: 'info' | 'warning' | 'error' | 'success'
  error?: boolean
  errorCount?: number
  
  // UI state
  loading?: boolean
  
  // Styling
  sx?: Record<string, any>
  elevation?: number
  subtle?: boolean
  
  // Header customization
  headerContent?: React.ReactNode
  
  // Animation
  animated?: boolean
  expandIcon?: React.ReactNode
  collapseIcon?: React.ReactNode
  
  // Events
  onToggle?: (expanded: boolean) => void
}
```

### Tab Panel Props

```typescript
/**
 * Props for TabPanel component
 */
interface TabPanelProps {
  // Core props
  children?: React.ReactNode
  index: number
  value: number
  
  // Animation configuration
  animation?: 'none' | 'fade' | 'slide' | 'grow' | 'collapse'
  timeout?: number
  slideDirection?: 'left' | 'right' | 'up' | 'down'
  
  // Behavior
  keepMounted?: boolean
  loading?: boolean
  loadingComponent?: React.ReactNode
  
  // Styling
  sx?: Record<string, any>
  padding?: number | string
  
  // Custom transitions
  TransitionComponent?: React.ComponentType<any>
  transitionProps?: Record<string, any>
  
  // Accessibility
  role?: string
  'aria-labelledby'?: string
  ariaProps?: Record<string, any>
}
```

### Feature Component Props

```typescript
/**
 * Props for ProxyHostDrawer component
 */
interface ProxyHostDrawerProps {
  open: boolean
  onClose: () => void
  proxyHost: ProxyHost | null
  onSave: (data: ProxyHostFormData) => Promise<void>
  certificates: Certificate[]
  accessLists?: AccessList[]
  loading?: boolean
  error?: string | null
}

/**
 * Props for CertificateDrawer component
 */
interface CertificateDrawerProps {
  open: boolean
  onClose: () => void
  certificate: Certificate | null
  onSave: (data: CertificateFormData) => Promise<void>
  dnsProviders: DNSProvider[]
  loading?: boolean
  error?: string | null
}

/**
 * Props for AccessListDrawer component
 */
interface AccessListDrawerProps {
  open: boolean
  onClose: () => void
  accessList: AccessList | null
  onSave: (data: AccessListFormData) => Promise<void>
  loading?: boolean
  error?: string | null
}
```

---

## Hook Interfaces

### Form Hook Interfaces

```typescript
/**
 * Configuration for useDrawerForm hook
 */
interface UseDrawerFormOptions<T extends Record<string, any>> {
  /** Initial form data */
  initialData: T
  /** Field-level configurations */
  fields?: Partial<Record<keyof T, FieldConfig>>
  /** Global form validation function */
  validate?: (data: T) => Partial<Record<keyof T, string>> | null
  /** Form submission handler */
  onSubmit: (data: T) => Promise<void> | void
  /** Success callback */
  onSuccess?: (data: T) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Auto-save configuration */
  autoSave?: AutoSaveConfig<T>
  /** Custom equality function for dirty checking */
  isEqual?: (a: T, b: T) => boolean
  /** Reset form after successful submission */
  resetOnSubmit?: boolean
}

/**
 * Field-level configuration
 */
interface FieldConfig<T = any> {
  /** Initial field value */
  initialValue: T
  /** Field validation function */
  validate?: (value: T) => string | null
  /** Whether field is required */
  required?: boolean
  /** Custom required field message */
  requiredMessage?: string
  /** Validate on value change */
  validateOnChange?: boolean
  /** Validate on field blur */
  validateOnBlur?: boolean
}

/**
 * Auto-save configuration
 */
interface AutoSaveConfig<T> {
  /** Enable auto-save functionality */
  enabled: boolean
  /** Delay before auto-save triggers (milliseconds) */
  delay?: number
  /** Auto-save handler function */
  onAutoSave: (data: T) => Promise<void> | void
}

/**
 * Form state returned by useDrawerForm
 */
interface FormState<T> {
  // Data
  data: T
  errors: Partial<Record<keyof T, string>>
  globalError: string | null
  
  // State flags
  loading: boolean
  isDirty: boolean
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  
  // Actions
  setFormData: (updates: Partial<T> | ((prev: T) => T)) => void
  setFieldValue: (key: keyof T, value: any) => void
  setFieldTouched: (key: keyof T, touched?: boolean) => void
  resetForm: (newInitialData?: T) => void
  handleSubmit: (event?: React.FormEvent) => Promise<void>
  
  // Helpers
  getFieldProps: (key: keyof T) => FieldProps
  validateField: (key: keyof T, value: any) => string | null
  validateAllFields: (data: T) => Record<keyof T, string>
}

/**
 * Field props for easy input binding
 */
interface FieldProps {
  name: string
  value: any
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur: () => void
  error: boolean
  helperText?: string
  disabled: boolean
}
```

### Permission Hook Interfaces

```typescript
/**
 * Permission hook return type
 */
interface UsePermissionsResult {
  /** Current user permissions */
  permissions: Permission[]
  /** Check if user has specific permission */
  hasPermission: (resource: string, action: string) => boolean
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (checks: PermissionCheck[]) => boolean
  /** Check if user has all specified permissions */
  hasAllPermissions: (checks: PermissionCheck[]) => boolean
  /** Get user role names */
  roles: string[]
  /** Check if user has specific role */
  hasRole: (roleName: string) => boolean
}

interface PermissionCheck {
  resource: string
  action: string
}
```

### Data Hook Interfaces

```typescript
/**
 * Filtered data hook options
 */
interface UseFilteredDataOptions<T> {
  /** Array of data to filter */
  data: T[]
  /** Search term for filtering */
  searchTerm: string
  /** Fields to search in */
  searchFields: (keyof T)[]
  /** Additional filter functions */
  filters?: FilterFunction<T>[]
  /** Sort configuration */
  sort?: SortConfig<T>
}

interface FilterFunction<T> {
  (item: T): boolean
}

interface SortConfig<T> {
  field: keyof T
  direction: 'asc' | 'desc'
}

interface UseFilteredDataResult<T> {
  /** Filtered and sorted data */
  filteredData: T[]
  /** Total count before filtering */
  totalCount: number
  /** Count after filtering */
  filteredCount: number
  /** Whether any filters are active */
  hasActiveFilters: boolean
}
```

---

## API Interfaces

### API Client Interface

```typescript
/**
 * Generic API client interface
 */
interface ApiClient<T, CreateT = Omit<T, 'id' | 'created_on' | 'modified_on'>, UpdateT = Partial<CreateT> & { id: number }> {
  /** Get all resources */
  getAll(options?: GetAllOptions): Promise<T[]>
  /** Get single resource by ID */
  getById(id: number, options?: GetByIdOptions): Promise<T>
  /** Create new resource */
  create(data: CreateT): Promise<T>
  /** Update existing resource */
  update(data: UpdateT): Promise<T>
  /** Delete resource */
  delete(id: number): Promise<void>
  /** Enable resource */
  enable?(id: number): Promise<T>
  /** Disable resource */
  disable?(id: number): Promise<T>
}

/**
 * Options for getAll requests
 */
interface GetAllOptions {
  /** Expand related resources */
  expand?: string[]
  /** Pagination limit */
  limit?: number
  /** Pagination offset */
  offset?: number
  /** Search query */
  search?: string
  /** Sort field and direction */
  sort?: string
  /** Additional filters */
  filters?: Record<string, any>
}

/**
 * Options for getById requests
 */
interface GetByIdOptions {
  /** Expand related resources */
  expand?: string[]
}
```

### Specific API Interfaces

```typescript
/**
 * Proxy Host API client
 */
interface ProxyHostApi extends ApiClient<ProxyHost, CreateProxyHostData, UpdateProxyHostData> {
  /** Auto-save proxy host data */
  autosave(data: Partial<ProxyHostFormData>): Promise<{ success: boolean }>
  /** Test proxy host configuration */
  test(id: number): Promise<{ success: boolean; message?: string }>
  /** Get nginx configuration for host */
  getNginxConfig(id: number): Promise<{ config: string }>
}

/**
 * Certificate API client
 */
interface CertificateApi extends ApiClient<Certificate, CreateCertificateData, UpdateCertificateData> {
  /** Renew Let's Encrypt certificate */
  renew(id: number): Promise<Certificate>
  /** Test certificate validity */
  test(id: number): Promise<{ valid: boolean; expires: string; message?: string }>
  /** Get available DNS providers */
  getDnsProviders(): Promise<DNSProvider[]>
}

/**
 * Access List API client
 */
interface AccessListApi extends ApiClient<AccessList, CreateAccessListData, UpdateAccessListData> {
  /** Test access list configuration */
  test(id: number, testIp: string): Promise<{ allowed: boolean; message: string }>
}
```

### API Response Interfaces

```typescript
/**
 * Standard API response wrapper
 */
interface ApiResponse<T> {
  /** Response data */
  data: T
  /** Success status */
  success: boolean
  /** Status message */
  message?: string
  /** Additional metadata */
  meta?: ResponseMeta
}

/**
 * Response metadata
 */
interface ResponseMeta {
  /** Total count (for paginated responses) */
  total?: number
  /** Current page */
  page?: number
  /** Items per page */
  limit?: number
  /** Request timestamp */
  timestamp?: string
}

/**
 * Error response structure
 */
interface ApiError {
  /** Error message */
  message: string
  /** HTTP status code */
  status: number
  /** Detailed error information */
  details?: Record<string, any>
  /** Validation errors (for 422 responses) */
  validationErrors?: Record<string, string>
}

/**
 * Paginated response
 */
interface PaginatedResponse<T> {
  /** Array of items */
  items: T[]
  /** Total number of items */
  total: number
  /** Current page number */
  page: number
  /** Items per page */
  limit: number
  /** Total number of pages */
  totalPages: number
  /** Whether there's a next page */
  hasNext: boolean
  /** Whether there's a previous page */
  hasPrev: boolean
}
```

---

## Utility Type Definitions

### Generic Utility Types

```typescript
/**
 * Make specified properties optional
 */
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specified properties required
 */
type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Exclude null and undefined from type
 */
type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Deep partial type
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Extract keys of specific type
 */
type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

/**
 * Enum-like object type
 */
type ValueOf<T> = T[keyof T]
```

### Form-Specific Types

```typescript
/**
 * Form field path type for nested objects
 */
type FieldPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${FieldPath<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never

/**
 * Get field type by path
 */
type FieldValue<T, P extends FieldPath<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends FieldPath<T[K]>
      ? FieldValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never

/**
 * Form validation error type
 */
type ValidationErrors<T> = Partial<Record<keyof T, string>>

/**
 * Form field state
 */
type FieldState = {
  value: any
  error: string | null
  touched: boolean
  dirty: boolean
}
```

### Component-Specific Types

```typescript
/**
 * Theme-aware color type
 */
type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

/**
 * Size variants
 */
type Size = 'small' | 'medium' | 'large'

/**
 * Breakpoint type
 */
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Animation timing
 */
type AnimationTiming = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'

/**
 * Ref types for forwarding refs
 */
type RefType<T> = React.Ref<T>
```

---

## Validation Interfaces

### Validation Function Types

```typescript
/**
 * Field validation function
 */
type ValidationFunction<T> = (value: T) => string | null

/**
 * Async validation function
 */
type AsyncValidationFunction<T> = (value: T) => Promise<string | null>

/**
 * Cross-field validation function
 */
type CrossFieldValidation<T> = (data: T) => ValidationErrors<T> | null

/**
 * Validation rule configuration
 */
interface ValidationRule<T = any> {
  /** Rule name/identifier */
  name: string
  /** Validation function */
  validate: ValidationFunction<T>
  /** Error message template */
  message: string
  /** Parameters for message interpolation */
  params?: Record<string, any>
}

/**
 * Common validation rules
 */
interface CommonValidationRules {
  required: ValidationRule<any>
  email: ValidationRule<string>
  url: ValidationRule<string>
  domain: ValidationRule<string>
  ip: ValidationRule<string>
  port: ValidationRule<number>
  minLength: (min: number) => ValidationRule<string>
  maxLength: (max: number) => ValidationRule<string>
  min: (min: number) => ValidationRule<number>
  max: (max: number) => ValidationRule<number>
  pattern: (regex: RegExp) => ValidationRule<string>
}
```

### Validation Schema Types

```typescript
/**
 * Validation schema for forms
 */
interface ValidationSchema<T> {
  /** Field-level validations */
  fields: Partial<Record<keyof T, ValidationRule[]>>
  /** Cross-field validations */
  crossField?: CrossFieldValidation<T>[]
}

/**
 * Validation result
 */
interface ValidationResult<T> {
  /** Whether validation passed */
  isValid: boolean
  /** Field-level errors */
  errors: ValidationErrors<T>
  /** Global/cross-field errors */
  globalErrors: string[]
}
```

---

## State Management Interfaces

### Store Interfaces

```typescript
/**
 * Auth store state
 */
interface AuthStore {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  
  // Selectors
  hasPermission: (resource: string, action: string) => boolean
  getRoles: () => string[]
}

/**
 * UI Settings store state
 */
interface UISettingsStore {
  // Theme settings
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  
  // Layout settings
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  compactMode: boolean
  
  // Table settings
  pageSize: number
  defaultSort: string
  
  // Actions
  setTheme: (theme: UISettingsStore['theme']) => void
  setPrimaryColor: (color: string) => void
  toggleSidebar: () => void
  toggleCompactMode: () => void
  setPageSize: (size: number) => void
  setDefaultSort: (sort: string) => void
}

/**
 * Feature-specific store state
 */
interface ProxyHostStore {
  // State
  hosts: ProxyHost[]
  selectedHost: ProxyHost | null
  isLoading: boolean
  error: string | null
  
  // UI state
  drawerOpen: boolean
  activeTab: number
  searchTerm: string
  filters: Record<string, any>
  
  // Actions
  fetchHosts: () => Promise<void>
  selectHost: (host: ProxyHost | null) => void
  openDrawer: (host?: ProxyHost) => void
  closeDrawer: () => void
  setActiveTab: (tab: number) => void
  setSearchTerm: (term: string) => void
  setFilters: (filters: Record<string, any>) => void
}
```

### Context Interfaces

```typescript
/**
 * Auth context value
 */
interface AuthContextValue {
  user: User | null
  permissions: Permission[]
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  hasPermission: (resource: string, action: string) => boolean
}

/**
 * Theme context value
 */
interface ThemeContextValue {
  mode: 'light' | 'dark' | 'auto'
  setMode: (mode: 'light' | 'dark' | 'auto') => void
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
  }
  breakpoints: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
}
```

---

## Type Guards and Utilities

### Type Guards

```typescript
/**
 * Type guard for checking if value is defined
 */
function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

/**
 * Type guard for ProxyHost
 */
function isProxyHost(obj: any): obj is ProxyHost {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    Array.isArray(obj.domain_names) &&
    typeof obj.forward_domain_name === 'string' &&
    typeof obj.forward_port === 'number'
  )
}

/**
 * Type guard for Certificate
 */
function isCertificate(obj: any): obj is Certificate {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.nice_name === 'string' &&
    Array.isArray(obj.domain_names)
  )
}

/**
 * Type guard for validation errors
 */
function hasValidationErrors<T>(
  result: any
): result is { validationErrors: ValidationErrors<T> } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'validationErrors' in result &&
    typeof result.validationErrors === 'object'
  )
}
```

### Utility Types for Forms

```typescript
/**
 * Extract form data type from entity
 */
type FormDataType<T extends BaseEntity> = Omit<T, 'id' | 'created_on' | 'modified_on'>

/**
 * Create form data type with optional fields
 */
type OptionalFormData<T, K extends keyof T> = FormDataType<T> & Partial<Pick<T, K>>

/**
 * Form submission handler type
 */
type FormSubmissionHandler<T> = (data: T) => Promise<void> | void

/**
 * Form field getter type
 */
type FieldGetter<T> = <K extends keyof T>(key: K) => FieldProps

/**
 * Form data setter type
 */
type FormDataSetter<T> = (updates: Partial<T> | ((prev: T) => T)) => void
```

This comprehensive TypeScript interface documentation ensures type safety throughout the NPMDeck refactored system, providing clear contracts for components, hooks, API clients, and data structures while enabling excellent developer experience with IntelliSense and compile-time type checking.