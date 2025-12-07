/**
 * Error Handler Utility
 * Centralized error handling with logging and user-friendly messages
 */

// Error Types
export const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    AUTH: 'AUTH_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    SERVER: 'SERVER_ERROR',
    PAYMENT: 'PAYMENT_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR',
};

// User-friendly error messages
const ERROR_MESSAGES = {
    [ERROR_TYPES.NETWORK]: 'Unable to connect. Please check your internet connection.',
    [ERROR_TYPES.AUTH]: 'Authentication failed. Please login again.',
    [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
    [ERROR_TYPES.SERVER]: 'Something went wrong on our end. Please try again later.',
    [ERROR_TYPES.PAYMENT]: 'Payment processing failed. Please try again.',
    [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
    [ERROR_TYPES.PERMISSION]: 'You do not have permission to perform this action.',
    [ERROR_TYPES.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
    [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

/**
 * Error class for application errors
 */
export class AppError extends Error {
    constructor(type, message, data = null, originalError = null) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.data = data;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            type: this.type,
            message: this.message,
            data: this.data,
            timestamp: this.timestamp,
        };
    }
}

/**
 * Parse error from various sources and normalize it
 */
export const parseError = (error) => {
    // Already an AppError
    if (error instanceof AppError) {
        return error;
    }

    // Axios error
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        let type = ERROR_TYPES.UNKNOWN;
        let message = data?.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];

        if (status === 401) {
            type = ERROR_TYPES.AUTH;
            message = data?.message || ERROR_MESSAGES[ERROR_TYPES.AUTH];
        } else if (status === 403) {
            type = ERROR_TYPES.PERMISSION;
            message = data?.message || ERROR_MESSAGES[ERROR_TYPES.PERMISSION];
        } else if (status === 404) {
            type = ERROR_TYPES.NOT_FOUND;
            message = data?.message || ERROR_MESSAGES[ERROR_TYPES.NOT_FOUND];
        } else if (status === 422 || status === 400) {
            type = ERROR_TYPES.VALIDATION;
            message = data?.message || ERROR_MESSAGES[ERROR_TYPES.VALIDATION];
        } else if (status === 429) {
            type = ERROR_TYPES.RATE_LIMIT;
            message = ERROR_MESSAGES[ERROR_TYPES.RATE_LIMIT];
        } else if (status >= 500) {
            type = ERROR_TYPES.SERVER;
            message = ERROR_MESSAGES[ERROR_TYPES.SERVER];
        }

        return new AppError(type, message, data, error);
    }

    // Network error
    if (error.request && !error.response) {
        return new AppError(
            ERROR_TYPES.NETWORK,
            ERROR_MESSAGES[ERROR_TYPES.NETWORK],
            null,
            error
        );
    }

    // Custom error object
    if (error.code) {
        const type = mapCodeToType(error.code);
        return new AppError(
            type,
            error.message || ERROR_MESSAGES[type],
            error.data,
            error
        );
    }

    // Generic error
    return new AppError(
        ERROR_TYPES.UNKNOWN,
        error.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN],
        null,
        error
    );
};

/**
 * Map error codes to types
 */
const mapCodeToType = (code) => {
    const codeMap = {
        'NETWORK_ERROR': ERROR_TYPES.NETWORK,
        'ECONNREFUSED': ERROR_TYPES.NETWORK,
        'ENOTFOUND': ERROR_TYPES.NETWORK,
        'ETIMEDOUT': ERROR_TYPES.NETWORK,
        'AUTH_ERROR': ERROR_TYPES.AUTH,
        'UNAUTHORIZED': ERROR_TYPES.AUTH,
        'VALIDATION_ERROR': ERROR_TYPES.VALIDATION,
        'INVALID_INPUT': ERROR_TYPES.VALIDATION,
        'PAYMENT_ERROR': ERROR_TYPES.PAYMENT,
        'PAYMENT_FAILED': ERROR_TYPES.PAYMENT,
        'NOT_FOUND': ERROR_TYPES.NOT_FOUND,
        'FORBIDDEN': ERROR_TYPES.PERMISSION,
        'RATE_LIMIT': ERROR_TYPES.RATE_LIMIT,
    };
    return codeMap[code] || ERROR_TYPES.UNKNOWN;
};

/**
 * Get user-friendly message for error
 */
export const getUserMessage = (error) => {
    const appError = parseError(error);
    return appError.message || ERROR_MESSAGES[appError.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
};

/**
 * Log error for debugging (non-sensitive info only)
 */
export const logError = (error, context = '') => {
    const appError = parseError(error);

    // Only log in development
    if (__DEV__) {
        console.error(`[${appError.type}]${context ? ` ${context}:` : ''}`, {
            message: appError.message,
            data: appError.data,
            timestamp: appError.timestamp,
        });
    }

    // In production, you would send to error tracking service
    // Example: Sentry.captureException(appError);
};

/**
 * Handle error with callback options
 */
export const handleError = (error, options = {}) => {
    const {
        context = '',
        onNetworkError = null,
        onAuthError = null,
        onValidationError = null,
        onError = null,
        showAlert = false,
    } = options;

    const appError = parseError(error);
    logError(appError, context);

    // Call specific handlers
    switch (appError.type) {
        case ERROR_TYPES.NETWORK:
            onNetworkError?.(appError);
            break;
        case ERROR_TYPES.AUTH:
            onAuthError?.(appError);
            break;
        case ERROR_TYPES.VALIDATION:
            onValidationError?.(appError);
            break;
        default:
            onError?.(appError);
    }

    return appError;
};

/**
 * Wrap async function with error handling
 */
export const withErrorHandling = (fn, options = {}) => {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, options);
            throw parseError(error);
        }
    };
};

/**
 * Safe JSON parse
 */
export const safeJSONParse = (str, fallback = null) => {
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
};

/**
 * Check if error is of specific type
 */
export const isErrorType = (error, type) => {
    const appError = parseError(error);
    return appError.type === type;
};

export default {
    ERROR_TYPES,
    AppError,
    parseError,
    getUserMessage,
    logError,
    handleError,
    withErrorHandling,
    safeJSONParse,
    isErrorType,
};
