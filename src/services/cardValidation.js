/**
 * Card Validation Service - Kataraa
 * نظام التحقق من صحة بطاقات الدفع
 */

export const CARD_TYPES = {
    VISA: { label: 'Visa', pattern: /^4/, icon: 'logo-visa' },
    MASTERCARD: { label: 'Mastercard', pattern: /^5[1-5]/, icon: 'logo-mastercard' },
    AMEX: { label: 'American Express', pattern: /^3[47]/, icon: 'card' },
    DISCOVER: { label: 'Discover', pattern: /^6(?:011|5)/, icon: 'card' },
    UNKNOWN: { label: 'Unknown', pattern: /.*/, icon: 'card-outline' }
};

/**
 * خوارزمية لوان (Luhn Algorithm) للتحقق من صحة رقم البطاقة
 */
export const validateLuhn = (cardNumber) => {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits.charAt(i));

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return (sum % 10) === 0 && digits.length >= 13;
};

/**
 * تحديد نوع البطاقة بناءً على أول أرقام
 */
export const getCardType = (cardNumber) => {
    const number = cardNumber.replace(/\D/g, '');
    for (const key in CARD_TYPES) {
        if (CARD_TYPES[key].pattern.test(number)) {
            return CARD_TYPES[key];
        }
    }
    return CARD_TYPES.UNKNOWN;
};

/**
 * التحقق من تاريخ الانتهاء (MM/YY)
 */
export const validateExpiry = (expiry) => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

    const [month, year] = expiry.split('/').map(n => parseInt(n));
    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
};

/**
 * التحقق من رمز الأمان (CVV)
 */
export const validateCVV = (cvv, cardType = 'VISA') => {
    const length = cardType === 'AMEX' ? 4 : 3;
    const digits = cvv.replace(/\D/g, '');
    return digits.length === length;
};

/**
 * تنسيق رقم البطاقة (إضافة مسافات)
 */
export const formatCardNumber = (number) => {
    return number.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
};

/**
 * تنسيق تاريخ الانتهاء (إضافة /)
 */
export const formatExpiry = (expiry) => {
    const cleaned = expiry.replace(/\D/g, '');
    if (cleaned.length >= 2) {
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
};
