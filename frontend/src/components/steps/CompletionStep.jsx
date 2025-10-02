import React, { useState, useCallback } from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Alert,
    AlertTitle,
    Button,
    Grid,
    IconButton,
    CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import TokenIcon from '@mui/icons-material/Token';
import AddCircleIcon from '@mui/icons-material/AddCircle';

const CompletionStep = React.memo(({ 
    txState,
    formData,
    xrplService,
    onResetForm,
    copyToClipboard
}) => {
    const [checkingBalance, setCheckingBalance] = useState(false);
    
    const handleCheckBalance = useCallback(async () => {
        setCheckingBalance(true);
        try {
            const tokens = await xrplService.getAllMPTokens(formData.recipientAddress);
            
            const mptToken = tokens.find(
                obj => obj.MPTokenIssuanceID === txState.mptIssuanceId
            );
            
            if (mptToken) {
                const rawAmount = mptToken.MPTAmount || '0';
                const scale = parseInt(formData.assetScale || '0');
                const displayAmount = scale > 0 
                    ? (parseFloat(rawAmount) / Math.pow(10, scale)).toFixed(scale)
                    : rawAmount;
                
                alert(`✅ CONFIRMED!\n\n` +
                      `Holder has tokens:\n\n` +
                      `Raw: ${rawAmount} units\n` +
                      `Display: ${displayAmount}\n` +
                      `Token: ${formData.currencyCode}\n\n` +
                      `The tokens ARE in the wallet!`);
            } else {
                alert('❌ No tokens found. This is unexpected!');
            }
        } catch (error) {
            alert('Failed to check balance: ' + error.message);
        } finally {
            setCheckingBalance(false);
        }
    }, [txState, formData, xrplService]);

    return (
        <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ 
                        width: 120, height: 120, 
                        bgcolor: 'success.main', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        mx: 'auto', mb: 3,
                        boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)'
                    }}>
                        <Typography variant="h1" sx={{ fontSize: '4rem' }}>🎉</Typography>
                    </Box>
                    
                    <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        All Done!
                    </Typography>
                    
                    <Typography variant="h6" color="text.secondary">
                        Your MPT tokens are issued and delivered
                    </Typography>
                </Box>

                <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
                    <AlertTitle sx={{ fontWeight: 'bold' }}>✅ Complete Process:</AlertTitle>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        <li>Token definition created ✓</li>
                        <li>Holder authorized ✓</li>
                        <li>Tokens issued and delivered ✓</li>
                    </Box>
                </Alert>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Transaction Details
                    </Typography>
                    
                    {txState.mptIssuanceId && (
                        <Card variant="outlined" sx={{ mb: 2, bgcolor: 'primary.light', border: 2, borderColor: 'primary.main' }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        🪙 Token ID (MPTokenIssuanceID)
                                    </Typography>
                                    {copyToClipboard && (
                                        <IconButton 
                                            size="small" 
                                            onClick={() => copyToClipboard(txState.mptIssuanceId)}
                                            color="primary"
                                        >
                                            <ContentCopyIcon />
                                        </IconButton>
                                    )}
                                </Box>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontFamily: 'monospace', 
                                        wordBreak: 'break-all',
                                        bgcolor: 'background.paper',
                                        p: 2,
                                        borderRadius: 1
                                    }}
                                >
                                    {txState.mptIssuanceId}
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    <Grid container spacing={2}>
                        {txState.authTxHash && (
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                🔐 Authorization Transaction
                                            </Typography>
                                            {copyToClipboard && (
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => copyToClipboard(txState.authTxHash)}
                                                >
                                                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                fontFamily: 'monospace', 
                                                wordBreak: 'break-all',
                                                fontSize: '0.75rem',
                                                bgcolor: 'grey.50',
                                                p: 1,
                                                borderRadius: 1
                                            }}
                                        >
                                            {txState.authTxHash}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}

                        {txState.issueTxHash && (
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                💰 Issuance Transaction
                                            </Typography>
                                            {copyToClipboard && (
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => copyToClipboard(txState.issueTxHash)}
                                                >
                                                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                fontFamily: 'monospace', 
                                                wordBreak: 'break-all',
                                                fontSize: '0.75rem',
                                                bgcolor: 'grey.50',
                                                p: 1,
                                                borderRadius: 1
                                            }}
                                        >
                                            {txState.issueTxHash}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                </Box>

                <Card variant="outlined" sx={{ mb: 4, bgcolor: 'grey.50' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Summary
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Issued To:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                        {formData.recipientAddress}
                                    </Typography>
                                    {copyToClipboard && (
                                        <IconButton 
                                            size="small" 
                                            onClick={() => copyToClipboard(formData.recipientAddress)}
                                        >
                                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    )}
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Amount:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {formData.amount} {formData.currencyCode}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Balance:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {txState.finalBalance} units
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Alert severity="warning" sx={{ mb: 4, textAlign: 'left' }}>
                    <AlertTitle sx={{ fontWeight: 'bold' }}>💡 Can't see tokens in wallet app?</AlertTitle>
                    <Typography variant="body2" mb={2}>
                        MPTs are new! Many wallets don't show them yet. Use this button to verify:
                    </Typography>
                    <Button
                        fullWidth
                        variant="contained"
                        color="warning"
                        onClick={handleCheckBalance}
                        disabled={checkingBalance}
                        startIcon={checkingBalance ? <CircularProgress size={20} /> : <SearchIcon />}
                    >
                        {checkingBalance ? 'Checking...' : '🔍 Check Holder Balance'}
                    </Button>
                </Alert>

                <Box display="flex" gap={2} justifyContent="center" mb={3}>
                    {txState.issueTxHash && (
                        <Button
                            variant="contained"
                            href={xrplService.getExplorerUrl(txState.issueTxHash)}
                            target="_blank"
                            startIcon={<PaymentIcon />}
                        >
                            View Issuance
                        </Button>
                    )}
                    {txState.createTxHash && (
                        <Button
                            variant="outlined"
                            href={xrplService.getExplorerUrl(txState.createTxHash)}
                            target="_blank"
                            startIcon={<TokenIcon />}
                        >
                            View Creation
                        </Button>
                    )}
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={onResetForm}
                    startIcon={<AddCircleIcon />}
                    sx={{ minWidth: 250 }}
                >
                    Create Another Token
                </Button>
            </CardContent>
        </Card>
    );
});

export default CompletionStep;