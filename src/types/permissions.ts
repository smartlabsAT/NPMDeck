import type { CoreResource } from './entityTypes'

export type PermissionLevel = 'hidden' | 'view' | 'manage'

export type Resource = CoreResource

export type VisibilityScope = 'all' | 'user'

export interface UserPermissions {
  visibility?: VisibilityScope
  proxy_hosts?: PermissionLevel
  redirection_hosts?: PermissionLevel
  dead_hosts?: PermissionLevel
  streams?: PermissionLevel
  access_lists?: PermissionLevel
  certificates?: PermissionLevel
}

export interface PermissionCheck {
  resource: Resource
  level: PermissionLevel
}

export const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  hidden: 0,
  view: 1,
  manage: 2
}

export const ADMIN_ROLE = 'admin'

export const DEFAULT_PERMISSIONS: UserPermissions = {
  visibility: 'all',
  proxy_hosts: 'hidden',
  redirection_hosts: 'hidden',
  dead_hosts: 'hidden',
  streams: 'hidden',
  access_lists: 'hidden',
  certificates: 'hidden'
}