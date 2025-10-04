import React, { useState, useCallback } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    AlertTitle,
    Box,
    Grid,
    CircularProgress
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const WalletConnectionStep = React.memo(({ 
    formData, 
    setFormData, 
    validateField, 
    errors, 
    setError, 
    onConnect, 
    connectionStatus, 
    loading,
    wallet,
    accountInfo,
    warnings,
    onContinue
}) => {
    const [secretKey, setSecretKey] = useState(formData.secretKey);
    const [connecting, setConnecting] = useState(false);

    const handleConnect = useCallback(async () => {
        if (!validateField('secretKey', secretKey, true)) {
            return;
        }

        setConnecting(true);
        setError('');

        try {
            setFormData(prev => ({ ...prev, secretKey }));
            await onConnect(secretKey);
        } catch (error) {
            setError(error.message);
        } finally {
            setConnecting(false);
        }
    }, [secretKey, validateField, setError, onConnect, setFormData]);

    const handleSecretKeyChange = useCallback((e) => {
        setSecretKey(e.target.value);
    }, []);

    const isConnected = wallet && accountInfo;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Connect Your Wallet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Enter your XRPL secret key to create and authorize your MPT token.
                </Typography>

                {!isConnected && (
                    <>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            <AlertTitle>🔒 SECURITY REMINDER</AlertTitle>
                            <Typography variant="body2">
                                <strong>ONLY USE TEST WALLETS!</strong> This tool does not encrypt your private keys.
                                Never enter real wallet seed phrases. Use only disposable test wallets for experimentation.
                            </Typography>
                        </Alert>

                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                ⚠️ <strong>XRPL MAINNET - YOU'RE USING REAL MONEY</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                • You need at least 1.3 XRP in your wallet<br/>
                                • Creating a token costs real XRP (fees and reserves)<br/>
                                • Most token settings cannot be changed after creation<br/>
                                • <strong>This tool connects to XRPL mainnet for testing MPT functionality</strong>
                            </Typography>
                        </Alert>

                        <TextField
                            fullWidth
                            type="password"
                            label="Secret Key *"
                            value={secretKey}
                            onChange={handleSecretKeyChange}
                            error={!!errors.secretKey}
                            helperText={errors.secretKey || "Your XRPL secret key (starts with 's')"}
                            placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            sx={{ mb: 2 }}
                            inputProps={{
                                'aria-label': 'XRPL Secret Key',
                                'aria-describedby': 'secret-key-help'
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleConnect}
                            disabled={!secretKey || connecting || loading}
                            sx={{ py: 1.5 }}
                        >
                            {connecting ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Connecting...
                                </>
                            ) : '🚀 Connect to Mainnet'}
                        </Button>
                    </>
                )}

                {isConnected && (
                    <>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                ✅ <strong>Wallet Connected Successfully!</strong>
                            </Typography>
                        </Alert>

                        <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Connected Address
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 2 }}>
                                    {wallet.classicAddress}
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                        <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                                <Typography variant="caption" display="block">XRP Balance</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {(parseFloat(accountInfo.Balance) / 1000000).toFixed(6)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Card variant="outlined">
                                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                                <Typography variant="caption" display="block">Sequence</Typography>
                                                <Typography variant="h6">{accountInfo.Sequence}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Card variant="outlined">
                                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                                <Typography variant="caption" display="block">Owner Count</Typography>
                                                <Typography variant="h6">{accountInfo.OwnerCount || 0}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {warnings && Object.keys(warnings).length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                {Object.entries(warnings).map(([key, warning]) => (
                                    <Alert 
                                        key={key}
                                        severity="warning" 
                                        sx={{ mb: 1 }}
                                    >
                                        {warning}
                                    </Alert>
                                ))}
                            </Box>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={onContinue}
                            sx={{ py: 1.5 }}
                            startIcon={<ArrowForwardIcon />}
                        >
                            Continue to Token Information
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
});

export default WalletConnectionStep;