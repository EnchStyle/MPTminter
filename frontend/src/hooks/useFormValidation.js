import { useState, useCallback, useRef } from 'react';
import { validationService } from '../services/validationService';

export function useFormValidation() {
    const [errors, setErrors] = useState({});
    const validationTimeouts = useRef({});

    const validateField = useCallback((field, value, immediate = false) => {
        if (validationTimeouts.current[field]) {
            clearTimeout(validationTimeouts.current[field]);
        }

        const performValidation = () => {
            let error = null;

            switch (field) {
                case 'secretKey':
                    error = validationService.validateSecretKey(value);
                    break;
                case 'currencyCode':
                    error = validationService.validateCurrencyCode(value);
                    break;
                case 'name':
                    error = validationService.validateTokenName(value);
                    break;
                case 'description':
                    error = validationService.validateDescription(value);
                    break;
                case 'assetScale':
                    error = validationService.validateAssetScale(value);
                    break;
                case 'transferFee':
                    error = validationService.validateTransferFee(value);
                    break;
            }

            setErrors(prev => ({ ...prev, [field]: error }));
            return error === null;
        };

        if (immediate) {
            return performValidation();
        } else {
            validationTimeouts.current[field] = setTimeout(performValidation, 300);
            return true;
        }
    }, []);

    const validateStep = useCallback((step, formData) => {
        const stepErrors = {};

        switch (step) {
            case 1:
                if (!validateField('secretKey', formData.secretKey, true)) {
                    stepErrors.secretKey = validationService.validateSecretKey(formData.secretKey);
                }
                break;
            case 2:
                ['currencyCode', 'name', 'description'].forEach(field => {
                    if (!validateField(field, formData[field], true)) {
                        const methodName = field === 'name' ? 'validateTokenName' : `validate${field.charAt(0).toUpperCase() + field.slice(1)}`;
                        stepErrors[field] = validationService[methodName]?.(formData[field]);
                    }
                });
                break;
            case 3:
                ['assetScale', 'transferFee'].forEach(field => {
                    if (!validateField(field, formData[field], true)) {
                        stepErrors[field] = validationService[`validate${field.charAt(0).toUpperCase() + field.slice(1)}`]?.(formData[field]);
                    }
                });
                break;
        }

        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    }, [validateField]);

    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    return { errors, validateField, validateStep, clearErrors };
}