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
    Tooltip,
    Avatar
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import TokenIcon from '@mui/icons-material/Token';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { xrplService } from '../services/xrplService';
import { sessionService } from '../services/sessionService';
import { metadataService } from '../services/metadataService';
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
            
            // Parse metadata for each issuance
            const issuancesWithMetadata = issuances.map(issuance => {
                const metadata = issuance.MPTokenMetadata ? 
                    metadataService.parseMetadata(issuance.MPTokenMetadata) : null;
                return { ...issuance, metadata };
            });
            
            setIssuances(issuancesWithMetadata);
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

    const copyToClipboard = (text, label = 'ID') => {
        if (text) {
            navigator.clipboard.writeText(text);
            showSnackbar(`${label} copied to clipboard`, 'success');
        } else {
            showSnackbar('Nothing to copy', 'warning');
        }
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
            let errorMessage = error.message || 'Unknown error';
            
            // Handle specific error cases
            if (errorMessage.includes('Invalid field TransactionType')) {
                errorMessage = 'MPTokenIssuanceSet is not yet implemented in XLS-0033. The lock/unlock feature is planned but not currently available on any XRPL network.';
            } else if (errorMessage.includes('NotEnabled')) {
                errorMessage = 'MPT feature is not enabled on this network. Please use an MPT-enabled testnet or wait for mainnet activation.';
            }
            
            showSnackbar(`Failed to ${lock ? 'lock' : 'unlock'} tokens: ${errorMessage}`, 'error');
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
            let errorMessage = error.message || 'Unknown error';
            
            // Handle specific error cases
            if (errorMessage.includes('Invalid field TransactionType')) {
                errorMessage = 'MPTokenIssuanceDestroy is not yet implemented in XLS-0033. This feature is planned but not currently available on any XRPL network.';
            } else if (errorMessage.includes('NotEnabled')) {
                errorMessage = 'MPT feature is not enabled on this network. Please use an MPT-enabled testnet or wait for mainnet activation.';
            }
            
            showSnackbar(`Failed to destroy issuance: ${errorMessage}`, 'error');
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

            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>Note:</strong> According to XLS-0033 specification, MPTokenIssuanceSet (lock/unlock) and 
                    MPTokenIssuanceDestroy are not yet implemented on XRPL. These features are planned for future releases.
                </Typography>
            </Alert>

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
                                const isLocked = issuance.CurrentFlags && (issuance.CurrentFlags & 0x0001);
                                const canLock = flags.includes('CanLock');
                                const metadata = issuance.metadata;

                                return (
                                    <ListItem key={issuance.MPTokenIssuanceID} divider sx={{ py: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', pr: 2 }}>
                                            <Avatar 
                                                sx={{ 
                                                    bgcolor: metadata?.iconUrl ? 'transparent' : 'primary.main',
                                                    mr: 2,
                                                    width: 56,
                                                    height: 56
                                                }}
                                                src={metadata?.iconUrl}
                                            >
                                                {!metadata?.iconUrl && (
                                                    metadata?.currencyCode?.substring(0, 2) || <TokenIcon />
                                                )}
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="h6">
                                                        {metadata?.name || 'Unnamed Token'}
                                                    </Typography>
                                                    {metadata?.currencyCode && (
                                                        <Chip 
                                                            label={metadata.currencyCode}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    {isLocked && (
                                                        <Chip 
                                                            label="LOCKED" 
                                                            color="error" 
                                                            size="small"
                                                            icon={<LockIcon />}
                                                        />
                                                    )}
                                                </Box>
                                                
                                                {metadata?.description && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        {metadata.description}
                                                    </Typography>
                                                )}

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID: {issuance.MPTokenIssuanceID ? 
                                                            `${issuance.MPTokenIssuanceID.substring(0, 16)}...` : 
                                                            'Unknown ID'}
                                                    </Typography>
                                                    {issuance.MPTokenIssuanceID && (
                                                        <Tooltip title="Copy full ID">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => copyToClipboard(issuance.MPTokenIssuanceID)}
                                                            >
                                                                <ContentCopyIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>

                                                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Scale (Decimals)
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {issuance.AssetScale || 0}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Max Supply
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {issuance.MaximumAmount || 'Unlimited'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Transfer Fee
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {issuance.TransferFee ? `${(issuance.TransferFee / 1000).toFixed(3)}%` : '0%'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Outstanding Supply
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {issuance.OutstandingAmount || '0'}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>

                                                <Box sx={{ mt: 1 }}>
                                                    {flags.map(flag => (
                                                        <Chip 
                                                            key={flag}
                                                            label={flag} 
                                                            size="small" 
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                            color={
                                                                flag === 'RequireAuth' ? 'warning' :
                                                                flag === 'CanTrade' || flag === 'CanTransfer' ? 'success' :
                                                                'default'
                                                            }
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        </Box>
                                        
                                        <ListItemSecondaryAction>
                                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                                                {canLock && (
                                                    <Tooltip title={isLocked ? "Unlock all tokens" : "Lock all tokens"}>
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedIssuance(issuance);
                                                                setOperation(isLocked ? 'unlock' : 'lock');
                                                            }}
                                                            disabled={loading}
                                                            color={isLocked ? "error" : "primary"}
                                                            startIcon={isLocked ? <LockIcon /> : <LockOpenIcon />}
                                                            size="small"
                                                            variant="outlined"
                                                        >
                                                            {isLocked ? "Unlock" : "Lock"}
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Destroy token issuance">
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedIssuance(issuance);
                                                            setConfirmDialog({ open: true, action: 'destroy' });
                                                        }}
                                                        disabled={loading}
                                                        color="error"
                                                        startIcon={<DeleteForeverIcon />}
                                                        size="small"
                                                        variant="text"
                                                    >
                                                        Destroy
                                                    </Button>
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
                    {selectedIssuance?.metadata && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1">
                                {selectedIssuance.metadata.name} ({selectedIssuance.metadata.currencyCode})
                            </Typography>
                        </Box>
                    )}
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
                    {selectedIssuance?.metadata && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1">
                                {selectedIssuance.metadata.name} ({selectedIssuance.metadata.currencyCode})
                            </Typography>
                            {selectedIssuance.metadata.description && (
                                <Typography variant="body2" color="text.secondary">
                                    {selectedIssuance.metadata.description}
                                </Typography>
                            )}
                        </Box>
                    )}
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