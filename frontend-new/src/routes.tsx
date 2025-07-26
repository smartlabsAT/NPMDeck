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
const ImportExport = lazy(() => import('./pages/ImportExport'))
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
        element: withSuspense(Dashboard),
      },
      {
        path: 'dashboard',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'hosts/proxy',
        element: withSuspense(ProxyHosts),
      },
      {
        path: 'hosts/proxy/new',
        element: withSuspense(ProxyHosts),
      },
      {
        path: 'hosts/proxy/:id/edit',
        element: withSuspense(ProxyHosts),
      },
      {
        path: 'hosts/proxy/:id/view',
        element: withSuspense(ProxyHosts),
      },
      {
        path: 'hosts/proxy/:id/view/:tab',
        element: withSuspense(ProxyHosts),
      },
      {
        path: 'hosts/redirection',
        element: withSuspense(RedirectionHosts),
      },
      {
        path: 'hosts/redirection/new',
        element: withSuspense(RedirectionHosts),
      },
      {
        path: 'hosts/redirection/:id/edit',
        element: withSuspense(RedirectionHosts),
      },
      {
        path: 'hosts/redirection/:id/view',
        element: withSuspense(RedirectionHosts),
      },
      {
        path: 'hosts/redirection/:id/view/:tab',
        element: withSuspense(RedirectionHosts),
      },
      {
        path: 'hosts/404',
        element: withSuspense(DeadHosts),
      },
      {
        path: 'hosts/404/new',
        element: withSuspense(DeadHosts),
      },
      {
        path: 'hosts/404/:id/edit',
        element: withSuspense(DeadHosts),
      },
      {
        path: 'hosts/404/:id/view',
        element: withSuspense(DeadHosts),
      },
      {
        path: 'hosts/404/:id/view/:tab',
        element: withSuspense(DeadHosts),
      },
      {
        path: 'hosts/streams',
        element: withSuspense(Streams),
      },
      {
        path: 'hosts/streams/new',
        element: withSuspense(Streams),
      },
      {
        path: 'hosts/streams/:id/edit',
        element: withSuspense(Streams),
      },
      {
        path: 'hosts/streams/:id/view',
        element: withSuspense(Streams),
      },
      {
        path: 'security/access-lists',
        element: withSuspense(AccessLists),
      },
      {
        path: 'security/access-lists/new',
        element: withSuspense(AccessLists),
      },
      {
        path: 'security/access-lists/:id/edit',
        element: withSuspense(AccessLists),
      },
      {
        path: 'security/access-lists/:id/view',
        element: withSuspense(AccessLists),
      },
      {
        path: 'security/certificates',
        element: withSuspense(Certificates),
      },
      {
        path: 'security/certificates/new',
        element: withSuspense(Certificates),
      },
      {
        path: 'security/certificates/new/:provider',
        element: withSuspense(Certificates),
      },
      {
        path: 'security/certificates/:id/edit',
        element: withSuspense(Certificates),
      },
      {
        path: 'security/certificates/:id/view',
        element: withSuspense(Certificates),
      },
      {
        path: 'security/certificates/:id/view/:tab',
        element: withSuspense(Certificates),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute requiredRole="admin">
            {withSuspense(Users)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/audit-log',
        element: (
          <ProtectedRoute requiredRole="admin">
            {withSuspense(AuditLog)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/settings',
        element: (
          <ProtectedRoute requiredRole="admin">
            {withSuspense(Settings)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'tools/import-export',
        element: withSuspense(ImportExport),
      },
      {
        path: '*',
        element: withSuspense(NotFound),
      },
    ],
  },
]