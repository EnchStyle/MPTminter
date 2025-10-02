import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Alert,
    AlertTitle,
    List,
    ListItem,
    ListItemText,
    Chip,
    Button,
    CircularProgress
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const ReviewStep = React.memo(({
    formData,
    wallet,
    onCreateToken,
    loading
}) => {
    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>🔴 Ready to create on the LIVE network</AlertTitle>
                <Typography variant="body2">
                    Double-check everything below. Most settings are permanent!
                </Typography>
            </Alert>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Token Details</Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="Symbol" secondary={formData.currencyCode} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Name" secondary={formData.name} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Description" 
                                        secondary={formData.description.substring(0, 100) + (formData.description.length > 100 ? '...' : '')} 
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Settings</Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="Decimals" secondary={formData.assetScale} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Max Supply" 
                                        secondary={formData.maxAmount || 'Unlimited'} 
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Trading Fee" 
                                        secondary={`${(parseInt(formData.transferFee) / 1000).toFixed(3)}%`} 
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Features Enabled</Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {formData.canLock && <Chip label="🔒 Lock" size="small" />}
                                {formData.requireAuth && <Chip label="✅ Auth" size="small" />}
                                {formData.canFreeze && <Chip label="❄️ Freeze" size="small" />}
                                {formData.canClawback && <Chip label="↩️ Clawback" size="small" />}
                                {!formData.canLock && !formData.requireAuth && !formData.canFreeze && !formData.canClawback && (
                                    <Typography variant="body2" color="text.secondary">
                                        No additional capabilities
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {formData.assetClass && (
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Metadata</Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Asset Class" 
                                            secondary={formData.assetClass} 
                                        />
                                    </ListItem>
                                    {formData.iconUrl && (
                                        <ListItem>
                                            <ListItemText 
                                                primary="Icon URL" 
                                                secondary={formData.iconUrl} 
                                            />
                                        </ListItem>
                                    )}
                                    {formData.weblinks.length > 0 && (
                                        <ListItem>
                                            <ListItemText 
                                                primary="Web Links" 
                                                secondary={`${formData.weblinks.length} links configured`} 
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={onCreateToken}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                    sx={{ minWidth: 200 }}
                >
                    {loading ? 'Creating Your Token...' : '✓ Create My Token'}
                </Button>
            </Box>
        </Box>
    );
});

export default ReviewStep;