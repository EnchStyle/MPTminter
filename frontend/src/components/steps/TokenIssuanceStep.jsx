import React, { useState, useCallback } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert
} from '@mui/material';
import * as xrpl from 'xrpl';

const TokenIssuanceStep = React.memo(({ 
    formData, 
    setFormData, 
    txState, 
    setTxState, 
    errors,
    onIssueTokens,
    onAuthorizeHolder,
    loading,
    setError,
    showSnackbar
}) => {
    const [recipientAddress, setRecipientAddress] = useState(formData.recipientAddress || '');
    const [amount, setAmount] = useState(formData.amount || '');
    const [authorizing, setAuthorizing] = useState(false);
    const [issuing, setIssuing] = useState(false);

    const handleAddressChange = useCallback((e) => {
        const value = e.target.value.trim();
        setRecipientAddress(value);
        setFormData(prev => ({ ...prev, recipientAddress: value }));
    }, [setFormData]);

    const handleAmountChange = useCallback((e) => {
        const value = e.target.value;
        setAmount(value);
        setFormData(prev => ({ ...prev, amount: value }));
    }, [setFormData]);

    const handleAuthorizeHolder = useCallback(async () => {
        if (!recipientAddress) {
            showSnackbar('Please enter recipient address', 'error');
            return;
        }

        setAuthorizing(true);
        try {
            await onAuthorizeHolder();
        } catch (error) {
            console.error('Authorization failed:', error);
        } finally {
            setAuthorizing(false);
        }
    }, [recipientAddress, onAuthorizeHolder, showSnackbar]);

    const handleIssueTokens = useCallback(async () => {
        if (!amount) {
            showSnackbar('Please enter amount to issue', 'error');
            return;
        }

        setIssuing(true);
        try {
            await onIssueTokens();
        } catch (error) {
            console.error('Token issuance failed:', error);
        } finally {
            setIssuing(false);
        }
    }, [amount, onIssueTokens, showSnackbar]);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Issue Tokens
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Authorize a holder and issue tokens to them.
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Recipient Address"
                            value={recipientAddress}
                            onChange={handleAddressChange}
                            placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            helperText="The address that will receive the tokens"
                            disabled={authorizing || loading || txState.authComplete}
                            sx={{ mb: 2 }}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Step 1: Authorize Holder
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {txState.authComplete ? 'Holder is authorized' : 'Authorize the recipient to hold tokens'}
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleAuthorizeHolder}
                                    disabled={!recipientAddress || authorizing || txState.authComplete}
                                >
                                    {authorizing ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Authorizing...
                                        </>
                                    ) : txState.authComplete ? 'Authorized ✓' : 'Authorize Holder'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{
                            opacity: txState.authComplete ? 1 : 0.5,
                            pointerEvents: txState.authComplete ? 'auto' : 'none'
                        }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Step 2: Issue Tokens
                                </Typography>
                                {!txState.authComplete ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        ⚠️ Complete Step 1 first to unlock this step
                                    </Typography>
                                ) : (
                                    <>
                                        <TextField
                                            fullWidth
                                            label="Amount to Issue"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            placeholder="1000"
                                            helperText={`Enter the amount (${formData.assetScale} decimal places will be used)`}
                                            disabled={issuing || loading}
                                            sx={{ mb: 2 }}
                                        />
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleIssueTokens}
                                            disabled={!amount || issuing || !txState.authComplete}
                                        >
                                            {issuing ? (
                                                <>
                                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                                    Issuing...
                                                </>
                                            ) : 'Issue Tokens'}
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {errors && Object.keys(errors).length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {Object.values(errors).join(', ')}
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
});

export default TokenIssuanceStep;