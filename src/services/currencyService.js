/**
 * Currency Service - Kataraa
 * Handles currency conversion and formatting for Admin (KWD) and Customers (Dynamic).
 * Now integrated with Firestore for persistence.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Exchange Rates (No conversion needed if base is KWD)
const EXCHANGE_RATES = {
    KWD: 1,       // Base currency is now KWD
};

// Formatter configurations
const CURRENCIES = {
    KWD: { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', decimals: 3, locale: 'ar-KW' },
};

class CurrencyService {
    constructor() {
        this.baseCurrency = 'KWD'; // All products from site are treated as KWD
        this.adminCurrency = 'KWD';
        this.customerCurrency = 'KWD';
        this.isLoaded = false;
    }

    /**
     * Load customer currency from Firestore
     * Should be called when app starts
     */
    async loadFromFirestore() {
        try {
            const docRef = doc(db, 'settings', 'store');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.currency && CURRENCIES[data.currency]) {
                    this.customerCurrency = data.currency;
                    console.log('✅ Currency loaded from Firestore:', this.customerCurrency);
                }
            }
            this.isLoaded = true;
        } catch (error) {
            console.error('Error loading currency from Firestore:', error);
            this.isLoaded = true; // Continue with default
        }
    }

    /**
     * Convert amount from base currency (KWD) to target currency
     */
    convert(amountInKwd, targetCurrency) {
        if (!amountInKwd) return 0;
        const rate = EXCHANGE_RATES[targetCurrency] || 1;
        return amountInKwd * rate;
    }

    /**
     * Convert from any currency back to Admin currency (KWD)
     */
    convertToAdmin(amount, fromCurrency) {
        if (!amount) return 0;
        return parseFloat(amount);
    }

    /**
     * Format price for Admin (Always KWD)
     */
    formatAdminPrice(rawAmount) {
        const amount = parseFloat(rawAmount) || 0;
        return this.formatKWD(amount);
    }

    /**
     * Format an already converted KWD amount
     */
    formatKWD(amountInKwd) {
        const currency = CURRENCIES[this.adminCurrency];
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: currency.decimals,
            maximumFractionDigits: currency.decimals,
            numberingSystem: 'latn', // Force standard Western/Latin numbers (123) instead of Eastern Arabic (١٢٣)
        }).format(amountInKwd || 0);
    }

    /**
     * Format price for Customer (Dynamic based on settings)
     */
    formatPrice(rawAmount) {
        const currency = CURRENCIES[this.customerCurrency] || CURRENCIES.KWD;
        const amount = parseFloat(rawAmount) || 0;

        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: currency.decimals,
            maximumFractionDigits: currency.decimals,
            numberingSystem: 'latn', // Force standard Western/Latin numbers (123) instead of Eastern Arabic (١٢٣)
        }).format(amount);
    }

    /**
     * Set user's preferred currency and save to Firestore
     */
    async setCustomerCurrency(currencyCode) {
        if (CURRENCIES[currencyCode]) {
            this.customerCurrency = currencyCode;

            // Save to Firestore
            try {
                const docRef = doc(db, 'settings', 'store');
                await setDoc(docRef, { currency: currencyCode, updatedAt: new Date() }, { merge: true });
                console.log('✅ Currency saved to Firestore:', currencyCode);
            } catch (error) {
                console.error('Error saving currency to Firestore:', error);
            }
        }
    }

    /**
     * Get current customer currency code
     */
    getCustomerCurrency() {
        return this.customerCurrency;
    }

    /**
     * Get available currencies list for picker
     */
    getAvailableCurrencies() {
        return Object.keys(CURRENCIES).map(code => ({
            code,
            symbol: CURRENCIES[code].symbol,
            name: CURRENCIES[code].name,
            label: `${CURRENCIES[code].name} (${CURRENCIES[code].symbol})`
        }));
    }
}

export const currencyService = new CurrencyService();
export default currencyService;

