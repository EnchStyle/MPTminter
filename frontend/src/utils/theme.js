import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#667eea',
            light: '#9bb5ff',
            dark: '#2f4cb7',
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#764ba2',
            light: '#a67cd4',
            dark: '#481c73',
            contrastText: '#ffffff'
        },
        success: {
            main: '#10b981',
            light: '#6ee7b7',
            dark: '#047857'
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706'
        },
        error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626'
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff'
        }
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 600, fontSize: '2rem' },
        h5: { fontWeight: 600, fontSize: '1.5rem' },
        h6: { fontWeight: 600, fontSize: '1.25rem' }
    },
    shape: { borderRadius: 12 },
    spacing: 8,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '12px',
                    padding: '12px 24px'
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: { marginBottom: '16px' }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }
            }
        },
        MuiStepper: {
            styleOverrides: {
                root: { backgroundColor: 'transparent' }
            }
        }
    }
});