class ValidationService {
    validateSecretKey(secret) {
        if (!secret) {
            return 'Secret key is required';
        }
        if (!secret.startsWith('s')) {
            return 'Secret key must start with "s"';
        }
        if (secret.length < 29 || secret.length > 35) {
            return 'Secret key must be 29-35 characters long';
        }
        if (!/^s[A-Za-z0-9]+$/.test(secret)) {
            return 'Secret key contains invalid characters';
        }
        return null;
    }

    validateCurrencyCode(code) {
        if (!code) return 'Currency code is required';
        if (code.length < 3) return 'Currency code must be at least 3 characters';
        if (code.length > 20) return 'Currency code cannot exceed 20 characters (XRPL limit)';
        if (!/^[A-Z0-9]+$/.test(code)) return 'Currency code can only contain uppercase letters and numbers';
        return null;
    }

    validateTokenName(name) {
        if (!name) return 'Token name is required';
        if (name.length < 2) return 'Token name must be at least 2 characters';
        return null;
    }

    validateDescription(description) {
        if (!description) return 'Description is required';
        if (description.length < 10) return 'Description must be at least 10 characters';
        return null;
    }

    validateAssetScale(scale) {
        const num = parseInt(scale);
        if (isNaN(num) || num < 0 || num > 15) {
            return 'Decimal places must be between 0 and 15 (XRPL maximum)';
        }
        return null;
    }

    validateTransferFee(fee) {
        const num = parseInt(fee);
        if (isNaN(num) || num < 0 || num > 50000) {
            return 'Transfer fee must be between 0% and 50% (XRPL maximum)';
        }
        return null;
    }

    validatePrerequisites(currentStep, state) {
        if (currentStep >= 2 && !state.wallet) {
            throw new Error('Wallet not connected');
        }
        
        if (currentStep >= 6 && !state.txState.createComplete) {
            throw new Error('Token creation not completed');
        }
        
        if (currentStep >= 7 && !state.txState.mptIssuanceId) {
            throw new Error('MPT Issuance ID not available');
        }
        
        if (currentStep >= 8 && !state.txState.authComplete) {
            throw new Error('Authorization not completed');
        }
        
        return true;
    }
}

export const validationService = new ValidationService();
export default ValidationService;