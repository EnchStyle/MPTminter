import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Alert,
    AlertTitle,
    Button
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const TokenCreatedStep = React.memo(({
    txState,
    formData,
    xrplService,
    copyToClipboard,
    onContinue
}) => {
    return (
        <Box textAlign="center">
            <Box sx={{ mb: 4 }}>
                <Box 
                    sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: 'success.light', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        mx: 'auto', 
                        mb: 2 
                    }}
                >
                    <CheckIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h4" gutterBottom>
                    Token Definition Created!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Your MPT is defined, but no tokens exist yet
                </Typography>
            </Box>

            {txState.mptIssuanceId && (
                <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.light' }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Your Token ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {txState.mptIssuanceId}
                        </Typography>
                        {copyToClipboard && (
                            <Button 
                                size="small" 
                                onClick={() => copyToClipboard(txState.mptIssuanceId)}
                                sx={{ mt: 1 }}
                            >
                                Copy ID
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            <Alert severity="info" sx={{ mb: 4 }}>
                <AlertTitle>📌 What Just Happened?</AlertTitle>
                <Box component="div">
                    <Typography variant="body2">✅ Token definition created (the "machine")</Typography>
                    <Typography variant="body2">❌ Zero tokens minted (nothing issued yet)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                        Next: Actually create (mint) the tokens!
                    </Typography>
                </Box>
            </Alert>

            <Box display="flex" gap={2} justifyContent="center">
                <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={onContinue}
                    startIcon={<ArrowForwardIcon />}
                >
                    → Issue Tokens Now
                </Button>
                {txState.createTxHash && (
                    <Button
                        variant="outlined"
                        size="large"
                        href={xrplService.getExplorerUrl(txState.createTxHash)}
                        target="_blank"
                    >
                        View Transaction
                    </Button>
                )}
            </Box>
        </Box>
    );
});

export default TokenCreatedStep;