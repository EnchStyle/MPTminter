import * as xrpl from 'xrpl';

class XRPLService {
    constructor() {
        this.client = null;
        this.connectionStatus = 'disconnected';
        this.retryAttempts = 0;
        this.maxRetryAttempts = 3;
        this.mainnetUrl = import.meta.env.VITE_XRPL_MAINNET_URL || 'wss://xrplcluster.com';
        this.explorerUrl = import.meta.env.VITE_XRPL_EXPLORER_URL || 'https://livenet.xrpl.org';
        this.connectionPromise = null; // Track ongoing connection attempts
    }

    async getClient() {
        if (this.client && this.client.isConnected()) {
            return this.client;
        }

        // If a connection is already in progress, wait for it
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        // Create a new connection promise
        this.connectionPromise = this._createConnection();
        
        try {
            const client = await this.connectionPromise;
            return client;
        } catch (err) {
            // Clear the promise on error
            this.connectionPromise = null;
            throw err;
        }
    }

    async _createConnection() {
        this.connectionStatus = 'connecting';
        
        try {
            const newClient = new xrpl.Client(this.mainnetUrl);
            
            // Set a connection timeout
            const connectionTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout')), 10000);
            });
            
            await Promise.race([
                newClient.connect(),
                connectionTimeout
            ]);
            
            this.client = newClient;
            this.connectionStatus = 'connected';
            this.retryAttempts = 0;
            this.connectionPromise = null; // Clear promise on success
            
            return newClient;
        } catch (err) {
            this.connectionStatus = 'error';
            console.error('XRPL connection failed:', err);
            
            if (this.retryAttempts < this.maxRetryAttempts) {
                this.retryAttempts++;
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryAttempts));
                this.connectionPromise = null; // Clear before retry
                return this.getClient();
            }
            
            this.connectionPromise = null; // Clear on final failure
            throw new Error(`Failed to connect after ${this.maxRetryAttempts} attempts: ${err.message}`);
        }
    }

    async disconnect() {
        if (this.client && this.client.isConnected()) {
            try {
                await this.client.disconnect();
            } catch (err) {
                console.warn('Error disconnecting client:', err);
            }
        }
        this.client = null;
        this.connectionStatus = 'disconnected';
        this.retryAttempts = 0; // Reset retry attempts on disconnect
        this.connectionPromise = null; // Clear any pending connection promise
    }

    async getAccountInfo(address) {
        const client = await this.getClient();
        const response = await client.request({
            command: 'account_info',
            account: address,
            ledger_index: 'validated'
        });
        return response.result.account_data;
    }

    async submitTransaction(tx, wallet) {
        const client = await this.getClient();
        const prepared = await client.autofill(tx);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);
        return result;
    }

    async checkMPTAuthorization(holderAddress, mptIssuanceId) {
        const client = await this.getClient();
        try {
            const objects = await client.request({
                command: 'account_objects',
                account: holderAddress,
                type: 'MPToken'
            });
            return objects.result.account_objects.some(
                obj => obj.MPTokenIssuanceID === mptIssuanceId
            );
        } catch (e) {
            return false;
        }
    }
    
    async getAllMPTokens(address) {
        const client = await this.getClient();
        try {
            const response = await client.request({
                command: 'account_objects',
                account: address,
                type: 'MPToken'
            });
            return response.result.account_objects || [];
        } catch (e) {
            console.error('Error fetching MPTokens:', e);
            return [];
        }
    }
    
    async getMPTokenIssuances(issuerAddress) {
        const client = await this.getClient();
        try {
            const response = await client.request({
                command: 'account_objects',
                account: issuerAddress,
                type: 'MPTokenIssuance'
            });
            return response.result.account_objects || [];
        } catch (e) {
            console.error('Error fetching MPTokenIssuances:', e);
            return [];
        }
    }

    async getMPTokenHolders(mptIssuanceId) {
        // For now, return empty array to allow destroy attempts
        // The XRPL will reject the transaction if there are actual holders
        // TODO: Implement proper holder checking when API supports it
        return [];
    }

    getConnectionStatus() {
        return this.connectionStatus;
    }

    getExplorerUrl(txHash) {
        return `${this.explorerUrl}/transactions/${txHash}`;
    }
}

export const xrplService = new XRPLService();
export default XRPLService;