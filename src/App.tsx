import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './routes'
import { AuthInitializer } from './components/AuthInitializer'
import { AuthStoreProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter(routes)

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthStoreProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthInitializer>
                <RouterProvider router={router} />
              </AuthInitializer>
            </ToastProvider>
          </ThemeProvider>
        </AuthStoreProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App