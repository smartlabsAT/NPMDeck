import { Box, Typography, Link, Container } from '@mui/material'
import { GitHub as GitHubIcon } from '@mui/icons-material'

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        width: '100%' }}
    >
      <Container maxWidth={false}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 1, sm: 2 },
            textAlign: 'center' }}
        >
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            🚀 Material Dashboard for{' '}
            <Link
              href="https://nginxproxymanager.com"
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              underline="hover"
            >
              Nginx Proxy Manager
            </Link>{' '}
            🔧
          </Typography>
          
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              •
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Made with ❤️ using Material-UI
          </Typography>
          
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              •
            </Typography>
          </Box>
          
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5 }}
          >
            <Link
              href="https://github.com/NginxProxyManager/nginx-proxy-manager"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': {
                  color: 'primary.main' } }}
            >
              <GitHubIcon fontSize="small" />
              <Typography variant="body2">GitHub</Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer