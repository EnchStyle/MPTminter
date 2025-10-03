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
                // Silent fail on disconnect error
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
        console.log('Submitting transaction:', tx);
        const client = await this.getClient();
        
        try {
            // Log the transaction before autofill
            console.log('Pre-autofill transaction:', JSON.stringify(tx, null, 2));
            
            const prepared = await client.autofill(tx);
            console.log('Autofilled transaction:', JSON.stringify(prepared, null, 2));
            
            const signed = wallet.sign(prepared);
            console.log('Transaction signed, hash:', signed.hash || 'N/A');
            console.log('Signed transaction details:', {
                tx_blob: signed.tx_blob.substring(0, 50) + '...',
                hash: signed.hash,
                tx_id: signed.tx_id
            });
            
            // First try to submit
            console.log('Submitting to XRPL...');
            const submitResult = await client.submit(signed.tx_blob);
            console.log('Submit result:', submitResult);
            
            if (submitResult.result.engine_result !== 'tesSUCCESS' && 
                submitResult.result.engine_result !== 'terQUEUED') {
                // Log the error details
                console.error('Transaction failed:', {
                    engine_result: submitResult.result.engine_result,
                    engine_result_code: submitResult.result.engine_result_code,
                    engine_result_message: submitResult.result.engine_result_message,
                    tx_json: submitResult.result.tx_json
                });
                
                // Return the failed transaction details
                const error = new Error(submitResult.result.engine_result_message || submitResult.result.engine_result);
                error.data = {
                    error: submitResult.result.engine_result,
                    error_code: submitResult.result.engine_result_code,
                    error_message: submitResult.result.engine_result_message,
                    request: tx,
                    tx_json: submitResult.result.tx_json
                };
                error.txHash = submitResult.result.tx_json?.hash;
                
                throw error;
            }
            
            // If submitted successfully, wait for validation
            console.log('Transaction submitted successfully, waiting for validation...');
            console.log('Submit result details:', {
                engine_result: submitResult.result.engine_result,
                tx_json: submitResult.result.tx_json,
                hash: submitResult.result.tx_json?.hash || signed.tx_id
            });
            
            try {
                // Use request to check transaction status
                const txHash = submitResult.result.tx_json?.hash || signed.tx_id;
                if (!txHash) {
                    console.warn('No transaction hash available, returning submit result');
                    return submitResult;
                }
                
                // Wait a bit for the transaction to be processed
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Check transaction status
                const txResponse = await client.request({
                    command: 'tx',
                    transaction: txHash
                });
                
                console.log('Transaction lookup result:', txResponse);
                
                // Return the transaction response in expected format
                return {
                    result: {
                        ...txResponse.result,
                        validated: txResponse.result.validated || false,
                        meta: txResponse.result.meta,
                        hash: txHash
                    }
                };
            } catch (waitError) {
                console.warn('Transaction lookup failed:', waitError);
                // If lookup fails, check the submit result
                if (submitResult.result.engine_result === 'tesSUCCESS') {
                    // Transaction was submitted successfully, assume it will validate
                    const txHash = submitResult.result.tx_json?.hash || signed.hash || signed.tx_id;
                    console.log('Transaction submitted with tesSUCCESS, hash:', txHash);
                    return {
                        result: {
                            validated: true,
                            engine_result: submitResult.result.engine_result,
                            tx_json: submitResult.result.tx_json,
                            hash: txHash
                        }
                    };
                }
                // Otherwise return the original submit result
                return submitResult;
            }
        } catch (error) {
            console.error('Transaction submission error:', error);
            
            // Ensure error has proper structure
            if (!error.data && error.message) {
                error.data = {
                    error: error.code || 'UNKNOWN_ERROR',
                    error_message: error.message,
                    request: tx
                };
            }
            
            throw error;
        }
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
            return [];
        }
    }
    
    async getMPTokenIssuances(issuerAddress) {
        const client = await this.getClient();
        try {
            let allObjects = [];
            let marker = undefined;
            
            // Fetch all pages of results
            do {
                const response = await client.request({
                    command: 'account_objects',
                    account: issuerAddress,
                    type: 'MPTokenIssuance',
                    limit: 400,  // Maximum allowed per request
                    marker: marker
                });
                
                console.log(`Fetched page with ${response.result.account_objects?.length || 0} objects`);
                if (response.result.marker) {
                    console.log('More results available, fetching next page...');
                }
                
                if (response.result.account_objects) {
                    allObjects = allObjects.concat(response.result.account_objects);
                }
                
                marker = response.result.marker;
            } while (marker);
            
            console.log(`Total objects fetched across all pages: ${allObjects.length}`);
            
            // Import debug utility at runtime to avoid circular dependencies
            const { debugMPTokenIssuance } = await import('../utils/debugMPToken.js');
            
            // Log ALL tokens with their outstanding amounts
            if (allObjects.length > 0) {
                console.log('ALL MPTokenIssuance objects:');
                allObjects.forEach((obj, idx) => {
                    console.log(`Token ${idx + 1}: OutstandingAmount = ${obj.OutstandingAmount || '0'}, Sequence = ${obj.Sequence}`);
                });
                
                console.log('MPTokenIssuance objects from account_objects:', allObjects);
                // Debug the first issuance in detail
                debugMPTokenIssuance(allObjects[0], 'First MPTokenIssuance');
            }
            
            return allObjects;
        } catch (e) {
            console.error('Error fetching MPTokenIssuances:', e);
            return [];
        }
    }

    async getMPTokenHolders() {
        // Note: XRPL doesn't provide a direct API to get all holders of an MPToken.
        // The destroy transaction will fail with tecHAS_OBLIGATIONS if holders exist.
        // This limitation is by design to prevent enumerating all token holders.
        // 
        // Future consideration: When holder enumeration becomes available, update this method.
        // For now, we return an empty array and let the XRPL validate the destroy operation.
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