import { createTheme, ThemeOptions } from '@mui/material/styles'

const commonTheme: ThemeOptions = {
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
        elevation: 0,
      },
    },
  },
}

export const lightTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: 'light',
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
})

export const darkTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dd4c5',
      dark: '#2bcbba',
      light: '#6dddd1',
    },
    secondary: {
      main: '#6b9adb',
    },
    success: {
      main: '#7fd426',
    },
    warning: {
      main: '#f4d247',
    },
    error: {
      main: '#e84949',
    },
    info: {
      main: '#6b9adb',
    },
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
    text: {
      primary: '#e6edf3',
      secondary: '#8b949e',
    },
  },
  components: {
    ...commonTheme.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(139, 148, 158, 0.2)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(139, 148, 158, 0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})