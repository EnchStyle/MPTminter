import React, { useCallback } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Grid
} from '@mui/material';

const TokenInfoStep = React.memo(({ 
    formData, 
    setFormData, 
    validateField, 
    errors 
}) => {
    const handleFieldChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        validateField(field, value);
    }, [setFormData, validateField]);

    const handleCurrencyCodeChange = useCallback((e) => {
        const value = e.target.value.toUpperCase();
        setFormData(prev => ({ ...prev, currencyCode: value }));
        validateField('currencyCode', value);
    }, [setFormData, validateField]);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Token Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Define your token's basic properties and identification.
                </Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Token Symbol *"
                            value={formData.currencyCode}
                            onChange={handleCurrencyCodeChange}
                            error={!!errors.currencyCode}
                            helperText={errors.currencyCode || "3-20 characters (like USD, GOLD, MYTOKEN, VERYLONGTOKEN)"}
                            placeholder="MYTOKEN"
                            inputProps={{ maxLength: 20 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Token Name *"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            error={!!errors.name}
                            helperText={errors.name || "A descriptive name for your token"}
                            placeholder="My Awesome Token"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Token Description"
                            value={formData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            error={!!errors.description}
                            helperText={errors.description || "Describe your token's purpose and utility"}
                            placeholder="A revolutionary token for..."
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
});

export default TokenInfoStep;