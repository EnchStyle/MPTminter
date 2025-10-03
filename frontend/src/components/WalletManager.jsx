import React, { useState, useCallback } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Box,
    Typography,
    Chip,
    IconButton,
    InputAdornment,
    CircularProgress,
    Tooltip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as xrpl from 'xrpl';
import { xrplService } from '../services/xrplService';
import { sessionService } from '../services/sessionService';
import { validationService } from '../services/validationService';

const WalletManager = ({ onWalletChange }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [secretKey, setSecretKey] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [accountInfo, setAccountInfo] = useState(null);
    const [connectionAttempt, setConnectionAttempt] = useState(0);
    
    // Determine which network we're connected to
    const networkUrl = xrplService.mainnetUrl;
    const networkName = networkUrl.includes('devnet') ? 'Devnet' : 
                       networkUrl.includes('testnet') ? 'Testnet' : 'Mainnet';

    // Check for saved wallet on mount
    React.useEffect(() => {
        const savedData = sessionService.getWalletData();
        if (savedData && savedData.seed) {
            connectWithSeed(savedData.seed, true);
        }
    }, []);

    const connectWithSeed = async (seed, isAutoConnect = false) => {
        setLoading(true);
        setError(null);
        
        try {
            // First validate the seed
            const validationError = validationService.validateSecretKey(seed);
            if (validationError) throw new Error(validationError);

            // Create wallet from seed FIRST (this doesn't require network)
            const walletFromSeed = xrpl.Wallet.fromSeed(seed);
            
            // Ensure XRPL connection is established
            let retries = 3;
            let client = null;
            
            while (retries > 0 && !client) {
                try {
                    setConnectionAttempt(4 - retries); // Show attempt number
                    client = await xrplService.getClient();
                    break;
                } catch (connError) {
                    retries--;
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
            
            if (!client) {
                throw new Error('Failed to connect to XRPL after multiple attempts. Please try again.');
            }
            
            // Get account info
            let info;
            try {
                info = await xrplService.getAccountInfo(walletFromSeed.classicAddress);
            } catch (accError) {
                if (accError.message?.includes('Account not found')) {
                    throw new Error('Account not found. The account needs to be activated with at least 10 XRP.');
                }
                throw accError;
            }
            
            // Save wallet data
            setWallet(walletFromSeed);
            setAccountInfo(info);
            sessionService.saveWalletData({ seed });
            setConnectionAttempt(0); // Reset on success
            
            // Notify parent
            if (onWalletChange) {
                onWalletChange(walletFromSeed, info);
            }
            
            // Close dialog on manual connect
            if (!isAutoConnect) {
                setDialogOpen(false);
                setSecretKey('');
                setShowSecret(false); // Hide secret after successful connect
            }
        } catch (err) {
            
            // More specific error messages
            if (err.message?.includes('Account not found')) {
                setError('Account not found. The account needs to be activated with at least 10 XRP.');
            } else if (err.message?.includes('Invalid')) {
                setError('Invalid seed format. Please check your secret key.');
            } else if (err.message?.includes('connect')) {
                setError('Failed to connect to XRPL. Please try again.');
            } else {
                setError(err.message || 'Failed to connect wallet');
            }
            
            // Don't show error dialog for auto-connect failures
            if (isAutoConnect) {
                sessionService.clearSession();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        if (secretKey.trim()) {
            connectWithSeed(secretKey.trim());
        }
    };

    const handleDisconnect = useCallback(async () => {
        setLoading(true);
        try {
            await xrplService.disconnect();
            sessionService.clearSession();
            setWallet(null);
            setAccountInfo(null);
            setSecretKey('');
            
            if (onWalletChange) {
                onWalletChange(null, null);
            }
        } catch (err) {
            // Silent fail on disconnect error
        } finally {
            setLoading(false);
        }
    }, [onWalletChange]);

    const copyAddress = () => {
        if (wallet) {
            navigator.clipboard.writeText(wallet.classicAddress);
        }
    };

    const formatBalance = () => {
        if (!accountInfo) return '0';
        return (parseInt(accountInfo.Balance) / 1000000).toFixed(2);
    };

    const getBalanceColor = () => {
        if (!accountInfo) return 'default';
        const balance = parseInt(accountInfo.Balance) / 1000000;
        if (balance < 20) return 'error';
        if (balance < 50) return 'warning';
        return 'success';
    };

    return (
        <>
            {/* Wallet Display/Connect Button */}
            {wallet ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        label={networkName}
                        color={networkName === 'Devnet' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                    />
                    <Chip
                        icon={<AccountBalanceWalletIcon />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">
                                    {wallet.classicAddress.substring(0, 6)}...{wallet.classicAddress.slice(-4)}
                                </Typography>
                                <IconButton size="small" onClick={copyAddress}>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        }
                        color="primary"
                        variant="outlined"
                    />
                    <Chip 
                        label={`${formatBalance()} XRP`}
                        color={getBalanceColor()}
                        size="small"
                    />
                    <Tooltip title="Disconnect wallet">
                        <IconButton 
                            onClick={handleDisconnect} 
                            color="error" 
                            size="small"
                            disabled={loading}
                        >
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            ) : (
                <Button
                    variant="contained"
                    startIcon={<AccountBalanceWalletIcon />}
                    onClick={() => {
                        setError(null);
                        setConnectionAttempt(0);
                        setDialogOpen(true);
                    }}
                    disabled={loading}
                >
                    Connect Wallet
                </Button>
            )}

            {/* Connect Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={() => !loading && setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Connect Wallet</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <strong>⚠️ SECURITY WARNING:</strong> Your secret key will be stored in browser storage for convenience. 
                        Only use test wallets or wallets with minimal funds. For production use, consider using a hardware wallet 
                        or secure key management solution. Never enter your main wallet's secret key in a web application.
                    </Alert>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Secret Key"
                        type={showSecret ? "text" : "password"}
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="s..."
                        error={!!error}
                        disabled={loading}
                        onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowSecret(!showSecret)}
                                        edge="end"
                                        disabled={loading}
                                    >
                                        {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        helperText="Your secret key starts with 's' and is used to sign transactions"
                    />

                    <Alert severity="error" sx={{ mt: 2 }}>
                        <strong>🚨 IMPORTANT:</strong> This app stores your secret key in browser localStorage without encryption. 
                        This is NOT secure for production use. Anyone with access to your browser can steal your keys. 
                        Only use test wallets or create a new wallet specifically for testing this application.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConnect}
                        variant="contained"
                        disabled={!secretKey.trim() || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    >
                        {loading ? (connectionAttempt > 0 ? `Connecting... (Attempt ${connectionAttempt}/3)` : 'Connecting...') : 'Connect'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default WalletManager;