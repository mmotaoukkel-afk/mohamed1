import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { sanitizeEmail } from '../utils/helpers';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [sounds, setSounds] = useState(true);
    const [vibration, setVibration] = useState(true);
    const [language, setLanguage] = useState('ar');
    const [isFirstLaunch, setIsFirstLaunch] = useState(null); // null = loading, true = show onboarding, false = skip

    // Check if first launch (Global, not user specific)
    useEffect(() => {
        (async () => {
            try {
                const hasLaunched = await AsyncStorage.getItem('app_has_launched');
                if (hasLaunched === null) {
                    setIsFirstLaunch(true);
                } else {
                    setIsFirstLaunch(false);
                }
            } catch (error) {
                setIsFirstLaunch(false); // Fallback
            }
        })();
    }, []);

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('app_has_launched', 'true');
            setIsFirstLaunch(false);
        } catch (error) {
            console.warn('Failed to save onboarding status', error);
        }
    };

    // Load saved settings on mount or user change
    useEffect(() => {
        (async () => {
            if (!user) {
                // Reset to defaults if no user
                setNotifications(true);
                setSounds(true);
                setVibration(true);
                setLanguage('ar');
                return;
            }

            try {
                const key = `app_settings_${sanitizeEmail(user.email)}`;
                const stored = await AsyncStorage.getItem(key);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setNotifications(parsed.notifications ?? true);
                    setSounds(parsed.sounds ?? true);
                    setVibration(parsed.vibration ?? true);
                    setLanguage(parsed.language ?? 'ar');
                } else {
                    // New user defaults
                    setNotifications(true);
                    setSounds(true);
                    setVibration(true);
                    setLanguage('ar');
                }
            } catch (e) {
                console.warn('Failed to load settings', e);
            }
        })();
    }, [user]);

    // Persist whenever a setting changes
    useEffect(() => {
        if (!user) return;

        const data = { notifications, sounds, vibration, language };
        const key = `app_settings_${sanitizeEmail(user.email)}`;
        AsyncStorage.setItem(key, JSON.stringify(data)).catch(e => console.warn('Failed to save settings', e));
    }, [notifications, sounds, vibration, language, user]);

    const toggleNotifications = () => setNotifications(prev => !prev);
    const toggleSounds = () => setSounds(prev => !prev);
    const toggleVibration = () => setVibration(prev => !prev);
    const changeLanguage = (lang) => setLanguage(lang);

    return (
        <SettingsContext.Provider
            value={{
                notifications,
                sounds,
                vibration,
                language,
                toggleNotifications,
                toggleSounds,
                toggleVibration,
                changeLanguage,
                isFirstLaunch,
                completeOnboarding,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
