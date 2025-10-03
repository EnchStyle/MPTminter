/**
 * XRPL Helper functions for MPToken operations
 */

/**
 * Extract MPTokenIssuanceID from a transaction result
 * @param {Object} txResult - The transaction result from XRPL
 * @returns {string|null} The MPTokenIssuanceID or null if not found
 */
export function extractMPTokenIssuanceIDFromTx(txResult) {
    if (!txResult?.meta) return null;
    
    // Method 1: Check meta.mpt_issuance_id
    if (txResult.meta.mpt_issuance_id) {
        console.log('Found MPTokenIssuanceID in meta.mpt_issuance_id:', txResult.meta.mpt_issuance_id);
        return txResult.meta.mpt_issuance_id;
    }
    
    // Method 2: Check CreatedNodes for MPTokenIssuance
    if (txResult.meta.CreatedNodes) {
        for (const node of txResult.meta.CreatedNodes) {
            if (node.CreatedNode?.LedgerEntryType === 'MPTokenIssuance') {
                // The index field of the created node IS the MPTokenIssuanceID
                const id = node.CreatedNode.index;
                if (id) {
                    console.log('Found MPTokenIssuanceID in CreatedNode.index:', id);
                    return id;
                }
            }
        }
    }
    
    return null;
}

/**
 * Extract MPTokenIssuanceID from an account_objects response
 * @param {Object} issuanceObject - The issuance object from account_objects
 * @returns {string|null} The MPTokenIssuanceID or null if not found
 */
export function extractMPTokenIssuanceIDFromObject(issuanceObject) {
    // Check for mpt_issuance_id first (this is what XRPL returns in account_objects)
    if (issuanceObject.mpt_issuance_id) {
        console.log('Found mpt_issuance_id:', issuanceObject.mpt_issuance_id);
        return issuanceObject.mpt_issuance_id;
    }
    
    // Check for MPTokenIssuanceID (alternative field name)
    if (issuanceObject.MPTokenIssuanceID) {
        return issuanceObject.MPTokenIssuanceID;
    }
    
    // For some responses, the index field might contain the ID
    // But based on the console output, this doesn't seem to be the case
    if (issuanceObject.index && issuanceObject.index.length === 64) {
        console.log('Using index as MPTokenIssuanceID:', issuanceObject.index);
        return issuanceObject.index;
    }
    
    return null;
}

/**
 * Validate MPTokenIssuanceID format
 * MPTokenIssuanceID can be either 48 or 64 hex characters
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid format
 */
export function isValidMPTokenIssuanceID(id) {
    if (!id || typeof id !== 'string') return false;
    // MPTokenIssuanceID can be 48 or 64 hex chars
    return /^[0-9A-Fa-f]{48}$/.test(id) || /^[0-9A-Fa-f]{64}$/.test(id);
}