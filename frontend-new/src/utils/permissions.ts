import { User } from '../api/users'
import { 
  PermissionLevel, 
  Resource, 
  UserPermissions, 
  PERMISSION_HIERARCHY, 
  ADMIN_ROLE,
  DEFAULT_PERMISSIONS 
} from '../types/permissions'

export const isAdmin = (user: User | null): boolean => {
  if (!user) return false
  return user.roles.includes(ADMIN_ROLE)
}

export const hasPermission = (
  user: User | null, 
  resource: Resource, 
  requiredLevel: PermissionLevel
): boolean => {
  if (!user) return false
  
  if (isAdmin(user)) return true
  
  const permissions = user.permissions || DEFAULT_PERMISSIONS
  const userLevel = permissions[resource] || 'hidden'
  
  return PERMISSION_HIERARCHY[userLevel] >= PERMISSION_HIERARCHY[requiredLevel]
}

export const canView = (user: User | null, resource: Resource): boolean => {
  return hasPermission(user, resource, 'view')
}

export const canManage = (user: User | null, resource: Resource): boolean => {
  return hasPermission(user, resource, 'manage')
}

export const getPermissionLevel = (user: User | null, resource: Resource): PermissionLevel => {
  if (!user) return 'hidden'
  
  if (isAdmin(user)) return 'manage'
  
  const permissions = user.permissions || DEFAULT_PERMISSIONS
  return permissions[resource] || 'hidden'
}

export const hasAnyPermission = (user: User | null, requiredLevel: PermissionLevel = 'view'): boolean => {
  if (!user) return false
  
  if (isAdmin(user)) return true
  
  const permissions = user.permissions || DEFAULT_PERMISSIONS
  const resources: Resource[] = [
    'proxy_hosts',
    'redirection_hosts', 
    'dead_hosts',
    'streams',
    'access_lists',
    'certificates'
  ]
  
  return resources.some(resource => 
    hasPermission(user, resource, requiredLevel)
  )
}

export const getVisibleResources = (user: User | null): Resource[] => {
  if (!user) return []
  
  const resources: Resource[] = [
    'proxy_hosts',
    'redirection_hosts',
    'dead_hosts', 
    'streams',
    'access_lists',
    'certificates'
  ]
  
  return resources.filter(resource => canView(user, resource))
}

export const shouldFilterByUser = (user: User | null): boolean => {
  if (!user) return true
  
  if (isAdmin(user)) return false
  
  const permissions = user.permissions || DEFAULT_PERMISSIONS
  return permissions.visibility === 'user'
}

export const canAccessResource = (
  user: User | null,
  resource: Resource,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean => {
  if (!user) return false
  
  switch (action) {
    case 'view':
      return canView(user, resource)
    case 'create':
    case 'edit':
    case 'delete':
      return canManage(user, resource)
    default:
      return false
  }
}