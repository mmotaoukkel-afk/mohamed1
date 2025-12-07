/**
 * Payment Service
 * Handles payment processing with Stripe and other payment methods
 * SECURITY: All sensitive payment data is handled by Stripe SDK
 */
import api from './api';

// Payment Endpoints
const ENDPOINTS = {
    CREATE_PAYMENT_INTENT: '/payments/create-intent',
    CONFIRM_PAYMENT: '/payments/confirm',
    PAYMENT_METHODS: '/payments/methods',
    ADD_PAYMENT_METHOD: '/payments/methods',
    DELETE_PAYMENT_METHOD: '/payments/methods/:id',
    SET_DEFAULT_PAYMENT: '/payments/methods/:id/default',
    VALIDATE_PROMO: '/payments/validate-promo',
    REFUND: '/payments/refund',
};

// Card validation helpers
const CARD_PATTERNS = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
};

/**
 * Validate card number using Luhn algorithm
 */
export const validateCardNumber = (cardNumber) => {
    if (!cardNumber) {
        return { isValid: false, error: 'Card number is required' };
    }

    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');

    if (!/^\d+$/.test(cleanNumber)) {
        return { isValid: false, error: 'Card number must contain only digits' };
    }

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        return { isValid: false, error: 'Invalid card number length' };
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    if (sum % 10 !== 0) {
        return { isValid: false, error: 'Invalid card number' };
    }

    return { isValid: true, cardType: getCardType(cleanNumber) };
};

/**
 * Detect card type from number
 */
export const getCardType = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');

    for (const [type, pattern] of Object.entries(CARD_PATTERNS)) {
        if (pattern.test(cleanNumber)) {
            return type;
        }
    }

    return 'unknown';
};

/**
 * Validate expiry date
 */
export const validateExpiry = (month, year) => {
    if (!month || !year) {
        return { isValid: false, error: 'Expiry date is required' };
    }

    const monthNum = parseInt(month, 10);
    let yearNum = parseInt(year, 10);

    // Handle 2-digit year
    if (yearNum < 100) {
        yearNum += 2000;
    }

    if (monthNum < 1 || monthNum > 12) {
        return { isValid: false, error: 'Invalid month' };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
        return { isValid: false, error: 'Card has expired' };
    }

    // Max 10 years in future
    if (yearNum > currentYear + 10) {
        return { isValid: false, error: 'Invalid expiry year' };
    }

    return { isValid: true };
};

/**
 * Validate CVV
 */
export const validateCVV = (cvv, cardType = 'visa') => {
    if (!cvv) {
        return { isValid: false, error: 'CVV is required' };
    }

    const cleanCVV = cvv.replace(/\s/g, '');

    if (!/^\d+$/.test(cleanCVV)) {
        return { isValid: false, error: 'CVV must contain only digits' };
    }

    // AMEX has 4-digit CVV
    const expectedLength = cardType === 'amex' ? 4 : 3;

    if (cleanCVV.length !== expectedLength) {
        return { isValid: false, error: `CVV must be ${expectedLength} digits` };
    }

    return { isValid: true };
};

/**
 * Validate complete card information
 */
export const validateCard = (cardData) => {
    const { number, expiryMonth, expiryYear, cvv, holderName } = cardData;
    const errors = [];

    // Validate card number
    const numberValidation = validateCardNumber(number);
    if (!numberValidation.isValid) {
        errors.push({ field: 'number', error: numberValidation.error });
    }

    // Validate expiry
    const expiryValidation = validateExpiry(expiryMonth, expiryYear);
    if (!expiryValidation.isValid) {
        errors.push({ field: 'expiry', error: expiryValidation.error });
    }

    // Validate CVV
    const cvvValidation = validateCVV(cvv, numberValidation.cardType);
    if (!cvvValidation.isValid) {
        errors.push({ field: 'cvv', error: cvvValidation.error });
    }

    // Validate holder name
    if (!holderName || holderName.trim().length < 2) {
        errors.push({ field: 'holderName', error: 'Cardholder name is required' });
    }

    return {
        isValid: errors.length === 0,
        errors,
        cardType: numberValidation.cardType,
    };
};

/**
 * Create payment intent on server
 * Returns client secret for Stripe SDK
 * NOTE: In demo mode, returns a mock response
 */
// Demo mode flag - set to false when you have a real backend
const DEMO_MODE = true;

export const createPaymentIntent = async (orderData) => {
    const { amount, currency = 'usd', orderId, metadata = {} } = orderData;

    if (!amount || amount <= 0) {
        throw { code: 'VALIDATION_ERROR', message: 'Invalid amount' };
    }

    // Demo mode - simulate payment intent creation
    if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        return {
            success: true,
            clientSecret: `pi_demo_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
            paymentIntentId: `pi_demo_${Date.now()}`,
        };
    }

    try {
        const response = await api.post(ENDPOINTS.CREATE_PAYMENT_INTENT, {
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            orderId,
            metadata,
        });

        return {
            success: true,
            clientSecret: response.data.clientSecret,
            paymentIntentId: response.data.paymentIntentId,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to create payment',
            code: error.code || 'PAYMENT_INTENT_ERROR',
        };
    }
};

/**
 * Confirm payment after Stripe processing
 */
export const confirmPayment = async (paymentIntentId, orderId) => {
    try {
        const response = await api.post(ENDPOINTS.CONFIRM_PAYMENT, {
            paymentIntentId,
            orderId,
        });

        return {
            success: true,
            payment: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Payment confirmation failed',
            code: error.code || 'PAYMENT_CONFIRM_ERROR',
        };
    }
};

/**
 * Get saved payment methods
 */
export const getPaymentMethods = async () => {
    try {
        const response = await api.get(ENDPOINTS.PAYMENT_METHODS);

        return {
            success: true,
            methods: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch payment methods',
            code: error.code || 'PAYMENT_METHODS_ERROR',
        };
    }
};

/**
 * Validate promo code
 */
export const validatePromoCode = async (code, orderTotal) => {
    if (!code || code.trim().length < 3) {
        throw { code: 'VALIDATION_ERROR', message: 'Invalid promo code' };
    }

    try {
        const response = await api.post(ENDPOINTS.VALIDATE_PROMO, {
            code: code.trim().toUpperCase(),
            orderTotal,
        });

        return {
            success: true,
            discount: response.data.discount,
            discountType: response.data.discountType, // 'percentage' or 'fixed'
            discountAmount: response.data.discountAmount,
            message: response.data.message,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Invalid promo code',
            code: error.code || 'PROMO_ERROR',
        };
    }
};

/**
 * Format card number for display (masked)
 */
export const formatCardNumber = (number) => {
    const clean = number.replace(/\D/g, '');
    const groups = clean.match(/.{1,4}/g) || [];
    return groups.join(' ');
};

/**
 * Mask card number for display
 */
export const maskCardNumber = (number) => {
    const clean = number.replace(/\D/g, '');
    if (clean.length < 4) return clean;
    return `•••• •••• •••• ${clean.slice(-4)}`;
};

export default {
    validateCardNumber,
    validateExpiry,
    validateCVV,
    validateCard,
    getCardType,
    createPaymentIntent,
    confirmPayment,
    getPaymentMethods,
    validatePromoCode,
    formatCardNumber,
    maskCardNumber,
};
