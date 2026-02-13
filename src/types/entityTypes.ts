/**
 * Core API resources that support RBAC permissions.
 * These 6 entities are managed by Nginx Proxy Manager with role-based access.
 */
export type CoreResource = 
  | 'proxy_hosts' 
  | 'redirection_hosts' 
  | 'dead_hosts' 
  | 'streams' 
  | 'access_lists' 
  | 'certificates'

/**
 * All entity resources including users.
 * Extends CoreResource for contexts that include user management.
 */
export type EntityResource = CoreResource | 'users'

/**
 * Search resource types including virtual 'action' type for audit log actions.
 */
export type SearchResourceType = EntityResource | 'action'

/**
 * Kebab-case entity identifiers used by the NPM API
 * in audit logs and UI display contexts.
 */
export type ApiEntitySlug = 
  | 'proxy-host'
  | 'redirection-host'
  | 'dead-host'
  | 'stream'
  | 'certificate'
  | 'access-list'
  | 'user'

/**
 * Toast entity type: ApiEntitySlug plus non-entity UI sections.
 */
export type ToastEntityType = ApiEntitySlug | 'settings' | 'audit-log'
