import ProtectedRoute from './ProtectedRoute'
import { Resource, PermissionLevel } from '../types/permissions'

interface PermissionRouteProps {
  children: React.ReactNode
  resource: Resource
  level?: PermissionLevel
}

const PermissionRoute = ({
  children,
  resource,
  level = 'view'
}: PermissionRouteProps) => {
  return (
    <ProtectedRoute requiredResource={resource} requiredLevel={level}>
      {children}
    </ProtectedRoute>
  )
}

export default PermissionRoute