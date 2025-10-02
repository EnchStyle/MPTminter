import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
    Container, 
    Card, 
    Stepper, 
    Step, 
    StepLabel, 
    Typography, 
    Box, 
    Button,
    Snackbar,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as xrpl from 'xrpl';

// Services
import { xrplService } from './services/xrplService';
import { sessionService } from './services/sessionService';
import { validationService } from './services/validationService';
import { metadataService } from './services/metadataService';

// Hooks
import { useXRPLConnection } from './hooks/useXRPLConnection';
import { useSession } from './hooks/useSession';
import { useFormValidation } from './hooks/useFormValidation';

// Components
import WalletConnectionStep from './components/steps/WalletConnectionStep';
import TokenInfoStep from './components/steps/TokenInfoStep';
import TokenConfigStep from './components/steps/TokenConfigStep';
import MetadataStep from './components/steps/MetadataStep';
import ReviewStep from './components/steps/ReviewStep';
import TokenCreatedStep from './components/steps/TokenCreatedStep';
import TokenIssuanceStep from './components/steps/TokenIssuanceStep';
import CompletionStep from './components/steps/CompletionStep';
import ResumeSessionDialog from './components/dialogs/ResumeSessionDialog';
import MPTokenManager from './components/MPTokenManager';

// Constants
import { STEPS } from './utils/constants';

function App() {
    const { connectionStatus, retryCount, connect, disconnect } = useXRPLConnection();
    const { resumeData, saveSession, clearSession } = useSession();
    const { errors, validateField, validateStep, clearErrors } = useFormValidation();

    // Form state
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        secretKey: '',
        currencyCode: '',
        name: '',
        description: '',
        assetScale: 2,
        transferFee: 0,
        maxAmount: '',
        canLock: false,
        requireAuth: false,
        canClawback: false,
        canFreeze: false,
        iconUrl: '',
        assetClass: '',
        assetSubclass: '',
        weblinks: [],
        recipientAddress: '',
        amount: '',
        includeMetadata: true
    });

    // Wallet state
    const [wallet, setWallet] = useState(null);
    const [accountInfo, setAccountInfo] = useState(null);

    // Transaction state
    const [txState, setTxState] = useState({
        createTxHash: null,
        authTxHash: null,
        issueTxHash: null,
        createComplete: false,
        authComplete: false,
        issueComplete: false,
        mptIssuanceId: null,
        finalBalance: '0'
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
    const [tokenManagerOpen, setTokenManagerOpen] = useState(false);
    const [error, setError] = useState(null);
    const [warnings, setWarnings] = useState({});

    // Check for resume data on mount
    useEffect(() => {
        if (resumeData && !wallet) {
            setResumeDialogOpen(true);
        }
    }, [resumeData, wallet]);

    // Save session on important state changes
    useEffect(() => {
        if (activeStep > 0 && wallet) {
            const sessionData = {
                activeStep,
                formData,
                txState,
                walletAddress: wallet.classicAddress
            };
            saveSession(sessionData);
        }
    }, [activeStep, formData, txState, wallet, saveSession]);

    const handleResumeSession = useCallback(async () => {
        setResumeDialogOpen(false);
        
        if (resumeData) {
            setFormData(resumeData.formData || {});
            setTxState(resumeData.txState || {});
            setActiveStep(resumeData.activeStep || 0);

            showSnackbar('Session resumed! Please reconnect your wallet.', 'info');
        }
    }, [resumeData]);

    const handleStartFresh = useCallback(() => {
        setResumeDialogOpen(false);
        clearSession();
        resetForm();
    }, [clearSession]);

    const showSnackbar = useCallback((message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const copyToClipboard = useCallback(async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showSnackbar('Copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            showSnackbar('Failed to copy to clipboard', 'error');
        }
    }, [showSnackbar]);

    const connectWallet = useCallback(async () => {
        setLoading(true);
        setError(null);
        setWarnings({});
        
        try {
            const secret = formData.secretKey.trim();
            const error = validationService.validateSecretKey(secret);
            if (error) throw new Error(error);

            await connect();

            const walletFromSeed = xrpl.Wallet.fromSeed(secret);
            setWallet(walletFromSeed);

            const info = await xrplService.getAccountInfo(walletFromSeed.classicAddress);
            setAccountInfo(info);

            const xrpBalance = parseInt(info.Balance) / 1000000;
            if (xrpBalance < 20) {
                setWarnings({
                    balance: `Low XRP balance (${xrpBalance} XRP). Ensure you have enough for reserves and fees.`
                });
            }

            showSnackbar('Wallet connected successfully!', 'success');
        } catch (err) {
            console.error('Connection error:', err);
            setError(err.message || 'Failed to connect wallet');
            
            if (err.message.includes('Account not found')) {
                setError('Account not found. The account needs to be activated with at least 10 XRP.');
            } else if (err.message.includes('Invalid')) {
                setError('Invalid secret key format.');
            }
        } finally {
            setLoading(false);
        }
    }, [formData.secretKey, connect, showSnackbar]);

    const handleNext = useCallback(async () => {
        try {
            // Validate prerequisites
            validationService.validatePrerequisites(activeStep + 1, { wallet, txState });

            // Validate current step
            if (!validateStep(activeStep + 1, formData)) {
                showSnackbar('Please fix validation errors before proceeding', 'error');
                return;
            }

            clearErrors();
            setActiveStep(activeStep + 1);
        } catch (err) {
            showSnackbar(err.message, 'error');
        }
    }, [activeStep, formData, wallet, txState, validateStep, clearErrors, showSnackbar]);

    const handleBack = useCallback(() => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    }, [activeStep]);

    const handleCreateToken = useCallback(async () => {
        setLoading(true);
        
        try {
            const flags = 
                (formData.canLock ? 1 : 0) |
                (formData.requireAuth ? 2 : 0) |
                (formData.canFreeze ? 4 : 0) |
                (formData.canClawback ? 8 : 0);

            const metadata = formData.includeMetadata ? 
                metadataService.buildMetadata(formData) : '';

            const tx = {
                TransactionType: "MPTokenIssuanceCreate",
                Account: wallet.classicAddress,
                AssetScale: parseInt(formData.assetScale),
                Flags: flags,
                TransferFee: parseInt(formData.transferFee),
                ...(formData.maxAmount && { MaximumAmount: formData.maxAmount }),
                ...(metadata && { MPTokenMetadata: metadata })
            };

            const result = await xrplService.submitTransaction(tx, wallet);
            
            if (result.result.validated) {
                const mptIssuanceId = result.result.meta.mpt_issuance_id ||
                    result.result.meta.CreatedNode?.find(
                        node => node.LedgerEntryType === 'MPTokenIssuance'
                    )?.NewFields?.MPTokenIssuanceID;

                setTxState(prev => ({
                    ...prev,
                    createTxHash: result.result.hash,
                    createComplete: true,
                    mptIssuanceId
                }));

                showSnackbar('Token created successfully!', 'success');
                handleNext();
            } else {
                throw new Error('Transaction failed validation');
            }
        } catch (err) {
            console.error('Create token error:', err);
            showSnackbar(err.message || 'Failed to create token', 'error');
        } finally {
            setLoading(false);
        }
    }, [formData, wallet, showSnackbar, handleNext]);

    const handleAuthorizeHolder = useCallback(async () => {
        setLoading(true);
        
        try {
            if (!formData.recipientAddress) {
                throw new Error('Recipient address is required');
            }

            const recipientAddress = formData.recipientAddress.trim();
            if (recipientAddress === wallet.classicAddress) {
                showSnackbar('Cannot issue tokens to yourself', 'error');
                setLoading(false);
                return;
            }

            const isAuthorized = await xrplService.checkMPTAuthorization(
                recipientAddress, 
                txState.mptIssuanceId
            );

            if (isAuthorized) {
                showSnackbar('Recipient is already authorized!', 'info');
                setTxState(prev => ({ ...prev, authComplete: true }));
                setLoading(false);
                return;
            }

            const tx = {
                TransactionType: "MPTokenAuthorize",
                Account: wallet.classicAddress,
                MPTokenIssuanceID: txState.mptIssuanceId,
                MPTokenHolder: recipientAddress
            };

            const result = await xrplService.submitTransaction(tx, wallet);
            
            if (result.result.validated) {
                setTxState(prev => ({
                    ...prev,
                    authTxHash: result.result.hash,
                    authComplete: true
                }));
                showSnackbar('Authorization successful!', 'success');
            }
        } catch (err) {
            console.error('Authorize error:', err);
            showSnackbar(err.message || 'Failed to authorize holder', 'error');
        } finally {
            setLoading(false);
        }
    }, [formData.recipientAddress, wallet, txState.mptIssuanceId, showSnackbar]);

    const handleIssueTokens = useCallback(async () => {
        setLoading(true);
        
        try {
            const amount = formData.amount || '0';
            const scale = parseInt(formData.assetScale) || 0;
            const scaledAmount = (parseFloat(amount) * Math.pow(10, scale)).toString();

            const tx = {
                TransactionType: "MPTokenIssuanceSet",
                Account: wallet.classicAddress,
                MPTokenIssuanceID: txState.mptIssuanceId,
                MPTokenHolder: formData.recipientAddress.trim(),
                Amount: scaledAmount
            };

            const result = await xrplService.submitTransaction(tx, wallet);
            
            if (result.result.validated) {
                const finalBalance = result.result.meta.modified_nodes?.find(
                    node => node.ModifiedNode?.LedgerEntryType === 'MPToken'
                )?.ModifiedNode?.FinalFields?.MPTAmount || scaledAmount;

                setTxState(prev => ({
                    ...prev,
                    issueTxHash: result.result.hash,
                    issueComplete: true,
                    finalBalance
                }));
                
                showSnackbar('Tokens issued successfully!', 'success');
                handleNext();
            }
        } catch (err) {
            console.error('Issue tokens error:', err);
            showSnackbar(err.message || 'Failed to issue tokens', 'error');
        } finally {
            setLoading(false);
        }
    }, [formData.amount, formData.assetScale, formData.recipientAddress, wallet, txState.mptIssuanceId, showSnackbar, handleNext]);

    const resetForm = useCallback(() => {
        setActiveStep(0);
        setFormData({
            secretKey: '',
            currencyCode: '',
            name: '',
            description: '',
            assetScale: 2,
            transferFee: 0,
            maxAmount: '',
            canLock: false,
            requireAuth: false,
            canClawback: false,
            canFreeze: false,
            iconUrl: '',
            assetClass: '',
            assetSubclass: '',
            weblinks: [],
            recipientAddress: '',
            amount: '',
            includeMetadata: true
        });
        setWallet(null);
        setAccountInfo(null);
        setTxState({
            createTxHash: null,
            authTxHash: null,
            issueTxHash: null,
            createComplete: false,
            authComplete: false,
            issueComplete: false,
            mptIssuanceId: null,
            finalBalance: '0'
        });
        clearErrors();
        clearSession();
    }, [clearErrors, clearSession]);

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <WalletConnectionStep
                        formData={formData}
                        setFormData={setFormData}
                        validateField={validateField}
                        errors={errors}
                        setError={setError}
                        onConnect={connectWallet}
                        connectionStatus={connectionStatus}
                        loading={loading}
                        wallet={wallet}
                        accountInfo={accountInfo}
                        warnings={warnings}
                        onContinue={handleNext}
                    />
                );
            case 1:
                return (
                    <TokenInfoStep
                        formData={formData}
                        setFormData={setFormData}
                        validateField={validateField}
                        errors={errors}
                    />
                );
            case 2:
                return (
                    <TokenConfigStep
                        formData={formData}
                        setFormData={setFormData}
                        validateField={validateField}
                        errors={errors}
                    />
                );
            case 3:
                return (
                    <MetadataStep
                        formData={formData}
                        setFormData={setFormData}
                        metadataService={metadataService}
                    />
                );
            case 4:
                return (
                    <ReviewStep
                        formData={formData}
                        wallet={wallet}
                        onCreateToken={handleCreateToken}
                        loading={loading}
                    />
                );
            case 5:
                return (
                    <TokenCreatedStep
                        txState={txState}
                        formData={formData}
                        xrplService={xrplService}
                        copyToClipboard={copyToClipboard}
                        onContinue={handleNext}
                    />
                );
            case 6:
                return (
                    <TokenIssuanceStep
                        formData={formData}
                        setFormData={setFormData}
                        txState={txState}
                        setTxState={setTxState}
                        errors={errors}
                        onIssueTokens={handleIssueTokens}
                        onAuthorizeHolder={handleAuthorizeHolder}
                        loading={loading}
                        setError={setError}
                        showSnackbar={showSnackbar}
                    />
                );
            case 7:
                return (
                    <CompletionStep
                        txState={txState}
                        formData={formData}
                        xrplService={xrplService}
                        onResetForm={resetForm}
                        copyToClipboard={copyToClipboard}
                    />
                );
            default:
                return null;
        }
    };

    const isStepCompleted = (step) => {
        switch (step) {
            case 0: return wallet !== null;
            case 1: return formData.currencyCode && formData.name && formData.description;
            case 2: return true;
            case 3: return true;
            case 4: return txState.createComplete;
            case 5: return txState.createComplete;
            case 6: return txState.issueComplete;
            case 7: return true;
            default: return false;
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Card elevation={3}>
                <Box sx={{ p: 4 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 4 
                    }}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
                            MPT Token Creator
                        </Typography>
                        {wallet && (
                            <Button
                                variant="outlined"
                                onClick={() => setTokenManagerOpen(true)}
                            >
                                Manage Tokens
                            </Button>
                        )}
                    </Box>

                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {STEPS.map((label, index) => (
                            <Step key={label} completed={isStepCompleted(index)}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 3 }}
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    {renderStepContent()}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button
                            disabled={activeStep === 0 || loading}
                            onClick={handleBack}
                            variant="outlined"
                        >
                            Back
                        </Button>
                        
                        {activeStep < STEPS.length - 1 && activeStep !== 4 && activeStep !== 6 && (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={loading || !isStepCompleted(activeStep)}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Next'}
                            </Button>
                        )}
                    </Box>
                </Box>
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
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <ResumeSessionDialog
                open={resumeDialogOpen}
                onResume={handleResumeSession}
                onStartFresh={handleStartFresh}
            />

            <Dialog
                open={tokenManagerOpen}
                onClose={() => setTokenManagerOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">MPT Token Manager</Typography>
                        <IconButton onClick={() => setTokenManagerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {wallet && (
                        <MPTokenManager
                            wallet={wallet}
                            xrplService={xrplService}
                            showSnackbar={showSnackbar}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
}

export default App;