import React, { useState, useCallback, useEffect } from 'react';
import {
    Button,
    Typography,
    Box,
    IconButton,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    Alert,
    CircularProgress,
    TextField,
    Card,
    CardContent,
    Chip,
    Snackbar,
    Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TokenIcon from '@mui/icons-material/Token';
import { xrplService } from '../services/xrplService';
import { metadataService } from '../services/metadataService';

const MPTokenManager = React.memo(({ wallet, isStandalone = false }) => {
    const [loading, setLoading] = useState(false);
    const [holderTokens, setHolderTokens] = useState([]);
    const [issuerTokens, setIssuerTokens] = useState([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [holderAddress, setHolderAddress] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    
    // Internal snackbar for standalone mode
    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };
    
    const loadTokens = useCallback(async () => {
        if (!wallet) return;
        
        setLoading(true);
        try {
            // Load tokens where this wallet is the issuer
            const issuances = await xrplService.getMPTokenIssuances(wallet.classicAddress);
            
            // Parse metadata for each issuance
            const issuancesWithMetadata = issuances.map(issuance => {
                const metadata = issuance.MPTokenMetadata ? 
                    metadataService.parseMetadata(issuance.MPTokenMetadata) : null;
                return { ...issuance, metadata };
            });
            
            setIssuerTokens(issuancesWithMetadata);
            
            // Load tokens where this wallet is a holder
            const holdings = await xrplService.getAllMPTokens(wallet.classicAddress);
            setHolderTokens(holdings);
            
            showSnackbar(`Found ${issuances.length} issued tokens and ${holdings.length} held tokens`, 'info');
        } catch (err) {
            console.error('Error loading tokens:', err);
            showSnackbar('Failed to load tokens: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [wallet]);
    
    const checkHolderTokens = useCallback(async () => {
        if (!holderAddress) {
            showSnackbar('Please enter a holder address', 'error');
            return;
        }
        
        setLoading(true);
        try {
            const holdings = await xrplService.getAllMPTokens(holderAddress);
            showSnackbar(`Holder has ${holdings.length} MPTokens`, 'info');
        } catch (err) {
            console.error('Error checking holder:', err);
            showSnackbar('Failed to check holder: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [holderAddress]);
    
    const handleUnauthorize = useCallback(async (mptIssuanceId) => {
        setLoading(true);
        try {
            const tx = {
                TransactionType: "MPTokenAuthorize",
                Account: wallet.classicAddress,
                MPTokenIssuanceID: mptIssuanceId,
                Flags: 0x0001 // tfMPTUnauthorize
            };
            
            const result = await xrplService.submitTransaction(tx, wallet);
            if (result.result.validated) {
                showSnackbar('Token authorization removed', 'success');
                await loadTokens(); // Reload tokens
            } else {
                throw new Error('Transaction failed');
            }
        } catch (err) {
            console.error('Error unauthorizing:', err);
            showSnackbar('Failed to remove authorization: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [wallet, loadTokens]);
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showSnackbar('Copied to clipboard', 'success');
    };
    
    // Load tokens on mount
    useEffect(() => {
        loadTokens();
    }, [loadTokens]);
    
    const content = (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
                    <Tab label="My Holdings" />
                    <Tab label="My Issuances" />
                    <Tab label="Check Holder" />
                </Tabs>
                <IconButton onClick={loadTokens} disabled={loading}>
                    <RefreshIcon />
                </IconButton>
            </Box>
            
            {selectedTab === 0 && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Tokens you are authorized to hold:
                    </Typography>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : holderTokens.length === 0 ? (
                        <Alert severity="info">No MPTokens found in your wallet</Alert>
                    ) : (
                        <List>
                            {holderTokens.map((token, idx) => (
                                <ListItem key={idx} divider>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1" noWrap sx={{ maxWidth: '70%' }}>
                                                    {token.MPTokenIssuanceID}
                                                </Typography>
                                                <Tooltip title="Copy ID">
                                                    <IconButton size="small" onClick={() => copyToClipboard(token.MPTokenIssuanceID)}>
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" display="block">
                                                    Balance: {token.MPTAmount || '0'}
                                                </Typography>
                                                {token.MPTAmount === '0' && (
                                                    <Typography variant="caption" color="warning.main">
                                                        ⚠️ Zero balance - can be removed
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    {token.MPTAmount === '0' && (
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={() => handleUnauthorize(token.MPTokenIssuanceID)}
                                            disabled={loading}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            )}
            
            {selectedTab === 1 && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Tokens you have issued:
                    </Typography>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : issuerTokens.length === 0 ? (
                        <Alert severity="info">You haven't issued any MPTokens yet</Alert>
                    ) : (
                        <List>
                            {issuerTokens.map((token, idx) => {
                                const metadata = token.metadata;
                                return (
                                    <ListItem key={idx} divider>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <TokenIcon sx={{ color: 'primary.main' }} />
                                                    <Typography variant="subtitle1">
                                                        {metadata?.name || 'Unnamed Token'}
                                                    </Typography>
                                                    {metadata?.currencyCode && (
                                                        <Chip 
                                                            label={metadata.currencyCode}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    {metadata?.description && (
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            {metadata.description}
                                                        </Typography>
                                                    )}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            ID: {token.MPTokenIssuanceID.substring(0, 16)}...
                                                        </Typography>
                                                        <Tooltip title="Copy ID">
                                                            <IconButton size="small" onClick={() => copyToClipboard(token.MPTokenIssuanceID)}>
                                                                <ContentCopyIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                    <Typography variant="caption" display="block">
                                                        Max Amount: {token.MaximumAmount || 'Unlimited'}
                                                    </Typography>
                                                    <Typography variant="caption" display="block">
                                                        Transfer Fee: {token.TransferFee ? `${token.TransferFee / 1000}%` : '0%'}
                                                    </Typography>
                                                    {token.Flags && (
                                                        <Box sx={{ mt: 0.5 }}>
                                                            {(token.Flags & 0x0001) && <Chip label="CanLock" size="small" sx={{ mr: 0.5 }} />}
                                                            {(token.Flags & 0x0002) && <Chip label="RequireAuth" size="small" sx={{ mr: 0.5 }} />}
                                                            {(token.Flags & 0x0004) && <Chip label="CanEscrow" size="small" sx={{ mr: 0.5 }} />}
                                                            {(token.Flags & 0x0008) && <Chip label="CanTrade" size="small" sx={{ mr: 0.5 }} />}
                                                            {(token.Flags & 0x0010) && <Chip label="CanTransfer" size="small" sx={{ mr: 0.5 }} />}
                                                            {(token.Flags & 0x0020) && <Chip label="CanClawback" size="small" />}
                                                        </Box>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Box>
            )}
            
            {selectedTab === 2 && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Check MPTokens for a specific address:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label="Holder Address"
                            value={holderAddress}
                            onChange={(e) => setHolderAddress(e.target.value)}
                            placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        />
                        <Button
                            variant="contained"
                            onClick={checkHolderTokens}
                            disabled={loading || !holderAddress}
                        >
                            Check
                        </Button>
                    </Box>
                </Box>
            )}
        </>
    );

    if (isStandalone) {
        return (
            <>
                <Card>
                    <CardContent>
                        {content}
                    </CardContent>
                </Card>
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
            </>
        );
    }
    
    return content;
});

MPTokenManager.displayName = 'MPTokenManager';

export default MPTokenManager;