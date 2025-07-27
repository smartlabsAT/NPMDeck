import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2bcbba',
      dark: '#1fb6a6',
      light: '#4dd4c5',
    },
    secondary: {
      main: '#467fcf',
    },
    success: {
      main: '#5eba00',
    },
    warning: {
      main: '#f1c40f',
    },
    error: {
      main: '#cd201f',
    },
    info: {
      main: '#467fcf',
    },
    background: {
      default: '#ffffff',
      paper: '#f5fafd',
    },
    text: {
      primary: '#303030',
      secondary: '#495c68',
    },
  },
  typography: {
    fontFamily: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 400,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 400,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 400,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
    },
  },
})