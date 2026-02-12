import { Typography, Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <>
      <title>Page Not Found - NPMDeck</title>
      <Box
        sx={{
          textAlign: "center",
          mt: 8
        }}>
        <Typography variant="h1" color="error">404</Typography>
      <Typography variant="h5" sx={{
        mt: 2
      }}>Page Not Found</Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/')}
        sx={{ mt: 3 }}
      >
        Back to Dashboard
      </Button>
      </Box>
    </>
  );
}

export default NotFound