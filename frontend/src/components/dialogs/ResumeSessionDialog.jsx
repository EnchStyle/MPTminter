import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Alert,
    Box
} from '@mui/material';

function ResumeSessionDialog({ open, onResume, onStartFresh }) {
    return (
        <Dialog open={open} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <span>📋</span>
                    Resume Previous Session?
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Found saved progress from a previous session. Would you like to resume where you left off or start fresh?
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Note:</strong> You'll need to reconnect your wallet after resuming. Your progress and form data will be restored.
                    </Typography>
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onStartFresh} color="inherit">
                    Start Fresh
                </Button>
                <Button onClick={onResume} variant="contained">
                    Resume & Reconnect
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ResumeSessionDialog;