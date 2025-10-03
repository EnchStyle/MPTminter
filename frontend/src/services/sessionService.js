class SessionService {
    constructor() {
        this.storageKey = 'mpt-creator-session';
        this.walletKey = 'mpt-wallet-data';
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
        localStorage.removeItem(this.walletKey);
    }

    saveWalletData(walletData) {
        try {
            localStorage.setItem(this.walletKey, JSON.stringify(walletData));
        } catch (err) {
            console.warn('Failed to save wallet data:', err);
        }
    }

    getWalletData() {
        try {
            const saved = localStorage.getItem(this.walletKey);
            return saved ? JSON.parse(saved) : null;
        } catch (err) {
            console.warn('Failed to load wallet data:', err);
            return null;
        }
    }
    
    // Store token issuance IDs mapped to their sequence numbers
    saveTokenIssuance(issuerAddress, sequence, mptIssuanceId) {
        try {
            const key = `mpt-issuances-${issuerAddress}`;
            const saved = localStorage.getItem(key);
            const issuances = saved ? JSON.parse(saved) : {};
            
            issuances[sequence] = {
                mptIssuanceId,
                timestamp: Date.now()
            };
            
            localStorage.setItem(key, JSON.stringify(issuances));
        } catch (err) {
            console.warn('Failed to save token issuance:', err);
        }
    }
    
    getTokenIssuances(issuerAddress) {
        try {
            const key = `mpt-issuances-${issuerAddress}`;
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : {};
        } catch (err) {
            console.warn('Failed to load token issuances:', err);
            return {};
        }
    }
}

export const sessionService = new SessionService();
export default SessionService;