import { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Alert,
    Snackbar,
    Box,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    TextField,
    List,
    ListItem,
    ListItemSecondaryAction,
    IconButton,
    Tooltip,
    Avatar
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RefreshIcon from '@mui/icons-material/Refresh';
import TokenIcon from '@mui/icons-material/Token';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PeopleIcon from '@mui/icons-material/People';
import { xrplService } from '../services/xrplService';
import { sessionService } from '../services/sessionService';
import { metadataService } from '../services/metadataService';
import { formatErrorWithDetails } from '../utils/errorHandler';
import { extractMPTokenIssuanceID } from '../utils/mptokenUtils';
import { debugMPTokenIssuance } from '../utils/debugMPToken';
import TokenHolderManager from '../components/TokenHolderManager';
import * as xrpl from 'xrpl';

const TokenOperations = () => {
    const [wallet, setWallet] = useState(null);
    const [issuances, setIssuances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState(null);
    const [operation, setOperation] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
    const [transactionStatus, setTransactionStatus] = useState({ processing: false, message: '', txHash: null });
    const [destroyInProgress, setDestroyInProgress] = useState(false);
    const [destroyConfirmText, setDestroyConfirmText] = useState('');
    const [selectedTokenForHolders, setSelectedTokenForHolders] = useState(null);
    const [holdersDialog, setHoldersDialog] = useState(false);

    // Load wallet from session
    useEffect(() => {
        const savedData = sessionService.getWalletData();
        if (savedData && savedData.seed) {
            try {
                const wallet = xrpl.Wallet.fromSeed(savedData.seed);
                setWallet(wallet);
            } catch (error) {
                // Silent fail - user can manually connect if needed
            }
        }
    }, []);

    // Load token issuances
    const loadIssuances = useCallback(async () => {
        if (!wallet) return;

        setLoading(true);
        try {
            const issuances = await xrplService.getMPTokenIssuances(wallet.classicAddress);
            
            // Get stored issuance IDs from session
            const storedIssuances = sessionService.getTokenIssuances(wallet.classicAddress);
            console.log('Stored issuances:', storedIssuances);
            
            // Parse metadata for each issuance
            const issuancesWithMetadata = issuances.map((issuance, idx) => {
                const metadata = issuance.MPTokenMetadata ? 
                    metadataService.parseMetadata(issuance.MPTokenMetadata) : null;
                
                // Debug: Log the issuance object to see what fields are available
                if (idx === 0) {  // Only debug the first one to avoid clutter
                    debugMPTokenIssuance(issuance, 'Token Operations - First Issuance');
                }
                
                // Extract the MPTokenIssuanceID using our utility function
                const id = extractMPTokenIssuanceID(issuance, storedIssuances);
                
                if (!id) {
                    console.error('Could not determine MPTokenIssuanceID for issuance:', issuance);
                    console.error('Available fields:', Object.keys(issuance));
                } else if (id.length !== 48 && id.length !== 64) {
                    console.warn(`Unusual MPTokenIssuanceID length: ${id} (length: ${id.length})`);
                }
                
                return { ...issuance, metadata, MPTokenIssuanceID: id };
            });
            
            // Log summary of all tokens
            console.log('All token issuances summary:');
            issuancesWithMetadata.forEach((issuance, idx) => {
                console.log(`Token ${idx + 1}:`, {
                    name: issuance.metadata?.name || 'Unknown',
                    currencyCode: issuance.metadata?.currencyCode || 'Unknown',
                    MPTokenIssuanceID: issuance.MPTokenIssuanceID,
                    OutstandingAmount: issuance.OutstandingAmount || '0',
                    MaximumAmount: issuance.MaximumAmount || 'Unlimited'
                });
            });
            
            setIssuances(issuancesWithMetadata);
        } catch (error) {
            showSnackbar('Failed to load token issuances', 'error');
        } finally {
            setLoading(false);
        }
    }, [wallet]);

    useEffect(() => {
        loadIssuances();
    }, [loadIssuances]);

    const showSnackbar = (message, severity = 'info', duration = 6000) => {
        setSnackbar({ open: true, message, severity, duration });
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
            const errorMsg = formatErrorWithDetails(error);
            showSnackbar(errorMsg, 'error');
        } finally {
            setLoading(false);
            setOperation(null);
        }
    };

    const handleDestroy = async (issuance) => {
        try {
            setDestroyInProgress(true);
            setTransactionStatus({
                processing: true,
                message: 'Processing transaction...',
                txHash: null
            });
            
            // Close dialog immediately after clicking destroy
            setConfirmDialog({ open: false, action: null });
            
            // Show transaction progress dialog
            setTransactionStatus({
                processing: true,
                message: 'Preparing transaction...',
                txHash: null
            });
            // Validate MPTokenIssuanceID before attempting destroy
            if (!issuance.MPTokenIssuanceID) {
                console.error('Missing MPTokenIssuanceID. Issuance object:', issuance);
                showSnackbar('Cannot destroy: Missing token ID. Please refresh and try again.', 'error');
                setDestroyInProgress(false);
                setTransactionStatus({ processing: false, message: '', txHash: null });
                return;
            }
            
            if (issuance.MPTokenIssuanceID.length !== 48 && issuance.MPTokenIssuanceID.length !== 64) {
                console.error('Invalid MPTokenIssuanceID format:', issuance.MPTokenIssuanceID);
                showSnackbar(`Cannot destroy: Invalid token ID format (${issuance.MPTokenIssuanceID.length} chars)`, 'error');
                setDestroyInProgress(false);
                setTransactionStatus({ processing: false, message: '', txHash: null });
                return;
            }
            
            // Check if there's outstanding supply
            if (issuance.OutstandingAmount && parseInt(issuance.OutstandingAmount) > 0) {
                console.error('Token has outstanding supply:', issuance.OutstandingAmount);
                showSnackbar(`Cannot destroy: Token has ${issuance.OutstandingAmount} outstanding supply. All tokens must be burned first.`, 'error');
                setDestroyInProgress(false);
                setTransactionStatus({ processing: false, message: '', txHash: null });
                return;
            }
            
            // Skip holder check for now - let XRPL validate
            // const holders = await checkTokenHolders(issuance.MPTokenIssuanceID);
            // if (holders.length > 0) {
            //     showSnackbar('Cannot destroy issuance with outstanding tokens', 'error');
            //     return;
            // }

            const tx = {
                TransactionType: "MPTokenIssuanceDestroy",
                Account: wallet.classicAddress,
                MPTokenIssuanceID: issuance.MPTokenIssuanceID
            };
            
            console.log('Submitting MPTokenIssuanceDestroy transaction:', tx);

            const result = await xrplService.submitTransaction(tx, wallet);
            console.log('Destroy transaction result:', result);
            
            // Extract transaction hash immediately
            const initialTxHash = result.result?.tx_json?.hash || result.result?.hash || result.hash;
            if (initialTxHash) {
                setTransactionStatus({
                    processing: true,
                    message: `Transaction submitted: ${initialTxHash.substring(0, 8)}...`,
                    txHash: initialTxHash
                });
            }

            // Check if transaction was successful
            // The result structure can vary depending on whether we got it from submit or waitForTransaction
            const validated = result.result?.validated || result.validated;
            const engineResult = result.result?.engine_result || result.engine_result;
            const txHash = result.result?.hash || result.result?.tx_json?.hash || result.hash || initialTxHash;
            
            console.log('Transaction result details:', {
                validated,
                engineResult,
                txHash,
                fullResult: result
            });
            
            // Update transaction status with hash if available
            if (txHash) {
                setTransactionStatus({
                    processing: true,
                    message: `Transaction submitted: ${txHash.substring(0, 8)}...`,
                    txHash: txHash
                });
            }
            
            if (validated || engineResult === 'tesSUCCESS') {
                // Success! Show success message with explorer link
                const explorerUrl = xrplService.getExplorerUrl(txHash);
                const tokenName = selectedIssuance?.metadata?.name || 'Token';
                const successMsg = (
                    <Box>
                        <Typography variant="body2">
                            ✅ {tokenName} has been permanently destroyed!
                        </Typography>
                        {txHash && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    Transaction: {txHash}
                                </Typography>
                                <br />
                                <Button 
                                    href={explorerUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    size="small"
                                    variant="text"
                                    sx={{ mt: 0.5, p: 0 }}
                                >
                                    View on XRPL Explorer →
                                </Button>
                            </Box>
                        )}
                    </Box>
                );
                setTransactionStatus({ processing: false, message: '', txHash: null });
                showSnackbar(successMsg, 'success', 10000);
                console.log('Destroy successful, transaction hash:', txHash);
                await loadIssuances(); // Reload to remove destroyed issuance
            } else {
                console.error('Transaction not validated:', result);
                throw new Error(`Transaction failed: ${engineResult || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Destroy transaction error:', error);
            console.error('Error details:', {
                message: error.message,
                data: error.data,
                stack: error.stack
            });
            
            const txHash = error.txHash || error.data?.tx_json?.hash || error.result?.tx_json?.hash || transactionStatus.txHash;
            let errorMsg = 'Failed to destroy token issuance';
            
            try {
                errorMsg = formatErrorWithDetails(error, txHash);
            } catch (formatError) {
                console.error('Error formatting error message:', formatError);
                // Fallback to basic error message
                errorMsg = error.message || 'Unknown error occurred';
            }
            
            // Show error with transaction ID if available
            const errorDisplay = (
                <Box>
                    <Typography variant="body2">{errorMsg}</Typography>
                    {txHash && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                Transaction: {txHash}
                            </Typography>
                            <br />
                            <Button
                                href={xrplService.getExplorerUrl(txHash)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                size="small"
                                variant="text"
                                sx={{ mt: 0.5, p: 0 }}
                            >
                                Check on XRPL Explorer →
                            </Button>
                        </Box>
                    )}
                </Box>
            );
            
            setTransactionStatus({ processing: false, message: '', txHash: null });
            showSnackbar(errorDisplay, 'error', 10000);
        } finally {
            setDestroyInProgress(false);
            setConfirmDialog({ open: false, action: null });
            setSelectedIssuance(null);
        }
    };

    /* const checkTokenHolders = async (mptIssuanceId) => {
        try {
            // Get all MPToken objects for this issuance
            const holders = await xrplService.getMPTokenHolders(mptIssuanceId);
            
            // Filter out zero-balance holders (they don't count as outstanding)
            const activeHolders = holders.filter(holder => 
                holder.MPTokenAmount && parseInt(holder.MPTokenAmount) > 0
            );
            
            return activeHolders;
        } catch (error) {
            // Return empty array on error to allow destroy attempt
            // The XRPL will reject if there are actually holders
            return [];
        }
    }; */

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
                                                            disabled={loading || destroyInProgress || transactionStatus.processing}
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
                                            setDestroyConfirmText(''); // Reset confirmation text
                                                        }}
                                                        disabled={loading || destroyInProgress || transactionStatus.processing}
                                                        color="error"
                                                        startIcon={<DeleteForeverIcon />}
                                                        size="small"
                                                        variant="text"
                                                    >
                                                        Destroy
                                                    </Button>
                                                </Tooltip>
                                                {/* Manage Holders button for tokens with RequireAuth or CanClawback */}
                                                {(flags.includes('RequireAuth') || flags.includes('CanClawback')) && (
                                                    <Tooltip title="Manage holders">
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedTokenForHolders(issuance);
                                                                setHoldersDialog(true);
                                                            }}
                                                            disabled={loading || destroyInProgress || transactionStatus.processing}
                                                            startIcon={<PeopleIcon />}
                                                            size="small"
                                                            variant="text"
                                                        >
                                                            Holders
                                                        </Button>
                                                    </Tooltip>
                                                )}
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
                onClose={() => {
                    if (!destroyInProgress && !transactionStatus.processing) {
                        setConfirmDialog({ open: false, action: null });
                        setDestroyConfirmText('');
                    }
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Destroy Token Issuance</DialogTitle>
                <DialogContent>
                    {selectedIssuance && (
                        <>
                            {/* Token Details */}
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    {selectedIssuance.metadata?.iconUrl && (
                                        <Avatar 
                                            src={selectedIssuance.metadata.iconUrl} 
                                            sx={{ mr: 2, width: 48, height: 48 }}
                                        />
                                    )}
                                    <Box>
                                        <Typography variant="h6">
                                            {selectedIssuance.metadata?.name || 'Unnamed Token'}
                                        </Typography>
                                        {selectedIssuance.metadata?.currencyCode && (
                                            <Typography variant="body2" color="text.secondary">
                                                Currency Code: {selectedIssuance.metadata.currencyCode}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                                
                                {selectedIssuance.metadata?.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {selectedIssuance.metadata.description}
                                    </Typography>
                                )}
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Maximum Supply</Typography>
                                        <Typography variant="body2">
                                            {selectedIssuance.MaximumAmount || 'Unlimited'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Outstanding Supply</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {selectedIssuance.OutstandingAmount || '0'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                            
                            {/* Supply Warning */}
                            {selectedIssuance.OutstandingAmount && parseInt(selectedIssuance.OutstandingAmount) > 0 ? (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Cannot destroy this token issuance!
                                    </Typography>
                                    <Typography variant="body2">
                                        There are still <strong>{selectedIssuance.OutstandingAmount}</strong> tokens in circulation.
                                        All tokens must be burned before the issuance can be destroyed.
                                    </Typography>
                                </Alert>
                            ) : (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        This token can be destroyed
                                    </Typography>
                                    <Typography variant="body2">
                                        No tokens are currently in circulation (outstanding supply is 0).
                                    </Typography>
                                </Alert>
                            )}
                            
                            {/* Final Warning */}
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    ⚠️ This action is irreversible!
                                </Typography>
                                <Typography variant="body2">
                                    Once destroyed, this token issuance cannot be recovered.
                                    You will not be able to mint new tokens of this type.
                                </Typography>
                            </Alert>
                            
                            {/* Confirmation Input */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    To confirm, please type <strong>DESTROY</strong> below:
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={destroyConfirmText}
                                    onChange={(e) => setDestroyConfirmText(e.target.value)}
                                    placeholder="Type DESTROY to confirm"
                                    disabled={destroyInProgress || transactionStatus.processing}
                                    autoComplete="off"
                                />
                            </Box>
                            
                            {/* Token ID */}
                            <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Token Issuance ID:
                                </Typography>
                                <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                    {selectedIssuance.MPTokenIssuanceID}
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => {
                            setConfirmDialog({ open: false, action: null });
                            setDestroyConfirmText('');
                        }}
                        disabled={destroyInProgress || transactionStatus.processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={async () => {
                            try {
                                console.log('Destroy button clicked, selectedIssuance:', selectedIssuance);
                                await handleDestroy(selectedIssuance);
                            } catch (error) {
                                console.error('Error in destroy button onClick:', error);
                            }
                        }}
                        variant="contained"
                        color="error"
                        disabled={
                            destroyInProgress || 
                            transactionStatus.processing ||
                            destroyConfirmText !== 'DESTROY' ||
                            (selectedIssuance?.OutstandingAmount && parseInt(selectedIssuance.OutstandingAmount) > 0)
                        }
                        startIcon={destroyInProgress ? <CircularProgress size={20} /> : <DeleteForeverIcon />}
                    >
                        {destroyInProgress ? 'Destroying...' : 'Destroy Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Transaction Progress Dialog */}
            <Dialog
                open={transactionStatus.processing}
                PaperProps={{
                    sx: { minWidth: 400 }
                }}
            >
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                        <CircularProgress size={48} sx={{ mb: 3 }} />
                        <Typography variant="h6" gutterBottom>
                            {transactionStatus.message || 'Processing transaction...'}
                        </Typography>
                        {transactionStatus.txHash && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">Transaction Hash:</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5 }}>
                                    {transactionStatus.txHash}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    This may take a few seconds...
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Token Holder Management Dialog */}
            <Dialog
                open={holdersDialog}
                onClose={() => setHoldersDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {selectedTokenForHolders?.metadata?.iconUrl && (
                            <Avatar 
                                src={selectedTokenForHolders.metadata.iconUrl} 
                                sx={{ width: 32, height: 32 }}
                            />
                        )}
                        <Box>
                            <Typography variant="h6">
                                {selectedTokenForHolders?.metadata?.name || 'Token'} Holders
                            </Typography>
                            {selectedTokenForHolders?.metadata?.currencyCode && (
                                <Typography variant="caption" color="text.secondary">
                                    {selectedTokenForHolders.metadata.currencyCode}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedTokenForHolders && (
                        <TokenHolderManager
                            wallet={wallet}
                            issuance={selectedTokenForHolders}
                            onUpdate={loadIssuances}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHoldersDialog(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={snackbar.duration || 6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ maxWidth: 600 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TokenOperations;