import { useState, useCallback, useEffect } from 'react';
import { sessionService } from '../services/sessionService';

export function useSession() {
    const [resumeData, setResumeData] = useState(null);

    useEffect(() => {
        const saved = sessionService.loadSession();
        if (saved) {
            setResumeData(saved);
        }
    }, []);

    const saveSession = useCallback((data) => {
        sessionService.saveSession(data);
    }, []);

    const clearSession = useCallback(() => {
        sessionService.clearSession();
        setResumeData(null);
    }, []);

    return { resumeData, saveSession, clearSession };
}