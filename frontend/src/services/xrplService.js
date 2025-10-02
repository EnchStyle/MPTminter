import * as xrpl from 'xrpl';

class XRPLService {
    constructor() {
        this.client = null;
        this.connectionStatus = 'disconnected';
        this.retryAttempts = 0;
        this.maxRetryAttempts = 3;
        this.mainnetUrl = import.meta.env.VITE_XRPL_MAINNET_URL || 'wss://xrplcluster.com';
        this.explorerUrl = import.meta.env.VITE_XRPL_EXPLORER_URL || 'https://livenet.xrpl.org';
    }

    async getClient() {
        if (this.client && this.client.isConnected()) {
            return this.client;
        }

        if (this.connectionStatus === 'connecting') {
            return new Promise((resolve, reject) => {
                const checkConnection = () => {
                    if (this.client && this.client.isConnected()) {
                        resolve(this.client);
                    } else if (this.connectionStatus === 'error') {
                        reject(new Error('Connection failed'));
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                checkConnection();
            });
        }

        this.connectionStatus = 'connecting';

        try {
            const newClient = new xrpl.Client(this.mainnetUrl);
            await newClient.connect();
            this.client = newClient;
            this.connectionStatus = 'connected';
            this.retryAttempts = 0;
            return newClient;
        } catch (err) {
            this.connectionStatus = 'error';
            console.error('XRPL connection failed:', err);

            if (this.retryAttempts < this.maxRetryAttempts) {
                this.retryAttempts++;
                await new Promise(resolve => setTimeout(resolve, 2000 * this.retryAttempts));
                return this.getClient();
            }

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

    getConnectionStatus() {
        return this.connectionStatus;
    }

    getExplorerUrl(txHash) {
        return `${this.explorerUrl}/transactions/${txHash}`;
    }
}

export const xrplService = new XRPLService();
export default XRPLService;