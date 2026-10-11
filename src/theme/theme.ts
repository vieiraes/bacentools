'use client';
import { createTheme } from '@mui/material/styles';

// Azul institucional + verde-água do Pix. Contraste AA em todos os pares de texto.
const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: '#0b4f9c' },
    secondary: { main: '#00796b' },
    // o laranja padrão do MUI (#ed6c02) com texto branco não passa no contraste AA (3,1:1)
    warning: { main: '#b45309' },
    background: { default: '#f5f7fb' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'var(--font-inter), system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 800 },
    h2: { fontSize: '1.35rem', fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiPaper: { defaultProps: { variant: 'outlined' } },
    // botão não selecionado do ToggleButton vem com cinza claro demais (contraste < 4,5:1)
    MuiToggleButton: { styleOverrides: { root: { color: 'rgba(0, 0, 0, 0.72)', textTransform: 'none', fontWeight: 600 } } },
  },
});

export default theme;
