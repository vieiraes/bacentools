import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2', // Azul
    },
    secondary: {
      main: '#388E3C', // Verde
    },
    warning: {
      main: '#F57C00', // Laranja
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: {
            xs: 8,
            sm: 16,
          },
          paddingRight: {
            xs: 8,
            sm: 16,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          flexGrow: 1,
        },
      },
    },
  },
});

export default theme;