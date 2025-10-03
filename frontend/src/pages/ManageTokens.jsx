import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Alert
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { sessionService } from '../services/sessionService';
import MPTokenManager from '../components/MPTokenManager';
import * as xrpl from 'xrpl';

const ManageTokens = () => {
    const [wallet, setWallet] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedData = sessionService.getWalletData();
        if (savedData && savedData.seed) {
            try {
                const wallet = xrpl.Wallet.fromSeed(savedData.seed);
                setWallet(wallet);
            } catch (error) {
                // Silent fail - user will be prompted to connect wallet
            }
        }
    }, []);

    if (!wallet) {
        return (
            <Container maxWidth="md">
                <Box sx={{ mt: 4 }}>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Please connect your wallet first by creating or resuming a token session.
                    </Alert>
                    <Button 
                        variant="contained" 
                        startIcon={<AddCircleIcon />}
                        onClick={() => navigate('/')}
                    >
                        Create Token
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Manage Tokens
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    View and manage all your MPT tokens and issuances
                </Typography>
            </Box>

            <MPTokenManager 
                wallet={wallet}
                isStandalone={true}
            />
        </Container>
    );
};

export default ManageTokens;