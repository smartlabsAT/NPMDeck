import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Loading component
const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
)

// Wrap lazy components in Suspense
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

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

export const routes = [
  {
    path: '/login',
    element: withSuspense(Login),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'hosts/proxy',
        element: <ProxyHosts />,
      },
      {
        path: 'hosts/redirection',
        element: <RedirectionHosts />,
      },
      {
        path: 'hosts/404',
        element: <DeadHosts />,
      },
      {
        path: 'hosts/streams',
        element: <Streams />,
      },
      {
        path: 'security/access-lists',
        element: <AccessLists />,
      },
      {
        path: 'security/certificates',
        element: <Certificates />,
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute requiredRole="admin">
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/audit-log',
        element: (
          <ProtectedRoute requiredRole="admin">
            <AuditLog />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/settings',
        element: (
          <ProtectedRoute requiredRole="admin">
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]