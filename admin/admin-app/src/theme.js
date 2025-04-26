import { createTheme } from '@mui/material/styles';

// You can choose different fonts here, some popular options:
// - 'Inter' - Modern, clean font
// - 'Poppins' - Geometric, friendly font
// - 'Roboto Flex' - Variable version of Roboto
// - 'Source Sans 3' - Clean, readable font
// - 'Work Sans' - Modern geometric sans
// - 'Outfit' - Contemporary geometric sans

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#873995',
      light: '#9c5ba8',
      dark: '#6e2e77',
      contrastText: '#fff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});
