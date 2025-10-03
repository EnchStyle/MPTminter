/**
 * Debug utility to help understand MPTokenIssuance object structure
 * and extract the correct MPTokenIssuanceID
 */

export function debugMPTokenIssuance(issuance, label = 'MPTokenIssuance') {
    console.group(`🔍 Debugging ${label}`);
    
    // Log the entire object
    console.log('Full object:', issuance);
    
    // Log all keys
    console.log('Object keys:', Object.keys(issuance));
    
    // Check specific fields
    const fieldsToCheck = [
        'index',
        'MPTokenIssuanceID',
        'mpt_issuance_id',
        'Issuer',
        'Account',
        'Sequence',
        'AssetScale',
        'MaximumAmount',
        'OutstandingAmount',
        'LockedAmount',
        'TransferFee',
        'Flags',
        'MPTokenMetadata',
        'LedgerEntryType',
        'PreviousTxnID',
        'PreviousTxnLgrSeq'
    ];
    
    console.log('Field analysis:');
    fieldsToCheck.forEach(field => {
        if (issuance[field] !== undefined) {
            const value = issuance[field];
            const type = typeof value;
            const length = type === 'string' ? value.length : 'N/A';
            console.log(`  ${field}: ${value} (type: ${type}, length: ${length})`);
        }
    });
    
    // Analyze potential ID fields
    console.log('\nPotential ID fields:');
    
    // Check index field
    if (issuance.index) {
        console.log(`  index: ${issuance.index} (length: ${issuance.index.length})`);
        if (issuance.index.length === 64) {
            console.log('  ✅ index appears to be a valid MPTokenIssuanceID (64 chars)');
        } else {
            console.log(`  ❌ index has wrong length for MPTokenIssuanceID`);
        }
    }
    
    // Check MPTokenIssuanceID field
    if (issuance.MPTokenIssuanceID) {
        console.log(`  MPTokenIssuanceID: ${issuance.MPTokenIssuanceID} (length: ${issuance.MPTokenIssuanceID.length})`);
        if (issuance.MPTokenIssuanceID.length === 64) {
            console.log('  ✅ MPTokenIssuanceID appears valid (64 chars)');
        } else {
            console.log(`  ❌ MPTokenIssuanceID has wrong length`);
        }
    }
    
    // Recommendation
    console.log('\n📌 Recommendation:');
    if (issuance.index && issuance.index.length === 64) {
        console.log('Use the index field as MPTokenIssuanceID');
        console.log(`MPTokenIssuanceID = ${issuance.index}`);
    } else if (issuance.MPTokenIssuanceID && issuance.MPTokenIssuanceID.length === 64) {
        console.log('Use the MPTokenIssuanceID field');
        console.log(`MPTokenIssuanceID = ${issuance.MPTokenIssuanceID}`);
    } else {
        console.log('❌ Could not find a valid MPTokenIssuanceID');
        console.log('The object may be missing required fields or have an unexpected structure');
    }
    
    console.groupEnd();
}

/**
 * Debug transaction result from MPTokenIssuanceCreate
 */
export function debugMPTokenCreationResult(result) {
    console.group('🔍 Debugging MPTokenIssuanceCreate Result');
    
    console.log('Transaction result:', result);
    
    if (result.result) {
        console.log('Result validated:', result.result.validated);
        console.log('Transaction hash:', result.result.hash);
        
        if (result.result.meta) {
            console.log('\nTransaction meta:', result.result.meta);
            
            // Check direct field
            if (result.result.meta.mpt_issuance_id) {
                console.log('✅ Found mpt_issuance_id in meta:', result.result.meta.mpt_issuance_id);
            }
            
            // Check CreatedNodes
            if (result.result.meta.CreatedNodes) {
                console.log('\nCreatedNodes:', result.result.meta.CreatedNodes.length, 'nodes');
                
                result.result.meta.CreatedNodes.forEach((node, idx) => {
                    if (node.CreatedNode) {
                        console.log(`\nCreatedNode[${idx}]:`);
                        console.log('  LedgerEntryType:', node.CreatedNode.LedgerEntryType);
                        
                        if (node.CreatedNode.LedgerEntryType === 'MPTokenIssuance') {
                            console.log('  ✅ Found MPTokenIssuance node!');
                            console.log('  index:', node.CreatedNode.index);
                            if (node.CreatedNode.index && node.CreatedNode.index.length === 64) {
                                console.log('  ✅ index is valid MPTokenIssuanceID (64 chars)');
                            }
                            console.log('  NewFields:', node.CreatedNode.NewFields);
                            console.log('  FinalFields:', node.CreatedNode.FinalFields);
                        }
                    }
                });
            }
        }
    }
    
    console.groupEnd();
}