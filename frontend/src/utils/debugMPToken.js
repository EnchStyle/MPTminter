/**
 * Debug utilities for MPToken operations
 */

/**
 * Debug log an MPTokenIssuance object to understand its structure
 * @param {Object} issuance - The issuance object to debug
 * @param {string} source - Where this object came from (e.g., "account_objects", "transaction")
 */
export function debugMPTokenIssuance(issuance, source = 'unknown') {
    console.group(`MPTokenIssuance Debug (${source})`);
    console.log('Full object:', issuance);
    console.log('Object keys:', Object.keys(issuance));
    
    // Check potential ID fields
    const potentialIdFields = [
        'index',
        'MPTokenIssuanceID', 
        'mpt_issuance_id',
        'ID',
        'id'
    ];
    
    console.log('Checking potential ID fields:');
    potentialIdFields.forEach(field => {
        if (issuance[field]) {
            console.log(`  ${field}: ${issuance[field]} (length: ${issuance[field].length})`);
        }
    });
    
    // Specifically log mpt_issuance_id and index for debugging
    if (issuance.mpt_issuance_id) {
        console.log('FOUND mpt_issuance_id:', issuance.mpt_issuance_id);
    }
    if (issuance.index) {
        console.log('FOUND index:', issuance.index);
    }
    
    // Check other important fields
    console.log('Other important fields:');
    ['Issuer', 'Sequence', 'AssetScale', 'MaximumAmount', 'OutstandingAmount', 'Flags'].forEach(field => {
        if (issuance[field] !== undefined) {
            console.log(`  ${field}:`, issuance[field]);
        }
    });
    
    // Specifically highlight OutstandingAmount
    if (issuance.OutstandingAmount !== undefined) {
        console.log(`  *** OutstandingAmount: ${issuance.OutstandingAmount} ***`);
    }
    
    console.groupEnd();
}

// Alias for backward compatibility
export const debugIssuanceObject = debugMPTokenIssuance;

/**
 * Debug log a transaction result to find MPTokenIssuanceID
 * @param {Object} txResult - The transaction result to debug
 */
export function debugTransactionResult(txResult) {
    console.group('Transaction Result Debug');
    console.log('Full result:', txResult);
    
    if (txResult.meta) {
        console.log('Meta fields:', Object.keys(txResult.meta));
        
        if (txResult.meta.mpt_issuance_id) {
            console.log('Found mpt_issuance_id:', txResult.meta.mpt_issuance_id);
        }
        
        if (txResult.meta.CreatedNodes) {
            console.log('CreatedNodes:', txResult.meta.CreatedNodes);
            txResult.meta.CreatedNodes.forEach((node, index) => {
                if (node.CreatedNode?.LedgerEntryType === 'MPTokenIssuance') {
                    console.log(`MPTokenIssuance CreatedNode[${index}]:`, node.CreatedNode);
                    console.log(`  index (MPTokenIssuanceID): ${node.CreatedNode.index}`);
                    console.log(`  NewFields:`, node.CreatedNode.NewFields);
                }
            });
        }
    }
    
    console.groupEnd();
}