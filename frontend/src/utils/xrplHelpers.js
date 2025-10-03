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
 * For MPTokenIssuance objects, the 'index' field IS the MPTokenIssuanceID
 * @param {Object} issuanceObject - The issuance object from account_objects
 * @returns {string|null} The MPTokenIssuanceID or null if not found
 */
export function extractMPTokenIssuanceIDFromObject(issuanceObject) {
    // For MPTokenIssuance objects from account_objects, 
    // the 'index' field contains the MPTokenIssuanceID
    if (issuanceObject.index) {
        return issuanceObject.index;
    }
    
    // Fallback to other potential field names
    if (issuanceObject.MPTokenIssuanceID) {
        return issuanceObject.MPTokenIssuanceID;
    }
    
    if (issuanceObject.mpt_issuance_id) {
        return issuanceObject.mpt_issuance_id;
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