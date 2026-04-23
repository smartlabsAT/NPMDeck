import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen } from '../../test/utils'
import ErrorBoundary from '../ErrorBoundary'
import PageErrorBoundary from '../PageErrorBoundary'

function ThrowingComponent(): never {
  throw new Error('Test error message')
}

function ChunkLoadErrorComponent(): never {
  throw new Error('Loading chunk 1 failed')
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Suppress React's console.error for cleaner test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders children when no error occurs', () => {
    renderWithProviders(
      <ErrorBoundary>
        <div>Child Content</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('renders "Something went wrong" heading when child throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders descriptive message when child throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )
    expect(
      screen.getByText(/An unexpected error has occurred/i),
    ).toBeInTheDocument()
  })

  it('renders "Refresh Page" button in fallback UI', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: /Refresh Page/i })).toBeInTheDocument()
  })

  it('renders "Go Back" button in fallback UI', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument()
  })

  it('does not render children after error is caught', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )
    // The throwing component renders nothing visible; the boundary replaces it
    expect(screen.queryByText('Child Content')).not.toBeInTheDocument()
  })

  it('invokes console.error when child throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )
    // React calls console.error for uncaught errors in the tree; spy is called
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('does not render error UI when no error occurs', () => {
    renderWithProviders(
      <ErrorBoundary>
        <div>Happy path</div>
      </ErrorBoundary>,
    )
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})

describe('PageErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders children when no error occurs', () => {
    renderWithProviders(
      <PageErrorBoundary>
        <div>Page Content</div>
      </PageErrorBoundary>,
    )
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('renders "Something went wrong" heading for general errors', () => {
    renderWithProviders(
      <PageErrorBoundary>
        <ThrowingComponent />
      </PageErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders "Try Again" button for general errors', () => {
    renderWithProviders(
      <PageErrorBoundary>
        <ThrowingComponent />
      </PageErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
  })

  it('renders "Loading Failed" heading for chunk load errors', () => {
    renderWithProviders(
      <PageErrorBoundary>
        <ChunkLoadErrorComponent />
      </PageErrorBoundary>,
    )
    expect(screen.getByText('Loading Failed')).toBeInTheDocument()
  })

  it('renders "Reload Page" button for chunk load errors', () => {
    renderWithProviders(
      <PageErrorBoundary>
        <ChunkLoadErrorComponent />
      </PageErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument()
  })

  it('invokes console.error when child throws', () => {
    renderWithProviders(
      <PageErrorBoundary>
        <ThrowingComponent />
      </PageErrorBoundary>,
    )
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('calls onReset callback when "Try Again" is clicked', async () => {
    const onReset = vi.fn()
    renderWithProviders(
      <PageErrorBoundary onReset={onReset}>
        <ThrowingComponent />
      </PageErrorBoundary>,
    )
    const { userEvent } = await import('../../test/utils')
    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i })
    await userEvent.click(tryAgainButton)
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('does not render error UI when no error occurs', () => {
    renderWithProviders(
      <PageErrorBoundary>
        <div>Happy path</div>
      </PageErrorBoundary>,
    )
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})
