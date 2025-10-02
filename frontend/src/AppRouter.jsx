import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './utils/theme';
import Navigation from './components/Navigation';
import App from './App';
import ManageTokens from './pages/ManageTokens';
import TokenOperations from './pages/TokenOperations';
import DexOrders from './pages/DexOrders';

const AppRouter = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Navigation>
                    <Routes>
                        <Route path="/" element={<App />} />
                        <Route path="/manage" element={<ManageTokens />} />
                        <Route path="/operations" element={<TokenOperations />} />
                        <Route path="/dex" element={<DexOrders />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Navigation>
            </Router>
        </ThemeProvider>
    );
};

export default AppRouter;