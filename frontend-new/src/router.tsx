import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'

// Lazy load pages
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
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
)

export const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        
        {/* Hosts Management */}
        <Route path="/hosts/proxy" element={<ProxyHosts />} />
        <Route path="/hosts/redirection" element={<RedirectionHosts />} />
        <Route path="/hosts/404" element={<DeadHosts />} />
        <Route path="/hosts/streams" element={<Streams />} />
        
        {/* Security */}
        <Route path="/security/access-lists" element={<AccessLists />} />
        <Route path="/security/certificates" element={<Certificates />} />
        
        {/* Administration */}
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/audit-log" element={<AuditLog />} />
        <Route path="/admin/settings" element={<Settings />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}