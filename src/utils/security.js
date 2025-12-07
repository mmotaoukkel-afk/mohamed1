/**
 * Security Utilities
 * Input sanitization, validation, and security helpers
 */

/**
 * Sanitize string to prevent XSS attacks
 */
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/\\/g, '&#x5C;')
        .replace(/`/g, '&#x60;');
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[sanitizeString(key)] = sanitizeObject(value);
        }
        return sanitized;
    }

    return obj;
};

/**
 * Remove potentially dangerous characters from input
 */
export const cleanInput = (input) => {
    if (typeof input !== 'string') return input;

    // Remove null bytes
    let cleaned = input.replace(/\0/g, '');

    // Remove control characters except newlines and tabs
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return '';

    // Convert to lowercase and trim
    let cleaned = email.toLowerCase().trim();

    // Remove any characters that shouldn't be in an email
    cleaned = cleaned.replace(/[^\w.@+-]/g, '');

    // Limit length
    if (cleaned.length > 254) {
        cleaned = cleaned.substring(0, 254);
    }

    return cleaned;
};

/**
 * Validate URL
 */
export const isValidUrl = (url) => {
    if (typeof url !== 'string') return false;

    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
};

/**
 * Sanitize URL (only allow safe URLs)
 */
export const sanitizeUrl = (url) => {
    if (!isValidUrl(url)) return '';

    try {
        const parsed = new URL(url);

        // Only allow http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }

        return parsed.href;
    } catch {
        return '';
    }
};

/**
 * Check for SQL injection patterns
 */
export const hasSQLInjection = (input) => {
    if (typeof input !== 'string') return false;

    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
        /(\b(UNION|JOIN)\b.*\b(SELECT)\b)/i,
        /(--|\#|\/\*|\*\/)/,
        /(\b(OR|AND)\b.*=.*)/i,
        /('|")\s*(OR|AND)\s*('|")/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for script injection patterns
 */
export const hasScriptInjection = (input) => {
    if (typeof input !== 'string') return false;

    const scriptPatterns = [
        /<script\b[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe\b/i,
        /<object\b/i,
        /<embed\b/i,
        /data:\s*text\/html/i,
    ];

    return scriptPatterns.some(pattern => pattern.test(input));
};

/**
 * Validate input is safe
 */
export const isInputSafe = (input) => {
    if (typeof input !== 'string') return true;

    return !hasSQLInjection(input) && !hasScriptInjection(input);
};

/**
 * Rate limiter for client-side protection
 */
export class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    isAllowed(key = 'default') {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Get existing requests for this key
        let keyRequests = this.requests.get(key) || [];

        // Filter out old requests
        keyRequests = keyRequests.filter(timestamp => timestamp > windowStart);

        // Check if limit is reached
        if (keyRequests.length >= this.maxRequests) {
            this.requests.set(key, keyRequests);
            return false;
        }

        // Add current request
        keyRequests.push(now);
        this.requests.set(key, keyRequests);

        return true;
    }

    reset(key = 'default') {
        this.requests.delete(key);
    }

    getTimeUntilReset(key = 'default') {
        const keyRequests = this.requests.get(key) || [];
        if (keyRequests.length === 0) return 0;

        const oldestRequest = Math.min(...keyRequests);
        const resetTime = oldestRequest + this.windowMs;

        return Math.max(0, resetTime - Date.now());
    }
}

/**
 * Create rate limiters for common operations
 */
export const rateLimiters = {
    login: new RateLimiter(5, 60000), // 5 attempts per minute
    register: new RateLimiter(3, 300000), // 3 attempts per 5 minutes
    api: new RateLimiter(100, 60000), // 100 requests per minute
    payment: new RateLimiter(3, 60000), // 3 attempts per minute
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (data) => {
    if (typeof data !== 'object' || data === null) return data;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'cvv', 'cardNumber', 'ssn'];
    const masked = {};

    for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            masked[key] = '***MASKED***';
        } else if (typeof value === 'object') {
            masked[key] = maskSensitiveData(value);
        } else {
            masked[key] = value;
        }
    }

    return masked;
};

/**
 * Generate secure random string
 */
export const generateSecureToken = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

/**
 * Validate password strength
 */
export const checkPasswordStrength = (password) => {
    if (!password) return { score: 0, level: 'none', feedback: [] };

    let score = 0;
    const feedback = [];

    // Length checks
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters');

    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character type checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    // Common patterns to avoid
    if (/(.)\1{2,}/.test(password)) {
        score -= 1;
        feedback.push('Avoid repeated characters');
    }

    if (/^[a-zA-Z]+$/.test(password) || /^\d+$/.test(password)) {
        score -= 1;
        feedback.push('Mix different character types');
    }

    // Determine level
    let level = 'weak';
    if (score >= 6) level = 'strong';
    else if (score >= 4) level = 'good';
    else if (score >= 2) level = 'fair';

    return { score: Math.max(0, score), level, feedback };
};

export default {
    sanitizeString,
    sanitizeObject,
    cleanInput,
    sanitizeEmail,
    isValidUrl,
    sanitizeUrl,
    hasSQLInjection,
    hasScriptInjection,
    isInputSafe,
    RateLimiter,
    rateLimiters,
    maskSensitiveData,
    generateSecureToken,
    checkPasswordStrength,
};
