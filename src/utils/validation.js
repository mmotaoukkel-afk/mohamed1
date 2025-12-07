/**
 * Validation Utilities
 * Comprehensive form validation with English messages
 */

// Email Validation
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !email.trim()) {
        return { isValid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedEmail.length > 254) {
        return { isValid: false, error: 'Email is too long' };
    }

    if (!emailRegex.test(trimmedEmail)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true, value: trimmedEmail };
};

// Password Validation
export const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long' };
    }

    return { isValid: true };
};

// Strong Password Validation
export const validateStrongPassword = (password) => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters' };
    }

    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain a lowercase letter' };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain an uppercase letter' };
    }

    if (!/\d/.test(password)) {
        return { isValid: false, error: 'Password must contain a number' };
    }

    return { isValid: true };
};

// Password Strength Checker
export const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '#ccc' };

    let strength = 0;

    // Length checks
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;

    // Character variety
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;

    // Numbers
    if (/\d/.test(password)) strength += 15;

    // Special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10;

    let label = '';
    let color = '';

    if (strength < 30) {
        label = 'Weak';
        color = '#EF4444';
    } else if (strength < 60) {
        label = 'Fair';
        color = '#F59E0B';
    } else if (strength < 80) {
        label = 'Good';
        color = '#10B981';
    } else {
        label = 'Strong';
        color = '#059669';
    }

    return { strength: Math.min(100, strength), label, color };
};

// Password Match Validation
export const validatePasswordMatch = (password, confirmPassword) => {
    if (!confirmPassword) {
        return { isValid: false, error: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }

    return { isValid: true };
};

// Name Validation
export const validateName = (name) => {
    if (!name || !name.trim()) {
        return { isValid: false, error: 'Name is required' };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
    }

    if (trimmedName.length > 50) {
        return { isValid: false, error: 'Name is too long' };
    }

    // Only letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\u0600-\u06FF\s\-']+$/.test(trimmedName)) {
        return { isValid: false, error: 'Name contains invalid characters' };
    }

    return { isValid: true, value: trimmedName };
};

// Phone Validation
export const validatePhone = (phone) => {
    if (!phone || !phone.trim()) {
        return { isValid: false, error: 'Phone number is required' };
    }

    // Remove spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    // Allow + at the start for international
    if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
    }

    return { isValid: true, value: cleanPhone };
};

// Address Validation
export const validateAddress = (address) => {
    const errors = {};

    if (!address.street || address.street.trim().length < 5) {
        errors.street = 'Please enter a valid street address';
    }

    if (!address.city || address.city.trim().length < 2) {
        errors.city = 'City is required';
    }

    if (!address.state || address.state.trim().length < 2) {
        errors.state = 'State/Province is required';
    }

    if (!address.zipCode || !/^[\w\s\-]{3,10}$/.test(address.zipCode.trim())) {
        errors.zipCode = 'Please enter a valid postal code';
    }

    if (!address.country || address.country.trim().length < 2) {
        errors.country = 'Country is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

// Credit Card Number Validation (basic format check)
export const validateCardNumber = (cardNumber) => {
    if (!cardNumber) {
        return { isValid: false, error: 'Card number is required' };
    }

    const cleanNumber = cardNumber.replace(/\s/g, '');

    if (!/^\d{13,19}$/.test(cleanNumber)) {
        return { isValid: false, error: 'Please enter a valid card number' };
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    if (sum % 10 !== 0) {
        return { isValid: false, error: 'Invalid card number' };
    }

    return { isValid: true };
};

// Expiry Date Validation
export const validateExpiry = (month, year) => {
    if (!month || !year) {
        return { isValid: false, error: 'Expiry date is required' };
    }

    const monthNum = parseInt(month, 10);
    let yearNum = parseInt(year, 10);

    if (yearNum < 100) yearNum += 2000;

    if (monthNum < 1 || monthNum > 12) {
        return { isValid: false, error: 'Invalid month' };
    }

    const now = new Date();
    const expiry = new Date(yearNum, monthNum - 1);

    if (expiry < now) {
        return { isValid: false, error: 'Card has expired' };
    }

    return { isValid: true };
};

// CVV Validation
export const validateCVV = (cvv) => {
    if (!cvv) {
        return { isValid: false, error: 'CVV is required' };
    }

    if (!/^\d{3,4}$/.test(cvv)) {
        return { isValid: false, error: 'CVV must be 3 or 4 digits' };
    }

    return { isValid: true };
};

// Promo Code Validation
export const validatePromoCode = (code) => {
    if (!code || !code.trim()) {
        return { isValid: false, error: 'Please enter a promo code' };
    }

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode.length < 3 || cleanCode.length > 20) {
        return { isValid: false, error: 'Invalid promo code format' };
    }

    if (!/^[A-Z0-9]+$/.test(cleanCode)) {
        return { isValid: false, error: 'Promo code can only contain letters and numbers' };
    }

    return { isValid: true, value: cleanCode };
};

// URL Validation
export const validateUrl = (url) => {
    if (!url) {
        return { isValid: false, error: 'URL is required' };
    }

    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { isValid: false, error: 'URL must start with http:// or https://' };
        }
        return { isValid: true, value: parsed.href };
    } catch {
        return { isValid: false, error: 'Please enter a valid URL' };
    }
};

// Quantity Validation
export const validateQuantity = (quantity, min = 1, max = 99) => {
    const num = parseInt(quantity, 10);

    if (isNaN(num)) {
        return { isValid: false, error: 'Please enter a valid number' };
    }

    if (num < min) {
        return { isValid: false, error: `Minimum quantity is ${min}` };
    }

    if (num > max) {
        return { isValid: false, error: `Maximum quantity is ${max}` };
    }

    return { isValid: true, value: num };
};

// Price Validation
export const validatePrice = (price) => {
    const num = parseFloat(price);

    if (isNaN(num)) {
        return { isValid: false, error: 'Please enter a valid price' };
    }

    if (num < 0) {
        return { isValid: false, error: 'Price cannot be negative' };
    }

    if (num > 999999.99) {
        return { isValid: false, error: 'Price is too high' };
    }

    return { isValid: true, value: Math.round(num * 100) / 100 };
};

// Form Validation Helper
export const validateForm = (data, rules) => {
    const errors = {};
    const validators = {
        email: validateEmail,
        password: validatePassword,
        strongPassword: validateStrongPassword,
        name: validateName,
        phone: validatePhone,
        cardNumber: validateCardNumber,
        cvv: validateCVV,
        url: validateUrl,
    };

    for (const [field, rule] of Object.entries(rules)) {
        if (typeof rule === 'string' && validators[rule]) {
            const result = validators[rule](data[field]);
            if (!result.isValid) {
                errors[field] = result.error;
            }
        } else if (typeof rule === 'function') {
            const result = rule(data[field], data);
            if (!result.isValid) {
                errors[field] = result.error;
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export default {
    validateEmail,
    validatePassword,
    validateStrongPassword,
    getPasswordStrength,
    validatePasswordMatch,
    validateName,
    validatePhone,
    validateAddress,
    validateCardNumber,
    validateExpiry,
    validateCVV,
    validatePromoCode,
    validateUrl,
    validateQuantity,
    validatePrice,
    validateForm,
};
