import { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Button, Container, Paper, Typography, Stack, Alert } from '@mui/material'
import { Refresh as RefreshIcon, ErrorOutline as ErrorIcon } from '@mui/icons-material'
import logger from '../utils/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Something went wrong
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  marginBottom: "16px"
                }}>
                An unexpected error has occurred. Please try refreshing the page.
              </Typography>
              
              {import.meta.env.DEV && this.state.error && (
                <Box sx={{ mt: 3, textAlign: 'left' }}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" component="div">
                      {this.state.error.toString()}
                    </Typography>
                  </Alert>
                  
                  {this.state.errorInfo && (
                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.100' }}>
                      <Typography variant="caption" component="pre" sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
              
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: "center",
                  mt: 3
                }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  Refresh Page
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children
  }
}

export default ErrorBoundary