import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { CircularProgress, Box } from '@mui/material'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation()
  const { isAuthenticated, isLoading, user } = useAuthStore()

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
    const hasRole = user.roles.includes(requiredRole) || user.roles.includes('admin')
    if (!hasRole) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute