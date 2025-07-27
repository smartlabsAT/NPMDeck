import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './routes'
import { AuthInitializer } from './components/AuthInitializer'
import { ThemeProvider } from './contexts/ThemeContext'
import { GlobalSearchProvider } from './contexts/GlobalSearchContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthInitializer>
          <RouterProvider router={router} />
        </AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App