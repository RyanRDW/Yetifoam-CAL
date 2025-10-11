/**
 * Material Design 3 theme for Yetifam Calculator
 * Desktop-only application optimized for 1280px+ screens
 */

import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

export const theme = createTheme({
  shape: {
    borderRadius: tokens.shape.borderRadius,
  },
  spacing: tokens.spacing,
  typography: {
    fontFamily: 'Inter, Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
    h1: {
      fontSize: 36,
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 22,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: 15,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 14,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
      light: '#8878C8',
      dark: '#523A7C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
      light: '#7E758D',
      dark: '#4A4458',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    error: {
      main: '#B3261E',
      light: '#C94B44',
      dark: '#8C1D16',
    },
    success: {
      main: '#146C43',
      light: '#43895F',
      dark: '#0F5432',
    },
    warning: {
      main: '#B68900',
      light: '#C5A133',
      dark: '#8A6A00',
    },
    info: {
      main: '#386BD6',
      light: '#5F88DE',
      dark: '#2A51A3',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.shape.borderRadius,
          paddingLeft: tokens.spacing(3),
          paddingRight: tokens.spacing(3),
          paddingTop: tokens.spacing(1.5),
          paddingBottom: tokens.spacing(1.5),
          minHeight: 44,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.shape.borderRadius,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.shape.borderRadius,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.shape.borderRadius,
        },
      },
    },
  },
});

export default theme;
