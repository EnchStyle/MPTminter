import * as xrpl from 'xrpl';

/**
 * Extract MPTokenIssuanceID from transaction result
 * Tries multiple locations where the ID might be stored
 */
export function extractMPTokenIssuanceIDFromTx(txResult) {
    if (!txResult?.meta) return null;
    
    // Try direct field
    if (txResult.meta.mpt_issuance_id) {
        return txResult.meta.mpt_issuance_id;
    }
    
    // Look in CreatedNodes for MPTokenIssuance
    if (txResult.meta.CreatedNodes) {
        for (const node of txResult.meta.CreatedNodes) {
            if (node.CreatedNode?.LedgerEntryType === 'MPTokenIssuance') {
                // The index of the created node IS the MPTokenIssuanceID
                if (node.CreatedNode.index && node.CreatedNode.index.length === 64) {
                    return node.CreatedNode.index;
                }
                
                // Also check in fields
                const id = node.CreatedNode.NewFields?.MPTokenIssuanceID ||
                          node.CreatedNode.FinalFields?.MPTokenIssuanceID;
                if (id && id.length === 64) {
                    return id;
                }
            }
        }
    }
    
    return null;
}

/**
 * Extract MPTokenIssuanceID from account_objects response
 * For MPTokenIssuance objects, the index field is the MPTokenIssuanceID
 */
export function extractMPTokenIssuanceIDFromObject(issuanceObject) {
    // Direct field (unlikely but check first)
    if (issuanceObject.MPTokenIssuanceID && issuanceObject.MPTokenIssuanceID.length === 64) {
        return issuanceObject.MPTokenIssuanceID;
    }
    
    // The index field for MPTokenIssuance objects IS the MPTokenIssuanceID
    if (issuanceObject.index && issuanceObject.index.length === 64) {
        return issuanceObject.index;
    }
    
    return null;
}

/**
 * Decode an address to account ID using xrpl.js
 */
export function decodeAccountID(address) {
    try {
        return xrpl.decodeAccountID(address);
    } catch (error) {
        console.error('Failed to decode account ID:', error);
        return null;
    }
}

/**
 * Compute MPTokenIssuanceID using xrpl.js utilities
 * MPTokenIssuanceID = SHA512Half(0x0049 || AccountID || Sequence)
 */
export async function computeMPTokenIssuanceID(issuerAddress, sequence) {
    try {
        // Get the 20-byte account ID from the address
        const accountID = decodeAccountID(issuerAddress);
        if (!accountID) {
            throw new Error('Failed to decode issuer address');
        }
        
        // Create the buffer: SpaceType (2) + AccountID (20) + Sequence (4)
        const buffer = Buffer.allocUnsafe(26);
        
        // Space type for MPTokenIssuance is 0x0049
        buffer.writeUInt16BE(0x0049, 0);
        
        // Write account ID (20 bytes)
        Buffer.from(accountID).copy(buffer, 2);
        
        // Write sequence as 32-bit big-endian
        buffer.writeUInt32BE(sequence, 22);
        
        // Compute SHA512-Half using xrpl.js
        // Note: xrpl.js v4+ should have hashing utilities
        if (xrpl.utils && xrpl.utils.sha512Half) {
            const hash = xrpl.utils.sha512Half(buffer);
            return hash.toString('hex').toUpperCase();
        } else {
            // Fallback for older versions
            console.warn('SHA512-Half not available in xrpl.js, using fallback');
            // For browser, we'd need to use Web Crypto API
            if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
                const hashBuffer = await window.crypto.subtle.digest('SHA-512', buffer);
                const hashArray = new Uint8Array(hashBuffer);
                const halfHash = hashArray.slice(0, 32);
                return Array.from(halfHash)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')
                    .toUpperCase();
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error computing MPTokenIssuanceID:', error);
        return null;
    }
}