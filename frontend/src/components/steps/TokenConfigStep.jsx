import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Grid,
    Card,
    Checkbox,
    Chip,
    Alert,
    AlertTitle
} from '@mui/material';

const TokenConfigStep = React.memo(({
    formData,
    setFormData,
    validateField,
    errors
}) => {
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        validateField(field, value);
    };

    const handleCapabilityChange = (capability) => {
        setFormData(prev => ({ ...prev, [capability]: !prev[capability] }));
    };

    const capabilities = [
        { 
            key: 'canLock', 
            label: '🔒 Freeze Tokens', 
            description: 'You can freeze tokens in user wallets if needed',
            recommended: false 
        },
        { 
            key: 'requireAuth', 
            label: '✅ Pre-approve Holders', 
            description: 'People need your permission before they can hold this token',
            recommended: false 
        },
        { 
            key: 'canClawback', 
            label: '↩️ Reverse Transfers', 
            description: 'You can take tokens back from users if necessary',
            recommended: false 
        },
        { 
            key: 'canFreeze', 
            label: '❄️ Freeze Accounts', 
            description: 'You can freeze specific accounts from trading',
            recommended: false 
        }
    ];

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Token Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure your token's technical parameters and trading fees.
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="number"
                        label="Decimal Places"
                        value={formData.assetScale}
                        onChange={(e) => handleFieldChange('assetScale', e.target.value)}
                        error={!!errors.assetScale}
                        helperText={errors.assetScale || "0-15 maximum (0=whole, 2=cents, 6=micro)"}
                        inputProps={{ min: 0, max: 15, step: 1 }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Maximum Supply"
                        value={formData.maxAmount}
                        onChange={(e) => handleFieldChange('maxAmount', e.target.value)}
                        helperText="Total tokens that can ever exist (optional)"
                        sx={{ fontFamily: 'monospace' }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="number"
                        label="Trading Fee (%)"
                        value={formData.transferFee ? (formData.transferFee / 1000).toFixed(3) : '0'}
                        onChange={(e) => {
                            const percentage = parseFloat(e.target.value) || 0;
                            const basisPoints = Math.round(percentage * 1000);
                            handleFieldChange('transferFee', basisPoints.toString());
                        }}
                        error={!!errors.transferFee}
                        helperText={errors.transferFee || "0-50% maximum (0%=no fee, 0.1%=small fee, 5%=high fee)"}
                        inputProps={{ min: 0, max: 50, step: 0.001 }}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Special Features & Permissions
                </Typography>
                <Alert severity="warning" sx={{ mb: 3 }}>
                    <AlertTitle>⚠️ Choose Carefully!</AlertTitle>
                    These settings cannot be changed after you create your token.
                </Alert>

                <Grid container spacing={2}>
                    {capabilities.map((capability) => (
                        <Grid item xs={12} md={6} key={capability.key}>
                            <Card 
                                variant="outlined" 
                                sx={{ 
                                    p: 2, 
                                    cursor: 'pointer',
                                    border: formData[capability.key] ? 2 : 1,
                                    borderColor: formData[capability.key] ? 'primary.main' : 'divider',
                                    bgcolor: formData[capability.key] ? 'action.selected' : 'background.paper',
                                    '&:hover': {
                                        bgcolor: formData[capability.key] ? 'action.selected' : 'action.hover'
                                    }
                                }}
                                onClick={() => handleCapabilityChange(capability.key)}
                            >
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Checkbox
                                            checked={formData[capability.key]}
                                            onChange={() => handleCapabilityChange(capability.key)}
                                            color="primary"
                                        />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                {capability.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {capability.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {capability.recommended && (
                                        <Chip 
                                            label="Rec" 
                                            size="small" 
                                            color="success" 
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
});

export default TokenConfigStep;