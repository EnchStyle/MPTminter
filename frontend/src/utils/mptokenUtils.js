import { extractMPTokenIssuanceIDFromObject } from './xrplHelpers';
import { debugIssuanceObject } from './debugMPToken';

/**
 * Extract MPTokenIssuanceID from various sources
 * Tries multiple strategies to find or compute the ID
 */
export function extractMPTokenIssuanceID(issuance, storedIssuances = {}) {
    // Debug the issuance object to understand its structure
    debugIssuanceObject(issuance, 'extractMPTokenIssuanceID');
    
    // Strategy 1: Use the xrplHelpers extraction (handles index field properly)
    const extractedId = extractMPTokenIssuanceIDFromObject(issuance);
    if (extractedId) {
        console.log(`Extracted MPTokenIssuanceID: ${extractedId} (length: ${extractedId.length})`);
        return extractedId;
    }
    
    // Strategy 2: From stored session data
    if (issuance.Sequence !== undefined && storedIssuances[issuance.Sequence]) {
        const storedId = storedIssuances[issuance.Sequence].mptIssuanceId;
        if (storedId) {
            console.log(`Retrieved MPTokenIssuanceID from session for sequence ${issuance.Sequence}: ${storedId} (length: ${storedId.length})`);
            return storedId;
        }
    }
    
    console.error('Could not determine MPTokenIssuanceID for issuance:', issuance);
    return null;
}