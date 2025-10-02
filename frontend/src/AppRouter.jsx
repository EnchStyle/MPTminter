import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './utils/theme';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import ManageTokens from './pages/ManageTokens';
import TokenOperations from './pages/TokenOperations';
import DexOrders from './pages/DexOrders';

const AppRouter = () => {
    // Get base URL from environment or use root
    const basename = import.meta.env.BASE_URL || '/';
    
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router basename={basename}>
                <Navigation>
                    <ErrorBoundary>
                        <Routes>
                            <Route path="/" element={<App />} />
                            <Route path="/manage" element={<ManageTokens />} />
                            <Route path="/operations" element={<TokenOperations />} />
                            <Route path="/dex" element={<DexOrders />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </ErrorBoundary>
                </Navigation>
            </Router>
        </ThemeProvider>
    );
};

export default AppRouter;