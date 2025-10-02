import React, { useState, useCallback } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    AlertTitle,
    Box,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Chip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
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
    const [activeStep, setActiveStep] = useState(0);

    // Check if this token requires authorization
    const requiresAuth = formData.requireAuth === true;

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
            setActiveStep(1); // Move to issuance step
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

    // For non-restricted tokens, skip to issuance
    React.useEffect(() => {
        if (!requiresAuth && recipientAddress && !txState.authComplete) {
            setActiveStep(1);
        }
    }, [requiresAuth, recipientAddress, txState.authComplete]);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Issue Tokens to Recipient
                </Typography>

                {requiresAuth ? (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <AlertTitle>Authorization Required</AlertTitle>
                        This token has <strong>Require Authorization</strong> enabled. 
                        You must authorize recipients before they can receive tokens.
                    </Alert>
                ) : (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        <AlertTitle>Open Token</AlertTitle>
                        This token does <strong>not</strong> require authorization. 
                        You can send tokens to any address directly.
                    </Alert>
                )}

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
                            InputProps={{
                                endAdornment: txState.authComplete && (
                                    <Chip 
                                        icon={<CheckCircleIcon />}
                                        label="Authorized" 
                                        color="success" 
                                        size="small"
                                    />
                                )
                            }}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                    <Stepper activeStep={activeStep} orientation="vertical">
                        {requiresAuth && (
                            <Step>
                                <StepLabel
                                    StepIconComponent={() => 
                                        txState.authComplete ? 
                                        <CheckCircleIcon color="success" /> : 
                                        <LockIcon color={activeStep === 0 ? "primary" : "disabled"} />
                                    }
                                >
                                    Authorize Recipient
                                </StepLabel>
                                <StepContent>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        Grant permission for this address to hold your tokens.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={handleAuthorizeHolder}
                                        disabled={!recipientAddress || authorizing || txState.authComplete}
                                        startIcon={authorizing ? <CircularProgress size={20} /> : <LockIcon />}
                                    >
                                        {authorizing ? 'Authorizing...' : 
                                         txState.authComplete ? 'Already Authorized' : 'Authorize Holder'}
                                    </Button>
                                </StepContent>
                            </Step>
                        )}

                        <Step>
                            <StepLabel
                                StepIconComponent={() => 
                                    txState.issueComplete ? 
                                    <CheckCircleIcon color="success" /> : 
                                    <SendIcon color={activeStep === (requiresAuth ? 1 : 0) ? "primary" : "disabled"} />
                                }
                            >
                                Issue Tokens
                            </StepLabel>
                            <StepContent>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Amount to Issue"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            placeholder="1000"
                                            helperText={`Scale: ${formData.assetScale} (1 token = ${Math.pow(10, formData.assetScale)} units)`}
                                            disabled={issuing || txState.issueComplete}
                                            type="number"
                                            InputProps={{
                                                endAdornment: txState.issueComplete && (
                                                    <Chip 
                                                        icon={<CheckCircleIcon />}
                                                        label="Issued" 
                                                        color="success" 
                                                        size="small"
                                                    />
                                                )
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                                
                                {requiresAuth && !txState.authComplete && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        Please complete the authorization step first.
                                    </Alert>
                                )}

                                <Button
                                    variant="contained"
                                    onClick={handleIssueTokens}
                                    disabled={
                                        !recipientAddress || 
                                        !amount || 
                                        issuing || 
                                        txState.issueComplete ||
                                        (requiresAuth && !txState.authComplete)
                                    }
                                    startIcon={issuing ? <CircularProgress size={20} /> : <SendIcon />}
                                >
                                    {issuing ? 'Issuing Tokens...' : 
                                     txState.issueComplete ? 'Tokens Issued' : 'Issue Tokens'}
                                </Button>
                            </StepContent>
                        </Step>
                    </Stepper>
                </Box>

                {!requiresAuth && (
                    <Alert severity="info" sx={{ mt: 3 }}>
                        <strong>Note:</strong> Since authorization is not required for this token, 
                        anyone can receive and hold these tokens. The recipient doesn't need to 
                        take any action before receiving tokens.
                    </Alert>
                )}

                {requiresAuth && (
                    <Alert severity="warning" sx={{ mt: 3 }}>
                        <strong>Important:</strong> With "Require Authorization" enabled, only 
                        addresses you explicitly authorize can hold this token. Recipients cannot 
                        receive tokens through other means (like DEX trading) unless authorized first.
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
});

TokenIssuanceStep.displayName = 'TokenIssuanceStep';

export default TokenIssuanceStep;