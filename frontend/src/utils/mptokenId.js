import { createHash } from 'crypto';
import { Buffer } from 'buffer';

/**
 * Decode an XRPL address to its account ID (20 bytes)
 * This is a simplified version - for production use xrpl.js decodeAccountID
 */
function decodeAccountID(address) {
    // For now, we'll use xrpl.js if available
    if (window.xrpl && window.xrpl.decodeAccountID) {
        return window.xrpl.decodeAccountID(address);
    }
    
    // Fallback: return null to indicate we can't decode
    console.warn('Cannot decode account ID without xrpl.js');
    return null;
}

/**
 * Convert a number to a Uint32 buffer (big-endian)
 */
function uint32ToBuffer(value) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value, false); // false = big-endian
    return new Uint8Array(buffer);
}

/**
 * Compute SHA512-Half (first 32 bytes of SHA512)
 */
function sha512Half(data) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Browser environment - use Web Crypto API
        return window.crypto.subtle.digest('SHA-512', data).then(hash => {
            return new Uint8Array(hash).slice(0, 32);
        });
    } else {
        // Node.js environment
        const hash = createHash('sha512');
        hash.update(Buffer.from(data));
        const fullHash = hash.digest();
        return Promise.resolve(fullHash.slice(0, 32));
    }
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

/**
 * Compute MPTokenIssuanceID from issuer address and sequence
 * According to XLS-0033: MPTokenIssuanceID = SHA512Half(0x0049 || Issuer || Sequence)
 * 
 * @param {string} issuerAddress - The issuer's account address
 * @param {number} sequence - The issuance sequence number
 * @returns {Promise<string|null>} The computed MPTokenIssuanceID (48 hex chars) or null
 */
export async function computeMPTokenIssuanceID(issuerAddress, sequence) {
    try {
        // Space type for MPTokenIssuance is 0x0049
        const spaceType = new Uint8Array([0x00, 0x49]);
        
        // Decode the issuer address to get the 20-byte account ID
        const issuerAccountID = decodeAccountID(issuerAddress);
        if (!issuerAccountID) {
            console.error('Failed to decode issuer address:', issuerAddress);
            return null;
        }
        
        // Convert sequence to 4-byte buffer (big-endian)
        const sequenceBuffer = uint32ToBuffer(sequence);
        
        // Concatenate: SpaceType (2) + Issuer (20) + Sequence (4) = 26 bytes
        const data = new Uint8Array(26);
        data.set(spaceType, 0);
        data.set(new Uint8Array(issuerAccountID), 2);
        data.set(sequenceBuffer, 22);
        
        // Compute SHA512-Half
        const hash = await sha512Half(data);
        
        // Convert to hex string (should be 64 chars for 32 bytes)
        const hexId = bytesToHex(hash);
        
        console.log(`Computed MPTokenIssuanceID for issuer ${issuerAddress}, sequence ${sequence}: ${hexId}`);
        
        return hexId;
    } catch (error) {
        console.error('Error computing MPTokenIssuanceID:', error);
        return null;
    }
}

/**
 * Extract the issuer and sequence from an MPTokenIssuance object
 */
export function extractIssuerAndSequence(issuance) {
    // The issuer might be in different fields depending on the response
    const issuer = issuance.Issuer || issuance.Account || issuance.issuer;
    
    // The sequence might be in different fields
    const sequence = issuance.Sequence !== undefined ? issuance.Sequence : 
                    issuance.sequence !== undefined ? issuance.sequence :
                    issuance.PreviousTxnLgrSeq; // Sometimes sequence is stored here
    
    return { issuer, sequence };
}

/**
 * Try to find the MPTokenIssuanceID from various sources
 */
export async function findMPTokenIssuanceID(issuance, storedIssuances = {}) {
    // Strategy 1: Direct field access
    if (issuance.MPTokenIssuanceID && issuance.MPTokenIssuanceID.length === 64) {
        return issuance.MPTokenIssuanceID;
    }
    
    // Strategy 2: Alternative field names
    if (issuance.mpt_issuance_id && issuance.mpt_issuance_id.length === 64) {
        return issuance.mpt_issuance_id;
    }
    
    // Strategy 3: From stored session data
    const { sequence } = extractIssuerAndSequence(issuance);
    if (sequence !== undefined && storedIssuances[sequence]) {
        const storedId = storedIssuances[sequence].mptIssuanceId;
        if (storedId && storedId.length === 64) {
            return storedId;
        }
    }
    
    // Strategy 4: Compute from Issuer and Sequence
    const { issuer } = extractIssuerAndSequence(issuance);
    if (issuer && sequence !== undefined) {
        const computed = await computeMPTokenIssuanceID(issuer, sequence);
        if (computed) {
            return computed;
        }
    }
    
    // Strategy 5: Use the index field if it looks like a valid ID
    // The index field is the object's key in the ledger, which for MPTokenIssuance
    // objects should be the MPTokenIssuanceID
    if (issuance.index && issuance.index.length === 64) {
        console.log('Using index field as MPTokenIssuanceID');
        return issuance.index;
    }
    
    console.error('Could not determine MPTokenIssuanceID for issuance:', issuance);
    return null;
}