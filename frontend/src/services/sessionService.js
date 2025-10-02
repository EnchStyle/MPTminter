class SessionService {
    constructor() {
        this.storageKey = 'mpt-creator-session';
        this.maxAge = parseInt(import.meta.env.VITE_SESSION_MAX_AGE) || 3600000; // 1 hour
    }

    saveSession(data) {
        try {
            const sessionData = {
                ...data,
                timestamp: Date.now(),
                netlifyDeployment: true
            };

            const dataString = JSON.stringify(sessionData);
            if (dataString.length > 5000) {
                console.warn('Session data is large, consider reducing stored data');
            }

            localStorage.setItem(this.storageKey, dataString);
        } catch (err) {
            console.warn('Failed to save session state:', err);
        }
    }

    loadSession() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                if (Date.now() - data.timestamp < this.maxAge) {
                    return data;
                } else {
                    this.clearSession();
                }
            }
        } catch (err) {
            console.warn('Failed to load session state:', err);
            this.clearSession();
        }
        return null;
    }

    clearSession() {
        localStorage.removeItem(this.storageKey);
    }
}

export const sessionService = new SessionService();
export default SessionService;