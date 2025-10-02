import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TokenIcon from '@mui/icons-material/Token';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WalletManager from './WalletManager';
import { sessionService } from '../services/sessionService';

const Navigation = ({ children }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [accountInfo, setAccountInfo] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const menuItems = [
        {
            text: 'Create Token',
            icon: <AddCircleIcon />,
            path: '/',
            description: 'Create new MPT tokens'
        },
        {
            text: 'Manage Tokens',
            icon: <TokenIcon />,
            path: '/manage',
            description: 'View and manage your tokens'
        },
        {
            text: 'Token Operations',
            icon: <SettingsIcon />,
            path: '/operations',
            description: 'Lock, unlock, or destroy tokens'
        },
        {
            text: 'DEX Orders',
            icon: <SwapHorizIcon />,
            path: '/dex',
            description: 'Create and manage DEX orders',
            disabled: true,
            comingSoon: true
        }
    ];

    const handleNavigate = (path) => {
        console.log('Navigating to:', path);
        navigate(path);
        setDrawerOpen(false);
    };

    const handleWalletChange = (newWallet, newAccountInfo) => {
        setWallet(newWallet);
        setAccountInfo(newAccountInfo);
        
        // Save or clear session
        if (newWallet) {
            sessionService.saveWalletData({ seed: newWallet.seed });
        } else {
            sessionService.clearSession();
        }
    };

    const drawerWidth = 280;

    const drawer = (
        <Box>
            <Toolbar>
                <AccountBalanceWalletIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="h6" noWrap component="div">
                    MPT Minter
                </Typography>
            </Toolbar>
            <Divider />
            
            {/* Wallet Manager in Drawer */}
            <Box sx={{ p: 2, mb: 2 }}>
                <WalletManager onWalletChange={handleWalletChange} />
            </Box>
            
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            onClick={() => !item.disabled && handleNavigate(item.path)}
                            selected={location.pathname === item.path}
                            disabled={item.disabled}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.primary.light + '20',
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.light + '30',
                                    }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: location.pathname === item.path ? 
                                    theme.palette.primary.main : 'inherit' 
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text}
                                secondary={item.comingSoon ? 'Coming soon' : item.description}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {isMobile && (
                <AppBar 
                    position="fixed"
                    sx={{
                        backgroundColor: '#ffffff',
                        color: 'text.primary',
                        boxShadow: 1
                    }}
                >
                    <Toolbar>
                        <IconButton
                            edge="start"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                            MPT Minter
                        </Typography>
                        <WalletManager onWalletChange={handleWalletChange} />
                    </Toolbar>
                </AppBar>
            )}

            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? drawerOpen : true}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundColor: '#fafafa',
                        borderRight: '1px solid #e0e0e0'
                    },
                }}
            >
                {drawer}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: { xs: 8, sm: 0 },
                    backgroundColor: theme.palette.background.default,
                    minHeight: '100vh'
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default Navigation;