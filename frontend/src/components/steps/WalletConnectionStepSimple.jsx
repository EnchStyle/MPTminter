import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Alert,
    Button,
    Chip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import * as xrpl from 'xrpl';
import { sessionService } from '../../services/sessionService';

const WalletConnectionStepSimple = ({ wallet, accountInfo, onContinue }) => {
    // Check if wallet is already connected from navigation
    const savedWallet = React.useMemo(() => {
        const savedData = sessionService.getWalletData();
        if (savedData && savedData.seed) {
            try {
                return xrpl.Wallet.fromSeed(savedData.seed);
            } catch {
                return null;
            }
        }
        return null;
    }, []);

    const isConnected = wallet || savedWallet;
    const displayWallet = wallet || savedWallet;

    const formatBalance = () => {
        if (!accountInfo) return '0';
        return (parseInt(accountInfo.Balance) / 1000000).toFixed(2);
    };

    const getBalanceStatus = () => {
        if (!accountInfo) return { color: 'default', message: '' };
        const balance = parseInt(accountInfo.Balance) / 1000000;
        if (balance < 20) {
            return { 
                color: 'error', 
                message: 'Low balance! Ensure you have enough XRP for reserves and fees.' 
            };
        }
        if (balance < 50) {
            return { 
                color: 'warning', 
                message: 'Balance is sufficient but running low.' 
            };
        }
        return { color: 'success', message: 'Balance is healthy.' };
    };

    const balanceStatus = getBalanceStatus();

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Wallet Connection
                </Typography>

                {isConnected ? (
                    <Box>
                        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
                            Wallet is connected and ready!
                        </Alert>

                        <Box sx={{ 
                            p: 3, 
                            border: '1px solid', 
                            borderColor: 'divider',
                            borderRadius: 2,
                            backgroundColor: 'background.paper'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Connected Wallet
                                    </Typography>
                                    <Typography variant="h6">
                                        {displayWallet.classicAddress.substring(0, 8)}...{displayWallet.classicAddress.slice(-6)}
                                    </Typography>
                                </Box>
                            </Box>

                            {accountInfo && (
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Balance:
                                        </Typography>
                                        <Chip 
                                            label={`${formatBalance()} XRP`}
                                            color={balanceStatus.color}
                                            size="small"
                                        />
                                    </Box>
                                    {balanceStatus.message && (
                                        <Alert severity={balanceStatus.color} sx={{ mt: 1 }}>
                                            {balanceStatus.message}
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={onContinue}
                                endIcon={<ArrowForwardIcon />}
                            >
                                Continue to Token Creation
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Please connect your wallet using the wallet manager in the navigation bar.
                        </Alert>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Click the "Connect Wallet" button in the top navigation to get started.
                        </Typography>

                        <Box sx={{ 
                            p: 3, 
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 2,
                            textAlign: 'center',
                            backgroundColor: 'action.hover'
                        }}>
                            <AccountBalanceWalletIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body1" color="text.secondary">
                                No wallet connected
                            </Typography>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default WalletConnectionStepSimple;