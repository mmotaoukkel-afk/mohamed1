/**
 * API Configuration & Axios Instance
 * Secure API client with interceptors for authentication and error handling
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Base Configuration
const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.yourstore.com/v1',
    TIMEOUT: 15000, // 15 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
};

// Create Axios Instance
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': '1.0.0',
        'X-Platform': 'mobile',
    },
});

// Token Management
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const setAuthToken = async (token) => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
        console.error('Failed to store auth token:', error);
    }
};

export const getAuthToken = async () => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
    }
};

export const removeAuthToken = async () => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to remove auth token:', error);
    }
};

// Request Interceptor - Add Auth Token & Sanitize Data
api.interceptors.request.use(
    async (config) => {
        // Add auth token to requests
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add timestamp to prevent caching issues
        config.headers['X-Request-Time'] = new Date().toISOString();

        // Sanitize request data
        if (config.data) {
            config.data = sanitizeData(config.data);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor - Handle Errors & Token Refresh
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - Token Expired
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
                if (refreshToken) {
                    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { token } = response.data;
                    await setAuthToken(token);

                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - logout user
                await removeAuthToken();
                // Trigger logout event
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:logout'));
                }
            }
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            error.retryAfter = retryAfter;
        }

        return Promise.reject(formatError(error));
    }
);

// Data Sanitization - Prevent XSS
const sanitizeData = (data) => {
    if (typeof data === 'string') {
        return sanitizeString(data);
    }
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const key of Object.keys(data)) {
            sanitized[sanitizeString(key)] = sanitizeData(data[key]);
        }
        return sanitized;
    }
    return data;
};

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Error Formatting
const formatError = (error) => {
    const formattedError = {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        status: null,
        data: null,
    };

    if (error.response) {
        // Server responded with error
        formattedError.status = error.response.status;
        formattedError.message = error.response.data?.message || getDefaultErrorMessage(error.response.status);
        formattedError.code = error.response.data?.code || `HTTP_${error.response.status}`;
        formattedError.data = error.response.data;
    } else if (error.request) {
        // Request made but no response
        formattedError.message = 'Unable to connect to server. Please check your internet connection.';
        formattedError.code = 'NETWORK_ERROR';
    } else {
        // Error in request setup
        formattedError.message = error.message;
        formattedError.code = 'REQUEST_ERROR';
    }

    return formattedError;
};

const getDefaultErrorMessage = (status) => {
    const messages = {
        400: 'Invalid request. Please check your data.',
        401: 'Please login to continue.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        422: 'Validation failed. Please check your input.',
        429: 'Too many requests. Please try again later.',
        500: 'Server error. Please try again later.',
        502: 'Service temporarily unavailable.',
        503: 'Service is under maintenance.',
    };
    return messages[status] || 'An unexpected error occurred.';
};

// Retry Logic with Exponential Backoff
export const retryRequest = async (requestFn, attempts = API_CONFIG.RETRY_ATTEMPTS) => {
    for (let i = 0; i < attempts; i++) {
        try {
            return await requestFn();
        } catch (error) {
            if (i === attempts - 1) throw error;

            // Don't retry on client errors (4xx) except 429
            if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
                throw error;
            }

            // Exponential backoff
            const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

export default api;
