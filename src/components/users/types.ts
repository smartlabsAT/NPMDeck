/**
 * Permission level for feature access control
 */
export type PermissionLevel = 'hidden' | 'view' | 'manage'

/**
 * Visibility level for item scope
 */
export type VisibilityLevel = 'all' | 'user'

/**
 * Form data structure for user create/edit forms
 */
export interface UserFormData {
  name: string
  nickname: string
  email: string
  is_disabled: boolean
  is_admin: boolean
  current_password: string
  new_password: string
  confirm_password: string
  permissions: {
    visibility: VisibilityLevel
    proxy_hosts: PermissionLevel
    redirection_hosts: PermissionLevel
    dead_hosts: PermissionLevel
    streams: PermissionLevel
    access_lists: PermissionLevel
    certificates: PermissionLevel
  }
}

/**
 * Permission preset configuration
 */
export interface PermissionPreset {
  name: string
  description: string
  permissions: UserFormData['permissions']
}
