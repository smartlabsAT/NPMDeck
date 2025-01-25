import { Typography, Paper, Box, Grid } from '@mui/material'
import { useAuthStore } from '../stores/authStore'

const Dashboard = () => {
  const { user } = useAuthStore()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Welcome back, {user?.name || user?.email}!
            </Typography>
            <Typography color="textSecondary">
              You are logged in as {user?.roles.includes('admin') ? 'Administrator' : 'User'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Stats</Typography>
            <Typography>Proxy Hosts: 0</Typography>
            <Typography>SSL Certificates: 0</Typography>
            <Typography>Access Lists: 0</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>System Status</Typography>
            <Typography color="success.main">All systems operational</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard