/**
 * Compute MPTokenIssuanceID from Issuer and Sequence
 * According to XLS-0033, MPTokenIssuanceID = SHA512Half(0x0049 || Issuer || Sequence)
 * 
 * Note: This is a placeholder implementation since we don't have access to the 
 * proper cryptographic functions in the browser. The actual computation should
 * be done by the XRPL node or stored when the token is created.
 * 
 * @param {string} issuer - The issuer's account address
 * @param {number} sequence - The issuance sequence number
 * @returns {string|null} The computed MPTokenIssuanceID (48 hex chars) or null
 */
export function computeMPTokenIssuanceID(issuer, sequence) {
    // This would require implementing SHA512-Half which is not readily available
    // in the browser without additional cryptographic libraries.
    // For now, return null and rely on other strategies.
    console.warn('MPTokenIssuanceID computation not implemented - requires SHA512-Half');
    return null;
}

/**
 * Extract MPTokenIssuanceID from various sources
 * Tries multiple strategies to find or compute the ID
 */
export function extractMPTokenIssuanceID(issuance, storedIssuances = {}) {
    // Strategy 1: Direct field access
    if (issuance.MPTokenIssuanceID && issuance.MPTokenIssuanceID.length === 48) {
        return issuance.MPTokenIssuanceID;
    }
    
    // Strategy 2: Alternative field names
    if (issuance.mpt_issuance_id && issuance.mpt_issuance_id.length === 48) {
        return issuance.mpt_issuance_id;
    }
    
    // Strategy 3: From stored session data
    if (issuance.Sequence !== undefined && storedIssuances[issuance.Sequence]) {
        const storedId = storedIssuances[issuance.Sequence].mptIssuanceId;
        if (storedId && storedId.length === 48) {
            return storedId;
        }
    }
    
    // Strategy 4: Compute from Issuer and Sequence
    if (issuance.Issuer && issuance.Sequence !== undefined) {
        const computed = computeMPTokenIssuanceID(issuance.Issuer, issuance.Sequence);
        if (computed) {
            console.log(`Computed MPTokenIssuanceID for sequence ${issuance.Sequence}: ${computed}`);
            return computed;
        }
    }
    
    // Strategy 5: Last resort - try index field
    // Note: This is not reliable and should only be used for debugging
    if (issuance.index && issuance.index.length >= 48) {
        console.warn('Using index field as last resort for MPTokenIssuanceID - this may be incorrect!');
        return issuance.index.substring(0, 48);
    }
    
    console.error('Could not determine MPTokenIssuanceID for issuance:', issuance);
    return null;
}