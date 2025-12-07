/**
 * Application Configuration
 * Environment-based settings and constants
 */

// Determine environment
const isDev = __DEV__ || process.env.NODE_ENV === 'development';
const isProd = !isDev;

// API Configuration
export const API_CONFIG = {
    // Use environment variable or default
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || (isDev
        ? 'http://localhost:3000/api/v1'
        : 'https://api.yourstore.com/v1'
    ),
    TIMEOUT: 15000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
};

// Stripe Configuration
export const STRIPE_CONFIG = {
    PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
    MERCHANT_ID: 'merchant.com.yourstore',
    CURRENCY: 'USD',
    COUNTRY: 'US',
};

// App Configuration
export const APP_CONFIG = {
    NAME: 'Fashion Store',
    VERSION: '1.0.0',
    BUNDLE_ID: 'com.yourstore.app',
    SUPPORT_EMAIL: 'support@yourstore.com',
    WEBSITE: 'https://yourstore.com',
};

// Feature Flags
export const FEATURES = {
    ENABLE_STRIPE: false, // Set to true when Stripe is configured
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_ANALYTICS: isProd,
    ENABLE_CRASH_REPORTING: isProd,
    ENABLE_BIOMETRIC_AUTH: true,
    ENABLE_GUEST_CHECKOUT: true,
    ENABLE_SOCIAL_LOGIN: false,
    ENABLE_DARK_MODE: true,
    ENABLE_OFFLINE_MODE: false,
};

// Cache Configuration
export const CACHE_CONFIG = {
    PRODUCTS_TTL: 5 * 60 * 1000, // 5 minutes
    CATEGORIES_TTL: 30 * 60 * 1000, // 30 minutes
    USER_TTL: 10 * 60 * 1000, // 10 minutes
};

// Pagination Defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};

// Validation Limits
export const LIMITS = {
    MAX_CART_ITEMS: 50,
    MAX_QUANTITY_PER_ITEM: 10,
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
    MAX_NAME_LENGTH: 50,
    MAX_ADDRESS_LENGTH: 200,
    MAX_PROMO_CODE_LENGTH: 20,
};

// Promo Codes (for demo - in production, these come from backend)
export const DEMO_PROMO_CODES = {
    'SAVE10': { discount: 10, type: 'percentage' },
    'SAVE20': { discount: 20, type: 'percentage' },
    'WELCOME': { discount: 15, type: 'percentage' },
    'FIRST': { discount: 25, type: 'percentage' },
    'FLAT50': { discount: 50, type: 'fixed' },
};

// Shipping Options
export const SHIPPING_OPTIONS = [
    {
        id: 'standard',
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: '5-7',
    },
    {
        id: 'express',
        name: 'Express Shipping',
        price: 12.99,
        estimatedDays: '2-3',
    },
    {
        id: 'overnight',
        name: 'Overnight Shipping',
        price: 24.99,
        estimatedDays: '1',
    },
];

// Order Statuses
export const ORDER_STATUSES = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
};

// Payment Methods
export const PAYMENT_METHODS = {
    CARD: 'card',
    APPLE_PAY: 'apple_pay',
    GOOGLE_PAY: 'google_pay',
    PAYPAL: 'paypal',
    COD: 'cash_on_delivery',
};

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'app_user',
    USERS_DB: 'app_users_db',
    CART: 'cart_items',
    FAVORITES: 'favorite_items',
    ADDRESSES: '@saved_addresses',
    PAYMENT_METHODS: '@saved_payment_methods',
    ORDERS: '@order_history',
    SETTINGS: 'app_settings',
    THEME: 'app_theme',
    ONBOARDING_COMPLETE: 'onboarding_complete',
};

// Animation Durations
export const ANIMATIONS = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK: 'Unable to connect. Please check your internet connection.',
    AUTH: 'Authentication failed. Please login again.',
    VALIDATION: 'Please check your input and try again.',
    SERVER: 'Something went wrong. Please try again later.',
    PAYMENT: 'Payment failed. Please try again.',
    NOT_FOUND: 'The requested item was not found.',
};

export default {
    API_CONFIG,
    STRIPE_CONFIG,
    APP_CONFIG,
    FEATURES,
    CACHE_CONFIG,
    PAGINATION,
    LIMITS,
    DEMO_PROMO_CODES,
    SHIPPING_OPTIONS,
    ORDER_STATUSES,
    PAYMENT_METHODS,
    STORAGE_KEYS,
    ANIMATIONS,
    ERROR_MESSAGES,
    isDev,
    isProd,
};
