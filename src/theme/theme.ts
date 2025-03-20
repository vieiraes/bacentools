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
        // Corrigindo o formato para usar a notação correta do MUI
        root: ({ theme }) => ({
          [theme.breakpoints.down('sm')]: {
            paddingLeft: 8,
            paddingRight: 8,
          },
          [theme.breakpoints.up('sm')]: {
            paddingLeft: 16,
            paddingRight: 16,
          },
        }),
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