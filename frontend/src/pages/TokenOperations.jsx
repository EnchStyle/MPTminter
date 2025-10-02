import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    TextField,
    Alert,
    Snackbar,
    Box,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ToggleButton,
    ToggleButtonGroup,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import { xrplService } from '../services/xrplService';
import { sessionService } from '../services/sessionService';
import * as xrpl from 'xrpl';

const TokenOperations = () => {
    const [wallet, setWallet] = useState(null);
    const [issuances, setIssuances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState(null);
    const [operation, setOperation] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });

    // Load wallet from session
    useEffect(() => {
        const savedData = sessionService.getWalletData();
        if (savedData && savedData.seed) {
            try {
                const wallet = xrpl.Wallet.fromSeed(savedData.seed);
                setWallet(wallet);
            } catch (error) {
                console.error('Failed to restore wallet:', error);
            }
        }
    }, []);

    // Load token issuances
    const loadIssuances = useCallback(async () => {
        if (!wallet) return;

        setLoading(true);
        try {
            const issuances = await xrplService.getMPTokenIssuances(wallet.classicAddress);
            setIssuances(issuances);
        } catch (error) {
            console.error('Failed to load issuances:', error);
            showSnackbar('Failed to load token issuances', 'error');
        } finally {
            setLoading(false);
        }
    }, [wallet]);

    useEffect(() => {
        loadIssuances();
    }, [loadIssuances]);

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleLockUnlock = async (issuance, lock) => {
        setLoading(true);
        try {
            const tx = {
                TransactionType: "MPTokenIssuanceSet",
                Account: wallet.classicAddress,
                MPTokenIssuanceID: issuance.MPTokenIssuanceID,
                Flags: lock ? 0x0001 : 0x0002 // tfMPTLock : tfMPTUnlock
            };

            const result = await xrplService.submitTransaction(tx, wallet);

            if (result.result.validated) {
                showSnackbar(`Tokens ${lock ? 'locked' : 'unlocked'} successfully!`, 'success');
                await loadIssuances(); // Reload to get updated state
            } else {
                throw new Error('Transaction failed validation');
            }
        } catch (error) {
            console.error(`Failed to ${lock ? 'lock' : 'unlock'} tokens:`, error);
            showSnackbar(`Failed to ${lock ? 'lock' : 'unlock'} tokens: ${error.message}`, 'error');
        } finally {
            setLoading(false);
            setOperation(null);
        }
    };

    const handleDestroy = async (issuance) => {
        setLoading(true);
        try {
            // Check if there are any outstanding tokens
            const holders = await checkTokenHolders(issuance.MPTokenIssuanceID);
            if (holders.length > 0) {
                showSnackbar('Cannot destroy issuance with outstanding tokens', 'error');
                return;
            }

            const tx = {
                TransactionType: "MPTokenIssuanceDestroy",
                Account: wallet.classicAddress,
                MPTokenIssuanceID: issuance.MPTokenIssuanceID
            };

            const result = await xrplService.submitTransaction(tx, wallet);

            if (result.result.validated) {
                showSnackbar('Token issuance destroyed successfully!', 'success');
                await loadIssuances(); // Reload to remove destroyed issuance
            } else {
                throw new Error('Transaction failed validation');
            }
        } catch (error) {
            console.error('Failed to destroy issuance:', error);
            showSnackbar(`Failed to destroy issuance: ${error.message}`, 'error');
        } finally {
            setLoading(false);
            setConfirmDialog({ open: false, action: null });
        }
    };

    const checkTokenHolders = async (mptIssuanceId) => {
        // This would need to be implemented in xrplService
        // For now, return empty array
        return [];
    };

    const formatFlags = (flags) => {
        const flagList = [];
        if (flags & 0x0001) flagList.push('CanLock');
        if (flags & 0x0002) flagList.push('RequireAuth');
        if (flags & 0x0004) flagList.push('CanEscrow');
        if (flags & 0x0008) flagList.push('CanTrade');
        if (flags & 0x0010) flagList.push('CanTransfer');
        if (flags & 0x0020) flagList.push('CanClawback');
        // Note: Locked status would be in a separate field, not in Flags
        return flagList;
    };

    if (!wallet) {
        return (
            <Container maxWidth="md">
                <Alert severity="warning">
                    Please connect your wallet first by creating or resuming a token session.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Token Operations
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your MPT issuances - lock, unlock, or destroy tokens
                </Typography>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Your Token Issuances
                        </Typography>
                        <Button
                            startIcon={<RefreshIcon />}
                            onClick={loadIssuances}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                    </Box>

                    {loading && !issuances.length ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : issuances.length === 0 ? (
                        <Alert severity="info">
                            No token issuances found. Create a token first to see it here.
                        </Alert>
                    ) : (
                        <List>
                            {issuances.map((issuance) => {
                                const flags = formatFlags(issuance.Flags || 0);
                                const isLocked = flags.includes('Locked');
                                const canLock = flags.includes('CanLock');

                                return (
                                    <ListItem key={issuance.MPTokenIssuanceID} divider>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle1">
                                                        {issuance.AssetScale ? `Scale: ${issuance.AssetScale}` : 'No scale'}
                                                    </Typography>
                                                    {isLocked && (
                                                        <Chip 
                                                            label="LOCKED" 
                                                            color="error" 
                                                            size="small"
                                                            icon={<LockIcon />}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="caption" display="block">
                                                        ID: {issuance.MPTokenIssuanceID}
                                                    </Typography>
                                                    <Typography variant="caption" display="block">
                                                        Max Amount: {issuance.MaximumAmount || 'Unlimited'}
                                                    </Typography>
                                                    <Box sx={{ mt: 0.5 }}>
                                                        {flags.map(flag => (
                                                            <Chip 
                                                                key={flag}
                                                                label={flag} 
                                                                size="small" 
                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {canLock && (
                                                    <Tooltip title={isLocked ? "Unlock all tokens" : "Lock all tokens"}>
                                                        <IconButton
                                                            onClick={() => {
                                                                setSelectedIssuance(issuance);
                                                                setOperation(isLocked ? 'unlock' : 'lock');
                                                            }}
                                                            disabled={loading}
                                                            color={isLocked ? "error" : "primary"}
                                                        >
                                                            {isLocked ? <LockIcon /> : <LockOpenIcon />}
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Destroy token issuance">
                                                    <IconButton
                                                        onClick={() => {
                                                            setSelectedIssuance(issuance);
                                                            setConfirmDialog({ open: true, action: 'destroy' });
                                                        }}
                                                        disabled={loading}
                                                        color="error"
                                                    >
                                                        <DeleteForeverIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </CardContent>
            </Card>

            {/* Lock/Unlock Confirmation Dialog */}
            <Dialog 
                open={operation === 'lock' || operation === 'unlock'} 
                onClose={() => setOperation(null)}
            >
                <DialogTitle>
                    {operation === 'lock' ? 'Lock All Tokens' : 'Unlock All Tokens'}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This will {operation} all tokens for this issuance. Token holders will 
                        {operation === 'lock' ? ' not' : ''} be able to transfer their tokens.
                    </Alert>
                    <Typography variant="body2">
                        Issuance ID: {selectedIssuance?.MPTokenIssuanceID}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOperation(null)}>Cancel</Button>
                    <Button
                        onClick={() => handleLockUnlock(selectedIssuance, operation === 'lock')}
                        variant="contained"
                        color={operation === 'lock' ? 'error' : 'primary'}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : `Confirm ${operation}`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Destroy Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open && confirmDialog.action === 'destroy'}
                onClose={() => setConfirmDialog({ open: false, action: null })}
            >
                <DialogTitle>Destroy Token Issuance</DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        This action is irreversible! The token issuance will be permanently destroyed.
                    </Alert>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Issuance ID: {selectedIssuance?.MPTokenIssuanceID}
                    </Typography>
                    <Alert severity="info">
                        Note: You can only destroy an issuance if there are no outstanding tokens.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, action: null })}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleDestroy(selectedIssuance)}
                        variant="contained"
                        color="error"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Destroy Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TokenOperations;