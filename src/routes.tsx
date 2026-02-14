import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionRoute from './components/PermissionRoute'
import LayoutWithSearch from './components/LayoutWithSearch'
import PageErrorBoundary from './components/PageErrorBoundary'

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

// Wrap lazy components in ErrorBoundary + Suspense to catch chunk load failures
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <PageErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </PageErrorBoundary>
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
// const ImportExport = lazy(() => import('./pages/ImportExport'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Forbidden = lazy(() => import('./pages/Forbidden'))

export const routes = [
  {
    path: '/login',
    element: withSuspense(Login),
  },
  {
    path: '/403',
    element: withSuspense(Forbidden),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LayoutWithSearch />
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
        element: (
          <PermissionRoute resource="proxy_hosts" level="view">
            {withSuspense(ProxyHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/proxy/new',
        element: (
          <PermissionRoute resource="proxy_hosts" level="manage">
            {withSuspense(ProxyHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/proxy/:id/edit',
        element: (
          <PermissionRoute resource="proxy_hosts" level="manage">
            {withSuspense(ProxyHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/proxy/:id/view',
        element: (
          <PermissionRoute resource="proxy_hosts" level="view">
            {withSuspense(ProxyHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/proxy/:id/view/:tab',
        element: (
          <PermissionRoute resource="proxy_hosts" level="view">
            {withSuspense(ProxyHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/redirection',
        element: (
          <PermissionRoute resource="redirection_hosts" level="view">
            {withSuspense(RedirectionHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/redirection/new',
        element: (
          <PermissionRoute resource="redirection_hosts" level="manage">
            {withSuspense(RedirectionHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/redirection/:id/edit',
        element: (
          <PermissionRoute resource="redirection_hosts" level="manage">
            {withSuspense(RedirectionHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/redirection/:id/view',
        element: (
          <PermissionRoute resource="redirection_hosts" level="view">
            {withSuspense(RedirectionHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/redirection/:id/view/:tab',
        element: (
          <PermissionRoute resource="redirection_hosts" level="view">
            {withSuspense(RedirectionHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/404',
        element: (
          <PermissionRoute resource="dead_hosts" level="view">
            {withSuspense(DeadHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/404/new',
        element: (
          <PermissionRoute resource="dead_hosts" level="manage">
            {withSuspense(DeadHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/404/:id/edit',
        element: (
          <PermissionRoute resource="dead_hosts" level="manage">
            {withSuspense(DeadHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/404/:id/view',
        element: (
          <PermissionRoute resource="dead_hosts" level="view">
            {withSuspense(DeadHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/404/:id/view/:tab',
        element: (
          <PermissionRoute resource="dead_hosts" level="view">
            {withSuspense(DeadHosts)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/streams',
        element: (
          <PermissionRoute resource="streams" level="view">
            {withSuspense(Streams)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/streams/new',
        element: (
          <PermissionRoute resource="streams" level="manage">
            {withSuspense(Streams)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/streams/:id/edit',
        element: (
          <PermissionRoute resource="streams" level="manage">
            {withSuspense(Streams)}
          </PermissionRoute>
        ),
      },
      {
        path: 'hosts/streams/:id/view',
        element: (
          <PermissionRoute resource="streams" level="view">
            {withSuspense(Streams)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/access-lists',
        element: (
          <PermissionRoute resource="access_lists" level="view">
            {withSuspense(AccessLists)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/access-lists/new',
        element: (
          <PermissionRoute resource="access_lists" level="manage">
            {withSuspense(AccessLists)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/access-lists/:id/edit',
        element: (
          <PermissionRoute resource="access_lists" level="manage">
            {withSuspense(AccessLists)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/access-lists/:id/view',
        element: (
          <PermissionRoute resource="access_lists" level="view">
            {withSuspense(AccessLists)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/certificates',
        element: (
          <PermissionRoute resource="certificates" level="view">
            {withSuspense(Certificates)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/certificates/new',
        element: (
          <PermissionRoute resource="certificates" level="manage">
            {withSuspense(Certificates)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/certificates/new/:provider',
        element: (
          <PermissionRoute resource="certificates" level="manage">
            {withSuspense(Certificates)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/certificates/:id/edit',
        element: (
          <PermissionRoute resource="certificates" level="manage">
            {withSuspense(Certificates)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/certificates/:id/view',
        element: (
          <PermissionRoute resource="certificates" level="view">
            {withSuspense(Certificates)}
          </PermissionRoute>
        ),
      },
      {
        path: 'security/certificates/:id/view/:tab',
        element: (
          <PermissionRoute resource="certificates" level="view">
            {withSuspense(Certificates)}
          </PermissionRoute>
        ),
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
        path: 'users',
        element: (
          <ProtectedRoute requiredRole="admin">
            {withSuspense(Users)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/new',
        element: (
          <ProtectedRoute requiredRole="admin">
            {withSuspense(Users)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/:id',
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
        path: 'admin/settings/:tab',
        element: (
          <ProtectedRoute requiredRole="admin">
            {withSuspense(Settings)}
          </ProtectedRoute>
        ),
      },
      /* {
        path: 'tools/import-export',
        element: (
          <ProtectedRoute requiredRole="admin">
            {withSuspense(ImportExport)}
          </ProtectedRoute>
        ),
      }, */
      {
        path: '*',
        element: withSuspense(NotFound),
      },
    ],
  },
]