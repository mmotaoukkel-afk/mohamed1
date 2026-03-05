import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import i18n from '../i18n';

export const useLanguage = () => {
    const [language, setLanguage] = useState(i18n.language);
    const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

    // Sync state with i18n
    useEffect(() => {
        const handleLanguageChange = (lng) => {
            setLanguage(lng);
            setIsRTL(lng === 'ar');
        };

        i18n.on('languageChanged', handleLanguageChange);

        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, []);

    const changeLanguage = async (langCode) => {
        const isAr = langCode === 'ar';

        // 1. Change language in i18n
        await i18n.changeLanguage(langCode);

        // 2. Persist preference
        // (Handled by language detection plugin in i18n/index.js)

        // 3. Handle RTL/LTR Switch
        if (isAr !== I18nManager.isRTL) {
            I18nManager.allowRTL(isAr);
            I18nManager.forceRTL(isAr);

            // Reload app to apply layout changes
            try {
                await Updates.reloadAsync();
            } catch (error) {
                // In development, we might not be able to reload programmatically easily
                console.log('Please reload the app manually to apply RTL changes.');
            }
        }
    };

    return {
        language,
        isRTL,
        changeLanguage,
        t: i18n.t
    };
};
