
import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import { storage } from '../utils/storage';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState('ar');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedNotifs = await storage.getItem('notifications');
            const savedLang = await storage.getItem('language');

            if (savedNotifs !== null) setNotifications(savedNotifs);

            if (savedLang !== null) {
                setLanguage(savedLang);
                const isRTL = savedLang === 'ar';
                if (I18nManager.isRTL !== isRTL) {
                    I18nManager.allowRTL(isRTL);
                    I18nManager.forceRTL(isRTL);
                    await Updates.reloadAsync();
                }
            } else {
                // First launch: force Arabic and RTL
                setLanguage('ar');
                await storage.setItem('language', 'ar');
                if (!I18nManager.isRTL) {
                    I18nManager.allowRTL(true);
                    I18nManager.forceRTL(true);
                    await Updates.reloadAsync();
                }
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    };

    const toggleNotifications = async () => {
        const newVal = !notifications;
        setNotifications(newVal);
        await storage.setItem('notifications', newVal);
    };

    const changeLanguage = async (lang) => {
        setLanguage(lang);
        await storage.setItem('language', lang);

        // Handle RTL Layout changes if necessary
        const isRTL = lang === 'ar';
        if (I18nManager.isRTL !== isRTL) {
            I18nManager.allowRTL(isRTL);
            I18nManager.forceRTL(isRTL);
            try {
                await Updates.reloadAsync();
            } catch (error) {
                console.log('Reload not supported or failed:', error);
            }
        }
    };

    return (
        <SettingsContext.Provider value={{
            notifications,
            toggleNotifications,
            language,
            changeLanguage
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);

export default SettingsContext;
