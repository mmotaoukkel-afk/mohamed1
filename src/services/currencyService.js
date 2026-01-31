/**
 * Currency Service - Kataraa
 * Handles currency conversion and formatting for Admin (KWD) and Customers (Dynamic).
 * Now integrated with Firestore for persistence.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Exchange Rates (Mock for MVP)
const EXCHANGE_RATES = {
    MAD: 1,       // Base currency (Moroccan Dirham)
    KWD: 0.030,   // 1 MAD ≈ 0.030 KWD (1 KWD ≈ 33 MAD)
    USD: 0.10,    // 1 MAD ≈ 0.10 USD
    EUR: 0.091,   // 1 MAD ≈ 0.091 EUR
    SAR: 0.37,    // 1 MAD ≈ 0.37 SAR
    QAR: 0.36,    // 1 MAD ≈ 0.36 QAR
    AED: 0.36,    // 1 MAD ≈ 0.36 AED
    SYP: 125.0,   // 1 MAD ≈ 125 SYP (Basic rate for calculation)
};

// Formatter configurations
const CURRENCIES = {
    MAD: { code: 'MAD', symbol: 'د.م.', name: 'درهم مغربي', decimals: 0, locale: 'ar-MA' },
    KWD: { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', decimals: 3, locale: 'ar-KW' },
    USD: { code: 'USD', symbol: '$', name: 'دولار أمريكي', decimals: 2, locale: 'en-US' },
    EUR: { code: 'EUR', symbol: '€', name: 'يورو', decimals: 2, locale: 'fr-FR' },
    SAR: { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', decimals: 2, locale: 'ar-SA' },
    QAR: { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', decimals: 2, locale: 'ar-QA' },
    AED: { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', decimals: 2, locale: 'ar-AE' },
    SYP: { code: 'SYP', symbol: 'ل.س', name: 'ليرة سورية', decimals: 0, locale: 'ar-SY' },
};

class CurrencyService {
    constructor() {
        this.baseCurrency = 'MAD'; // All products are stored in MAD
        this.adminCurrency = 'KWD'; // Admin always sees KWD
        this.customerCurrency = 'KWD'; // Default, will be loaded from Firestore
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
     * Convert amount from base currency (MAD) to target currency
     */
    convert(amountInMad, targetCurrency) {
        if (!amountInMad) return 0;
        const rate = EXCHANGE_RATES[targetCurrency] || 1;
        return amountInMad * rate;
    }

    /**
     * Convert from any currency back to Admin currency (KWD)
     */
    convertToAdmin(amount, fromCurrency) {
        if (!amount) return 0;
        if (fromCurrency === this.adminCurrency) return parseFloat(amount);

        // Convert to MAD first (base), then to KWD
        const rateToMad = 1 / (EXCHANGE_RATES[fromCurrency] || 1);
        const amountInMad = amount * rateToMad;
        return this.convert(amountInMad, this.adminCurrency);
    }

    /**
     * Format price for Admin (Always KWD)
     * Input: amount in base currency (MAD)
     */
    formatAdminPrice(amountInMad) {
        const currency = CURRENCIES[this.adminCurrency];
        const converted = this.convert(amountInMad, this.adminCurrency);
        return this.formatKWD(converted);
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
        }).format(amountInKwd || 0);
    }

    /**
     * Format price for Customer (Dynamic based on settings)
     */
    formatPrice(amountInMad) {
        const currency = CURRENCIES[this.customerCurrency];
        const converted = this.convert(amountInMad, this.customerCurrency);

        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: currency.decimals,
            maximumFractionDigits: currency.decimals,
        }).format(converted);
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

