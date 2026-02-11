import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Alert,
  Paper
} from '@mui/material'
import { Lock as LockIcon } from '@mui/icons-material'

const Forbidden = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { 
    from?: Location
    requiredResource?: string
    requiredLevel?: string 
  } | null

  const handleGoBack = () => {
    if (state?.from) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <Container maxWidth="sm">
      <title>Access Denied - NPMDeck</title>
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <LockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          
          <Typography component="h1" variant="h4" gutterBottom>
            Zugriff verweigert
          </Typography>
          
          <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 3 }}>
            403 - Forbidden
          </Typography>

          <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
            Sie haben nicht die erforderlichen Berechtigungen, um auf diese Seite zuzugreifen.
            {state?.requiredResource && state?.requiredLevel && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Erforderlich: {state.requiredLevel} Berechtigung für {state.requiredResource}
                </Typography>
              </Box>
            )}
          </Alert>

          <Typography variant="body1" color="text.secondary" align="center" paragraph>
            Wenn Sie glauben, dass dies ein Fehler ist, wenden Sie sich bitte an Ihren Administrator.
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleGoHome}
            >
              Zur Startseite
            </Button>
            <Button
              variant="outlined"
              onClick={handleGoBack}
            >
              Zurück
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Forbidden