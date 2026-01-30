'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0F766E', // Verde-azulado (Teal) profissional
      light: '#CCFBF1',
      dark: '#0f5132',
    },
    secondary: {
      main: '#64748B', // Slate Grey
    },
    background: {
      default: '#f8fafc', // Cinza suave
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#475569',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'sans-serif', // Simples e seguro
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E2E8F0',
        },
        elevation0: { boxShadow: 'none' }
      },
    },
  },
});