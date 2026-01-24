/**
 * Theme Context - Cosmic Luxury Minimal Design System
 * Unified Dark/Light Mode using tokens.js
 * 
 * API: { theme, isDark, toggleTheme, tokens }
 * - theme.colors = current color palette
 * - tokens = full access to spacing, radius, typography, etc.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, spacing, radius, typography, animations, layout, shadows } from '../theme/tokens';

const ThemeContext = createContext();

// ─────────────────────────────────────────
// Legacy exports (for backward compatibility)
// Components using LIGHT_THEME/DARK_THEME will still work
// ─────────────────────────────────────────
export const LIGHT_THEME = {
    ...lightTheme.colors,
    // Legacy aliases
    backgroundCard: lightTheme.colors.card,
    backgroundGlass: lightTheme.colors.surfaceGlass,
    accentGold: lightTheme.colors.accent,
    moonSilver: lightTheme.colors.backgroundTertiary,
    glow: lightTheme.colors.primarySoft,
};

export const DARK_THEME = {
    ...darkTheme.colors,
    // Legacy aliases
    backgroundCard: darkTheme.colors.card,
    backgroundGlass: darkTheme.colors.surfaceGlass,
    accentGold: darkTheme.colors.accent,
    moonSilver: darkTheme.colors.backgroundTertiary,
    glow: darkTheme.colors.primarySoft,
};

// ─────────────────────────────────────────
// Theme Provider
// ─────────────────────────────────────────
export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme === 'dark') {
                setIsDark(true);
            }
        } catch (error) {
            console.log('Error loading theme:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newIsDark = !isDark;
            setIsDark(newIsDark);
            await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
        } catch (error) {
            console.log('Error saving theme:', error);
        }
    };

    // Memoized theme object to prevent unnecessary re-renders
    const value = useMemo(() => ({
        // Current theme colors (backward compatible)
        theme: isDark ? DARK_THEME : LIGHT_THEME,

        // Boolean flag
        isDark,

        // Toggle function
        toggleTheme,

        // Full tokens access (NEW)
        tokens: {
            colors: isDark ? darkTheme.colors : lightTheme.colors,
            spacing,
            radius,
            typography,
            title: typography.sizes.title,
            hero: typography.sizes.hero,
            shadows: isDark ? shadows.dark : shadows,
            animations,
            layout,
        },
    }), [isDark]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Default export to satisfy Expo Router requirements if it processes this file
export default function ThemeContextRoute() {
    return null;
}
