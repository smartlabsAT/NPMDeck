import { ThemeProvider, CssBaseline, Container, Typography, Box, Alert } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { theme } from './theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
              <Typography variant="h2" component="h1" gutterBottom>
                Nginx Proxy Manager - New Frontend
              </Typography>
              <Alert severity="info">
                This is the new frontend for NPM. Development in progress...
              </Alert>
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1">
                  Access the old frontend at: <a href="http://localhost:3081">http://localhost:3081</a>
                </Typography>
              </Box>
            </Box>
          </Container>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App