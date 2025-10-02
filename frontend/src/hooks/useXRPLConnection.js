import { useState, useCallback, useEffect } from 'react';
import { xrplService } from '../services/xrplService';

export function useXRPLConnection() {
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [retryCount, setRetryCount] = useState(0);

    const connect = useCallback(async () => {
        try {
            setConnectionStatus('connecting');
            await xrplService.getClient();
            setConnectionStatus('connected');
            setRetryCount(0);
        } catch (error) {
            setConnectionStatus('error');
            setRetryCount(prev => prev + 1);
            throw error;
        }
    }, []);

    const disconnect = useCallback(async () => {
        await xrplService.disconnect();
        setConnectionStatus('disconnected');
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setConnectionStatus(xrplService.getConnectionStatus());
        }, 1000);

        return () => {
            clearInterval(interval);
            disconnect();
        };
    }, [disconnect]);

    return { connectionStatus, retryCount, connect, disconnect };
}