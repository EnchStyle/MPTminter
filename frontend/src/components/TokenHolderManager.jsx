import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Chip,
    Grid,
    Tooltip,
    Avatar,
    Divider,
    InputAdornment
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { xrplService } from '../services/xrplService';
import { formatErrorWithDetails } from '../utils/errorHandler';

const TokenHolderManager = ({ wallet, issuance, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [holders, setHolders] = useState([]);
    const [authorizeDialog, setAuthorizeDialog] = useState({ open: false, address: '' });
    const [clawbackDialog, setClawbackDialog] = useState({ open: false, holder: null, amount: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [searchAddress, setSearchAddress] = useState('');

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showSnackbar('Address copied to clipboard', 'success');
    };

    // Define flags
    const canClawback = issuance?.Flags && (issuance.Flags & 0x0020); // CanClawback flag
    const requiresAuth = issuance?.Flags && (issuance.Flags & 0x0002); // RequireAuth flag
    const isLocked = issuance?.CurrentFlags && (issuance.CurrentFlags & 0x0001); // Token is currently locked

    // Debug token details
    useEffect(() => {
        if (issuance) {
            console.log('Token details for clawback:', {
                MPTokenIssuanceID: issuance.MPTokenIssuanceID,
                Flags: issuance.Flags,
                CanClawback: canClawback,
                BinaryFlags: issuance.Flags?.toString(2).padStart(8, '0'),
                FlagBreakdown: {
                    CanLock: !!(issuance.Flags & 0x0001),
                    RequireAuth: !!(issuance.Flags & 0x0002),
                    CanEscrow: !!(issuance.Flags & 0x0004),
                    CanTrade: !!(issuance.Flags & 0x0008),
                    CanTransfer: !!(issuance.Flags & 0x0010),
                    CanClawback: !!(issuance.Flags & 0x0020)
                },
                Issuer: issuance.Issuer || wallet?.classicAddress,
                CurrentWallet: wallet?.classicAddress,
                FullIssuance: issuance
            });
        }
    }, [issuance, canClawback, wallet]);

    // Load token holders
    const loadHolders = useCallback(async () => {
        if (!issuance?.MPTokenIssuanceID) return;
        
        setLoading(true);
        try {
            // Since XRPL doesn't provide direct holder enumeration yet,
            // we'll check if a specific address holds the token when searched
            if (searchAddress) {
                const hasToken = await xrplService.checkMPTAuthorization(
                    searchAddress,
                    issuance.MPTokenIssuanceID
                );
                
                if (hasToken) {
                    // Get the actual MPToken object for balance
                    const tokens = await xrplService.getAllMPTokens(searchAddress);
                    const token = tokens.find(t => t.MPTokenIssuanceID === issuance.MPTokenIssuanceID);
                    
                    if (token) {
                        setHolders([{
                            Account: searchAddress,
                            MPTokenAmount: token.MPTAmount || '0',
                            Flags: token.Flags || 0
                        }]);
                        showSnackbar('Holder found!', 'success');
                    }
                } else {
                    setHolders([]);
                    showSnackbar('Address does not hold this token', 'info');
                }
            }
        } catch (error) {
            console.error('Error loading holders:', error);
            showSnackbar('Failed to load holder information', 'error');
        } finally {
            setLoading(false);
        }
    }, [issuance, searchAddress]);

    // Authorize a new holder
    const handleAuthorize = async () => {
        const address = authorizeDialog.address.trim();
        if (!address) return;

        setLoading(true);
        try {
            const tx = {
                TransactionType: "MPTokenAuthorize",
                Account: wallet.classicAddress,
                MPTokenIssuanceID: issuance.MPTokenIssuanceID,
                MPTokenHolder: address
            };

            const result = await xrplService.submitTransaction(tx, wallet);
            
            if (result.result?.validated || result.result?.engine_result === 'tesSUCCESS') {
                showSnackbar(`Successfully authorized ${address}`, 'success');
                setAuthorizeDialog({ open: false, address: '' });
                onUpdate?.(); // Refresh parent data
            } else {
                throw new Error('Transaction failed validation');
            }
        } catch (error) {
            const errorMsg = formatErrorWithDetails(error);
            showSnackbar(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Remove authorization
    const handleUnauthorize = async (holderAddress) => {
        setLoading(true);
        try {
            const tx = {
                TransactionType: "MPTokenAuthorize",
                Account: wallet.classicAddress,
                MPTokenIssuanceID: issuance.MPTokenIssuanceID,
                MPTokenHolder: holderAddress,
                Flags: 0x0001 // tfMPTUnauthorize
            };

            const result = await xrplService.submitTransaction(tx, wallet);
            
            if (result.result?.validated || result.result?.engine_result === 'tesSUCCESS') {
                showSnackbar(`Removed authorization for ${holderAddress}`, 'success');
                setSearchAddress(''); // Clear search
                setHolders([]); // Clear holders
                onUpdate?.(); // Refresh parent data
            } else {
                throw new Error('Transaction failed validation');
            }
        } catch (error) {
            const errorMsg = formatErrorWithDetails(error);
            showSnackbar(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Clawback tokens
    const handleClawback = async () => {
        const { holder, amount } = clawbackDialog;
        if (!holder || !amount || parseFloat(amount) <= 0) return;

        setLoading(true);
        try {
            // Debug clawback attempt
            console.log('Attempting clawback:', {
                issuer: wallet.classicAddress,
                holder: holder.Account,
                tokenId: issuance.MPTokenIssuanceID,
                amount: amount,
                canClawback: canClawback,
                flags: issuance.Flags,
                isLocked: isLocked
            });

            // Scale the amount according to the token's scale
            const scaledAmount = (parseFloat(amount) * Math.pow(10, issuance.AssetScale || 0)).toString();

            // Use the dedicated clawback method
            const result = await xrplService.submitClawback(
                wallet,
                holder.Account,
                issuance.MPTokenIssuanceID,
                scaledAmount
            );
            
            if (result.result?.validated || result.result?.engine_result === 'tesSUCCESS') {
                showSnackbar(`Successfully clawed back ${amount} tokens`, 'success');
                setClawbackDialog({ open: false, holder: null, amount: '' });
                loadHolders(); // Refresh holder data
                onUpdate?.(); // Refresh parent data
            } else {
                throw new Error('Transaction failed validation');
            }
        } catch (error) {
            const errorMsg = formatErrorWithDetails(error);
            showSnackbar(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatBalance = (amount) => {
        if (!amount || amount === '0') return '0';
        const scale = issuance.AssetScale || 0;
        const value = parseFloat(amount) / Math.pow(10, scale);
        return value.toLocaleString(undefined, { maximumFractionDigits: scale });
    };

    return (
        <>
            <Card>
                <CardContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Token Holder Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage authorizations and holders for {issuance?.metadata?.name || 'this token'}
                        </Typography>
                    </Box>

                    {/* Token Info */}
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Outstanding Supply</Typography>
                                <Typography variant="body1">
                                    {formatBalance(issuance?.OutstandingAmount || '0')} / {formatBalance(issuance?.MaximumAmount) || 'Unlimited'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {requiresAuth && <Chip label="Requires Authorization" size="small" color="warning" />}
                                    {canClawback && <Chip label="Clawback Enabled" size="small" color="error" />}
                                    {isLocked && <Chip label="Token Locked" size="small" color="error" icon={<AcUnitIcon />} />}
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Search/Check Holder */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Check Token Holder
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Holder Address"
                                value={searchAddress}
                                onChange={(e) => setSearchAddress(e.target.value)}
                                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                                disabled={loading}
                            />
                            <Button
                                variant="outlined"
                                onClick={loadHolders}
                                disabled={loading || !searchAddress}
                                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                            >
                                Check
                            </Button>
                        </Box>
                    </Box>

                    {/* Actions */}
                    {requiresAuth && (
                        <Box sx={{ mb: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<PersonAddIcon />}
                                onClick={() => setAuthorizeDialog({ open: true, address: '' })}
                                disabled={loading || isLocked}
                            >
                                Authorize New Holder
                            </Button>
                            {isLocked && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                    Token is locked. Unlock it first to authorize new holders.
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Holders List */}
                    {holders.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Found Holder
                            </Typography>
                            <List>
                                {holders.map((holder, idx) => (
                                    <ListItem key={idx} divider>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />
                                                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                                        {holder.Account}
                                                    </Typography>
                                                    <IconButton size="small" onClick={() => copyToClipboard(holder.Account)}>
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary">
                                                    Balance: {formatBalance(holder.MPTokenAmount)}
                                                </Typography>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {canClawback && parseFloat(holder.MPTokenAmount) > 0 && (
                                                    <Tooltip title="Clawback tokens">
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => setClawbackDialog({ 
                                                                open: true, 
                                                                holder, 
                                                                amount: '' 
                                                            })}
                                                            disabled={loading || isLocked}
                                                        >
                                                            <CallReceivedIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {requiresAuth && (
                                                    <Tooltip title="Remove authorization">
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => handleUnauthorize(holder.Account)}
                                                            disabled={loading}
                                                        >
                                                            <PersonRemoveIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Authorize Dialog */}
            <Dialog 
                open={authorizeDialog.open} 
                onClose={() => setAuthorizeDialog({ open: false, address: '' })}
                disableEnforceFocus
            >
                <DialogTitle>Authorize New Holder</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        This will allow the specified address to hold this token.
                    </Alert>
                    <TextField
                        fullWidth
                        label="Holder Address"
                        value={authorizeDialog.address}
                        onChange={(e) => setAuthorizeDialog({ ...authorizeDialog, address: e.target.value })}
                        placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAuthorizeDialog({ open: false, address: '' })}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAuthorize}
                        variant="contained"
                        disabled={loading || !authorizeDialog.address}
                    >
                        Authorize
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Clawback Dialog */}
            <Dialog 
                open={clawbackDialog.open} 
                onClose={() => setClawbackDialog({ open: false, holder: null, amount: '' })}
                disableEnforceFocus
            >
                <DialogTitle>Clawback Tokens</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This will forcibly return tokens from the holder to you.
                    </Alert>
                    {!canClawback && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            This token does not have the Clawback flag enabled. Clawback is not possible.
                        </Alert>
                    )}
                    {isLocked && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            This token is currently locked. Unlock it before attempting to clawback.
                        </Alert>
                    )}
                    {clawbackDialog.holder && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                From: {clawbackDialog.holder.Account}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Current Balance: {formatBalance(clawbackDialog.holder.MPTokenAmount)}
                            </Typography>
                        </Box>
                    )}
                    <TextField
                        fullWidth
                        label="Amount to Clawback"
                        type="number"
                        value={clawbackDialog.amount}
                        onChange={(e) => setClawbackDialog({ ...clawbackDialog, amount: e.target.value })}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">{issuance?.metadata?.currencyCode || 'tokens'}</InputAdornment>
                        }}
                        inputProps={{
                            min: 0,
                            max: parseFloat(formatBalance(clawbackDialog.holder?.MPTokenAmount || '0')),
                            step: Math.pow(10, -(issuance?.AssetScale || 0))
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClawbackDialog({ open: false, holder: null, amount: '' })}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleClawback}
                        variant="contained"
                        color="error"
                        disabled={loading || !clawbackDialog.amount || parseFloat(clawbackDialog.amount) <= 0 || !canClawback || isLocked}
                    >
                        Clawback
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TokenHolderManager;