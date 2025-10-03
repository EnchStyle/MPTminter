import React from 'react';

/**
 * Shared error handler for XRPL transactions
 * Provides consistent error messages across the application
 */

export const getErrorMessage = (error) => {
    // Check for XRPL-specific error codes
    if (error.data?.error === 'tecNO_ENTRY') {
        return 'Token not found. It may have been already destroyed.';
    }
    
    if (error.data?.error === 'tecHAS_OBLIGATIONS') {
        return 'Cannot destroy token: There are still token holders.';
    }
    
    if (error.data?.error === 'tecNO_PERMISSION') {
        // Check if this is a clawback operation
        if (error.data?.request?.TransactionType === 'Clawback') {
            // Check if this is an MPT clawback attempt
            if (error.data?.request?.Amount?.mpt_issuance_id) {
                return 'MPT Clawback Error: The Clawback transaction type is only for IOUs (issued currencies), not MPTs. MPT clawback may require a different implementation method.';
            }
            return 'Cannot clawback: Either the token does not have clawback enabled or you are not the issuer.';
        }
        return 'Permission denied: You are not authorized to perform this operation.';
    }
    
    if (error.data?.error === 'tecINSUFFICIENT_RESERVE') {
        return 'Insufficient XRP reserve. Please add more XRP to your wallet.';
    }
    
    if (error.data?.error === 'tecUNFUNDED_PAYMENT') {
        return 'Insufficient token balance for this operation.';
    }
    
    if (error.data?.error === 'tefMAX_LEDGER') {
        return 'Transaction expired. Please try again.';
    }
    
    // Handle network connectivity issues
    if (error.message?.includes('WebSocket') || error.message?.includes('connection')) {
        return 'Connection error. Please check your network and try again.';
    }
    
    // Handle invalid transaction format
    if (error.message?.includes('Invalid Hash length')) {
        return 'Invalid token ID format. Please check the ID and try again.';
    }
    
    // Handle clawback-specific errors
    if (error.message?.includes('Clawback: missing Holder')) {
        return 'Invalid clawback transaction format. Please try again.';
    }
    
    // Handle feature not enabled errors
    if (error.data?.error === 'temDISABLED') {
        const txType = error.data?.request?.TransactionType;
        if (txType) {
            return `The ${txType} feature is not yet enabled on this network.`;
        }
        return 'This feature is not yet enabled on the network.';
    }
    
    // Return the original error message if no specific handler
    return error.data?.error_message || error.message || 'An unexpected error occurred';
};

/**
 * Format error with transaction details for debugging
 */
export const formatErrorWithDetails = (error, txHash) => {
    const baseMessage = getErrorMessage(error);
    
    if (txHash) {
        return `${baseMessage}\nTransaction: ${txHash}`;
    }
    
    if (error.data?.tx_json?.hash) {
        return `${baseMessage}\nTransaction: ${error.data.tx_json.hash}`;
    }
    
    return baseMessage;
};