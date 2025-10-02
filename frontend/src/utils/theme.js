import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'light',
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
        },
        divider: 'rgba(0, 0, 0, 0.12)',
        grey: {
            50: '#fafafa',
            100: '#f5f5f5'
        }
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 600, fontSize: '2rem' },
        h5: { fontWeight: 600, fontSize: '1.5rem' },
        h6: { fontWeight: 600, fontSize: '1.25rem' }
    },
    shape: { 
        borderRadius: 12 
    },
    spacing: 8,
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: '#6b6b6b #2b2b2b',
                    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        borderRadius: 8,
                        backgroundColor: '#6b6b6b',
                        minHeight: 24,
                    },
                    '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
                        borderRadius: 8,
                        backgroundColor: '#2b2b2b',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '10px 20px'
                }
            }
        },
        MuiTextField: {
            defaultProps: {
                fullWidth: true,
                margin: 'none',
            },
            styleOverrides: {
                root: { 
                    marginBottom: 0,
                    '& .MuiInputBase-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                    '& .MuiInputBase-root:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                }
            }
        },
        MuiCard: {
            defaultProps: {
                elevation: 0,
                variant: 'elevation',
            },
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    overflow: 'visible',
                }
            }
        },
        MuiGrid: {
            styleOverrides: {
                container: {
                    marginTop: 0,
                    marginBottom: 0,
                },
            },
        },
        MuiStepper: {
            styleOverrides: {
                root: { 
                    backgroundColor: 'transparent',
                    padding: 0,
                }
            }
        },
        MuiStepLabel: {
            styleOverrides: {
                label: {
                    '&.Mui-active': {
                        color: '#667eea',
                    },
                    '&.Mui-completed': {
                        color: '#10b981',
                    },
                },
            },
        },
        MuiContainer: {
            defaultProps: {
                maxWidth: 'lg',
            },
        },
    }
});