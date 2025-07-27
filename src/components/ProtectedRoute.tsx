import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { CircularProgress, Box } from '@mui/material'
import { Resource, PermissionLevel } from '../types/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredResource?: Resource
  requiredLevel?: PermissionLevel
}

const ProtectedRoute = ({ children, requiredRole, requiredResource, requiredLevel = 'view' }: ProtectedRouteProps) => {
  const location = useLocation()
  const { isAuthenticated, isLoading, user, hasPermission, isAdmin } = useAuthStore()

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access if required
  if (requiredRole && user) {
    const hasRole = user.roles.includes(requiredRole) || isAdmin()
    if (!hasRole) {
      return <Navigate to="/403" state={{ from: location }} replace />
    }
  }

  // Check permission-based access if required
  if (requiredResource && user) {
    const hasRequiredPermission = hasPermission(requiredResource, requiredLevel)
    if (!hasRequiredPermission) {
      return <Navigate to="/403" state={{ from: location, requiredResource, requiredLevel }} replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute