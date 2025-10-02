import React from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Box,
    Alert,
    Chip
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ConstructionIcon from '@mui/icons-material/Construction';

const DexOrders = () => {
    return (
        <Container maxWidth="md">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    DEX Orders
                    <Chip 
                        label="Coming Soon" 
                        color="primary" 
                        size="small"
                        sx={{ ml: 2, verticalAlign: 'middle' }}
                    />
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Create and manage decentralized exchange orders for MPT tokens
                </Typography>
            </Box>

            <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <ConstructionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Under Construction
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        DEX order functionality for MPT tokens is coming soon!
                    </Typography>
                    <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto' }}>
                        This feature will allow you to create buy and sell orders for MPT tokens
                        on the XRP Ledger's decentralized exchange.
                    </Alert>
                </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Planned Features
                        </Typography>
                        <Box component="ul" sx={{ mt: 2 }}>
                            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                Create buy/sell orders for MPT tokens
                            </Typography>
                            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                View order book for MPT/XRP pairs
                            </Typography>
                            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                Manage active orders
                            </Typography>
                            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                View trade history
                            </Typography>
                            <Typography component="li" variant="body2">
                                Advanced order types (limit, market)
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default DexOrders;