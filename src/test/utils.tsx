/* eslint-disable react-refresh/only-export-components */
import { render, renderHook, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../contexts/ToastContext'
import { AuthStoreProvider } from '../contexts/AuthContext'

interface AllProvidersProps {
  children: ReactNode
  initialRoute?: string
}

/**
 * Fresh QueryClient per render to avoid cross-test cache leakage.
 * retry: false keeps tests deterministic.
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

const AllProviders = ({ children, initialRoute = '/' }: AllProvidersProps) => {
  const queryClient = createTestQueryClient()
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={queryClient}>
        <AuthStoreProvider>
          <ThemeProvider theme={createTheme()}>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </AuthStoreProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & { initialRoute?: string } = {}
) {
  const { initialRoute, ...rest } = options
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialRoute={initialRoute}>{children}</AllProviders>
    ),
    ...rest,
  })
}

export function renderHookWithProviders<Result, Props = unknown>(
  callback: (props: Props) => Result,
  options: { initialRoute?: string; initialProps?: Props } = {}
) {
  const { initialRoute, initialProps } = options
  return renderHook(callback, {
    wrapper: ({ children }) => (
      <AllProviders initialRoute={initialRoute}>{children}</AllProviders>
    ),
    initialProps,
  })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
