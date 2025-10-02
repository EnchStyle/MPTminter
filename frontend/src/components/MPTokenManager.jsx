import React, { useState, useCallback, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
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
    TextField
} from '@mui/material';

const MPTokenManager = React.memo(({ wallet, xrplService, showSnackbar }) => {
    const [loading, setLoading] = useState(false);
    const [holderTokens, setHolderTokens] = useState([]);
    const [issuerTokens, setIssuerTokens] = useState([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [holderAddress, setHolderAddress] = useState('');
    
    const loadTokens = useCallback(async () => {
        if (!wallet) return;
        
        setLoading(true);
        try {
            // Load tokens where this wallet is the issuer
            const issuances = await xrplService.getMPTokenIssuances(wallet.classicAddress);
            setIssuerTokens(issuances);
            
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
    }, [wallet, xrplService, showSnackbar]);
    
    const checkHolderTokens = useCallback(async () => {
        if (!holderAddress) {
            showSnackbar('Please enter a holder address', 'warning');
            return;
        }
        
        setLoading(true);
        try {
            const tokens = await xrplService.getAllMPTokens(holderAddress);
            setHolderTokens(tokens);
            showSnackbar(`Found ${tokens.length} tokens for ${holderAddress}`, 'info');
        } catch (err) {
            console.error('Error loading holder tokens:', err);
            showSnackbar('Failed to load tokens: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [holderAddress, xrplService, showSnackbar]);
    
    const handleUnauthorize = useCallback(async (mptIssuanceId, holderAddr) => {
        if (!wallet) return;
        
        try {
            setLoading(true);
            const tx = {
                TransactionType: 'MPTokenAuthorize',
                Account: holderAddr || wallet.classicAddress,
                MPTokenIssuanceID: mptIssuanceId,
                Flags: 1 // Unauthorize
            };
            
            // If unauthorizing for another holder, they need to sign
            if (holderAddr && holderAddr !== wallet.classicAddress) {
                showSnackbar('The holder must unauthorize from their own wallet', 'warning');
                return;
            }
            
            const result = await xrplService.submitTransaction(tx, wallet);
            
            if (result.result.validated) {
                showSnackbar('Successfully removed authorization!', 'success');
                await loadTokens();
            } else {
                throw new Error(result.result.meta.TransactionResult);
            }
        } catch (err) {
            console.error('Unauthorize error:', err);
            showSnackbar('Failed to unauthorize: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [wallet, xrplService, showSnackbar, loadTokens]);
    
    useEffect(() => {
        if (wallet) {
            loadTokens();
        }
    }, [wallet, loadTokens]);
    
    return (
        <>
            <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
                <Tab label="My Holdings" />
                <Tab label="My Issuances" />
                <Tab label="Check Holder" />
            </Tabs>
            
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
                                        primary={`MPT ID: ${token.MPTokenIssuanceID}`}
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
                        Tokens you have created:
                    </Typography>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : issuerTokens.length === 0 ? (
                        <Alert severity="info">No MPTokens issued by your wallet</Alert>
                    ) : (
                        <List>
                            {issuerTokens.map((token, idx) => (
                                <ListItem key={idx} divider>
                                    <ListItemText
                                        primary={`MPT ID: ${token.index || token.MPTokenIssuanceID}`}
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" display="block">
                                                    Max Supply: {token.MaximumAmount || 'Unlimited'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Scale: {token.AssetScale || '0'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            )}
            
            {selectedTab === 2 && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Check what tokens a specific address holds:
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                        <TextField
                            fullWidth
                            label="Holder Address"
                            value={holderAddress}
                            onChange={(e) => setHolderAddress(e.target.value)}
                            placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            size="small"
                        />
                        <Button
                            variant="contained"
                            onClick={checkHolderTokens}
                            disabled={loading || !holderAddress}
                        >
                            Check
                        </Button>
                    </Box>
                    {holderTokens.length > 0 && (
                        <List>
                            {holderTokens.map((token, idx) => (
                                <ListItem key={idx} divider>
                                    <ListItemText
                                        primary={`MPT ID: ${token.MPTokenIssuanceID}`}
                                        secondary={`Balance: ${token.MPTAmount || '0'}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => loadTokens()} disabled={loading}>
                    Refresh
                </Button>
            </Box>
        </>
    );
});

export default MPTokenManager;