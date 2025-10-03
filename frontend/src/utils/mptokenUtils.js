import { extractMPTokenIssuanceIDFromObject } from './xrplHelpers';

/**
 * Extract MPTokenIssuanceID from various sources
 * Tries multiple strategies to find or compute the ID
 */
export function extractMPTokenIssuanceID(issuance, storedIssuances = {}) {
    // Strategy 1: Use the xrplHelpers extraction (handles index field properly)
    const extractedId = extractMPTokenIssuanceIDFromObject(issuance);
    if (extractedId) {
        return extractedId;
    }
    
    // Strategy 2: From stored session data
    if (issuance.Sequence !== undefined && storedIssuances[issuance.Sequence]) {
        const storedId = storedIssuances[issuance.Sequence].mptIssuanceId;
        if (storedId && storedId.length === 64) {
            return storedId;
        }
    }
    
    console.error('Could not determine MPTokenIssuanceID for issuance:', issuance);
    return null;
}