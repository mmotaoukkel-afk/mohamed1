/**
 * Stripe Configuration
 * Configure your Stripe publishable key and other settings here
 */

// IMPORTANT: Replace with your actual Stripe publishable key
// Test key starts with: pk_test_
// Live key starts with: pk_live_
export const STRIPE_CONFIG = {
    // Test publishable key (replace with your own from Stripe Dashboard)
    PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here',

    // Merchant display name
    MERCHANT_NAME: 'Fashion Store',

    // Merchant country code
    MERCHANT_COUNTRY_CODE: 'US',

    // Default currency
    CURRENCY: 'usd',

    // URL scheme for return URL (for 3D Secure)
    URL_SCHEME: 'fashionstore',

    // Apple Pay configuration
    APPLE_PAY: {
        enabled: true,
        merchantId: 'merchant.com.fashionstore',
    },

    // Google Pay configuration
    GOOGLE_PAY: {
        enabled: true,
        testEnv: true, // Set to false in production
    },
};

// Payment method types supported
export const SUPPORTED_PAYMENT_METHODS = {
    CARD: 'card',
    APPLE_PAY: 'applePay',
    GOOGLE_PAY: 'googlePay',
    CASH_ON_DELIVERY: 'cod',
};

// Card brands configuration
export const CARD_BRANDS = {
    visa: {
        name: 'Visa',
        icon: 'cc-visa',
        color: '#1A1F71',
    },
    mastercard: {
        name: 'Mastercard',
        icon: 'cc-mastercard',
        color: '#EB001B',
    },
    amex: {
        name: 'American Express',
        icon: 'cc-amex',
        color: '#006FCF',
    },
    discover: {
        name: 'Discover',
        icon: 'cc-discover',
        color: '#FF6000',
    },
};

export default STRIPE_CONFIG;
