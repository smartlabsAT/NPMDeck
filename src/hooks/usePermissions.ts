import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'
import { User } from '../api/users'
import { Resource, PermissionLevel } from '../types/permissions'

interface UsePermissionsReturn {
  user: User | null
  hasPermission: (resource: Resource, level: PermissionLevel) => boolean
  canView: (resource: Resource) => boolean
  canManage: (resource: Resource) => boolean
  canAccess: (resource: Resource, action: 'view' | 'create' | 'edit' | 'delete') => boolean
  isAdmin: boolean
  hasAnyPermission: (level?: PermissionLevel) => boolean
  getVisibleResources: () => Resource[]
  shouldFilterByUser: boolean
  canCreateResource: (resource: Resource) => boolean
  canEditResource: (resource: Resource) => boolean
  canDeleteResource: (resource: Resource) => boolean
  hasAnyOfPermissions: (checks: Array<{ resource: Resource; level: PermissionLevel }>) => boolean
  hasAllOfPermissions: (checks: Array<{ resource: Resource; level: PermissionLevel }>) => boolean
}

export const usePermissions = (): UsePermissionsReturn => {
  const {
    user,
    hasPermission,
    canView,
    canManage,
    canAccess,
    isAdmin,
    hasAnyPermission,
    getVisibleResources,
    shouldFilterByUser
  } = useAuthStore()

  return useMemo(() => ({
    // Current user
    user,
    
    // Permission checks
    hasPermission: (resource: Resource, level: PermissionLevel) => 
      hasPermission(resource, level),
    
    canView: (resource: Resource) => 
      canView(resource),
    
    canManage: (resource: Resource) => 
      canManage(resource),
    
    canAccess: (resource: Resource, action: 'view' | 'create' | 'edit' | 'delete') => 
      canAccess(resource, action),
    
    // Role checks
    isAdmin: isAdmin(),
    
    // General checks
    hasAnyPermission: (level?: PermissionLevel) => 
      hasAnyPermission(level),
    
    // Visibility
    getVisibleResources: () => 
      getVisibleResources(),
    
    shouldFilterByUser: shouldFilterByUser(),
    
    // Helper methods
    canCreateResource: (resource: Resource) => 
      canAccess(resource, 'create'),
    
    canEditResource: (resource: Resource) => 
      canAccess(resource, 'edit'),
    
    canDeleteResource: (resource: Resource) => 
      canAccess(resource, 'delete'),
    
    // Check multiple resources at once
    hasAnyOfPermissions: (checks: Array<{ resource: Resource; level: PermissionLevel }>) =>
      checks.some(check => hasPermission(check.resource, check.level)),
    
    hasAllOfPermissions: (checks: Array<{ resource: Resource; level: PermissionLevel }>) =>
      checks.every(check => hasPermission(check.resource, check.level))
  }), [
    user,
    hasPermission,
    canView,
    canManage,
    canAccess,
    isAdmin,
    hasAnyPermission,
    getVisibleResources,
    shouldFilterByUser
  ])
}

