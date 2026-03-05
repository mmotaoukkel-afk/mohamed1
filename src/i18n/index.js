import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Safe import of expo-localization (native module may not be available)
let Localization = null;
try {
    Localization = require('expo-localization');
} catch (e) {
    console.warn('expo-localization native module not available, falling back to default language');
}

// Import translations
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

const RESOURCES = {
    en: { translation: en },
    ar: { translation: ar },
    fr: { translation: fr },
};

/**
 * Safely get the device language code.
 * Returns 'en' if expo-localization is not available.
 */
const getDeviceLanguage = () => {
    try {
        if (Localization && Localization.getLocales) {
            const locales = Localization.getLocales();
            if (locales && locales.length > 0) {
                return locales[0].languageCode || 'en';
            }
        }
    } catch (e) {
        console.warn('Could not detect device language:', e.message);
    }
    return 'ar';
};

const LANGUAGE_DETECTOR = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            // 1. Check for saved language preference
            const savedLanguage = await AsyncStorage.getItem('user-language');
            if (savedLanguage) {
                return callback(savedLanguage);
            }

            // 2. Fallback to device language
            const deviceLanguage = getDeviceLanguage();
            return callback(deviceLanguage);
        } catch (error) {
            console.log('Error reading language', error);
            callback('ar'); // Fallback
        }
    },
    init: () => { },
    cacheUserLanguage: async (language) => {
        try {
            await AsyncStorage.setItem('user-language', language);
        } catch (error) {
            console.log('Error saving language', error);
        }
    },
};

i18n
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
        resources: RESOURCES,
        fallbackLng: 'ar',
        compatibilityJSON: 'v3', // Required for Android
        interpolation: {
            escapeValue: false, // React already safeguards against XSS
        },
        react: {
            useSuspense: false, // Recommended for React Native
        },
    });

export default i18n;
