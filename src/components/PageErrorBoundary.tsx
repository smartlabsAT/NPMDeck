import { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Alert, Paper } from '@mui/material'
import { Refresh as RefreshIcon, ErrorOutline as ErrorIcon } from '@mui/icons-material'
import logger from '../utils/logger'

interface PageErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void
}

interface PageErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Checks whether an error is caused by a failed dynamic import (chunk load failure).
 * This typically happens when a new deployment invalidates cached chunk hashes
 * and the browser tries to load stale chunk URLs.
 */
function isChunkLoadError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('failed to fetch')
  )
}

/**
 * A lightweight error boundary for page-level use.
 * Unlike the global ErrorBoundary, this renders inline within the page area
 * and does not disrupt navigation or the app shell layout.
 *
 * Handles two categories of errors:
 * - Chunk load errors (stale deploys) — prompts the user to reload the page
 * - General errors — provides a "Try Again" button that resets the boundary
 */
class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  public state: PageErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('PageErrorBoundary caught an error:', { error, errorInfo })
  }

  private handleTryAgain = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { error } = this.state
    const chunkError = error !== null && isChunkLoadError(error)

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          py: 4,
          px: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />

          {chunkError ? (
            <>
              <Typography variant="h6" gutterBottom>
                Loading Failed
              </Typography>
              <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
                A newer version of the application may be available, or a network
                error occurred while loading this page. Please reload to continue.
              </Alert>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Something went wrong
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                An unexpected error occurred while rendering this section.
                You can try again or navigate to a different page.
              </Typography>

              {import.meta.env.DEV && error !== null && (
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0,
                    }}
                  >
                    {error.message}
                    {error.stack ? `\n\n${error.stack}` : ''}
                  </Typography>
                </Alert>
              )}

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleTryAgain}
              >
                Try Again
              </Button>
            </>
          )}
        </Paper>
      </Box>
    )
  }
}

export default PageErrorBoundary
