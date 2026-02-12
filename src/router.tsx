import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'
import ProtectedRoute from './components/ProtectedRoute'
import LayoutWithSearch from './components/LayoutWithSearch'

// Lazy load pages
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ProxyHosts = lazy(() => import('./pages/ProxyHosts'))
const RedirectionHosts = lazy(() => import('./pages/RedirectionHosts'))
const Streams = lazy(() => import('./pages/Streams'))
const DeadHosts = lazy(() => import('./pages/DeadHosts'))
const AccessLists = lazy(() => import('./pages/AccessLists'))
const Certificates = lazy(() => import('./pages/Certificates'))
const Users = lazy(() => import('./pages/Users'))
const AuditLog = lazy(() => import('./pages/AuditLog'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Loading component
const PageLoader = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "200px"
    }}>
    <CircularProgress />
  </Box>
)

export const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={
          <ProtectedRoute>
            <LayoutWithSearch />
          </ProtectedRoute>
        }>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          
          {/* Hosts Management */}
          <Route path="/hosts/proxy" element={<ProxyHosts />} />
          <Route path="/hosts/proxy/:id/*" element={<ProxyHosts />} />
          <Route path="/hosts/redirection" element={<RedirectionHosts />} />
          <Route path="/hosts/redirection/:id/*" element={<RedirectionHosts />} />
          <Route path="/hosts/404" element={<DeadHosts />} />
          <Route path="/hosts/streams" element={<Streams />} />
          
          {/* Security */}
          <Route path="/security/access-lists" element={<AccessLists />} />
          <Route path="/security/certificates" element={<Certificates />} />
          <Route path="/security/certificates/:id/*" element={<Certificates />} />
          
          {/* Administration - Admin only */}
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="admin">
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-log" element={
            <ProtectedRoute requiredRole="admin">
              <AuditLog />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requiredRole="admin">
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}