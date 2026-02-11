import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material'
import { useAuthStore } from '../stores/authStore'
import { getErrorMessage } from '../types/common'
import UserProfileModal from '../components/UserProfileModal'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore()
  const [localError, setLocalError] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    
    try {
      const loginResult = await login({
        identity: formData.email,
        secret: formData.password
      })
      
      // Check if user is default admin
      if (loginResult?.user?.email === 'admin@example.com') {
        setShowProfileModal(true)
      }
    } catch (error: unknown) {
      // Error is handled in the store, but also set local error as fallback
      console.error('Login error:', error)
      const errorMessage = getErrorMessage(error)
      setLocalError(errorMessage)
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <title>Login - NPMDeck</title>
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Nginx Proxy Manager
          </Typography>
          <Typography component="h2" variant="h6" align="center" color="textSecondary" gutterBottom>
            Sign in to your account
          </Typography>
          
          {(error || localError) && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => {
              clearError()
              setLocalError(null)
            }}>
              {error || localError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || !formData.email || !formData.password}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {user && showProfileModal && (
        <UserProfileModal
          open={showProfileModal}
          onClose={() => {
            setShowProfileModal(false)
            const from = location.state?.from?.pathname || '/'
            navigate(from, { replace: true })
          }}
          user={user}
        />
      )}
    </Container>
  )
}

export default Login