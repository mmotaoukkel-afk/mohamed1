/**
 * Kataraa Design System - Unified Tokens
 * "Rose Gold & Deep Charcoal" Theme
 * 
 * ⚠️ RULE: Never use hex colors directly in components!
 *    Always import from this file or use useTheme() hook.
 */

// ============================================
// 🎨 COLOR TOKENS
// ============================================

export const colors = {
    // ─────────────────────────────────────────
    // LIGHT MODE - Luxury Pearl
    // ─────────────────────────────────────────
    light: {
        // Primary - Rose Gold
        primary: '#D4AF76',        // Rose Gold - Main CTA
        primaryDark: '#B8924F',    // Dark Gold - Interactions
        primaryLight: '#E8D5B7',   // Light Champagne - Backgrounds
        primarySoft: '#FFF5F7',    // Very light tint - Hover/Subtle

        // Secondary - Deep Charcoal
        secondary: '#2C2C2C',      // Deep Charcoal - Strong accents
        secondaryLight: '#6B6B6B', // Medium Gray
        secondarySoft: '#E8B4B8',  // Soft Pink accent

        // Backgrounds
        background: '#FFFFFF',        // Pure White
        backgroundSecondary: '#F5F5F5', // Light Gray - Cards/Sections
        backgroundTertiary: '#F9FAFB', // Subtle backgrounds

        // Cards & Surfaces
        card: '#FFFFFF',
        cardElevated: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceGlass: 'rgba(255, 255, 255, 0.7)',

        // Text Hierarchy
        text: '#2C2C2C',              // Primary text - Deep Charcoal
        textSecondary: '#6B6B6B',     // Secondary text - Medium Gray
        textMuted: '#B8B8B8',         // Disabled/Placeholder
        textOnPrimary: '#FFFFFF',     // Text on primary buttons
        textOnDark: '#FFFFFF',        // Text on dark backgrounds

        // Borders
        border: 'rgba(44, 44, 44, 0.1)',
        borderLight: 'rgba(44, 44, 44, 0.05)',
        borderFocus: '#D4AF76',

        // Status Colors
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#D32F2F',

        // Special
        overlay: 'rgba(44, 44, 44, 0.6)',
        shadow: 'rgba(212, 175, 118, 0.25)', // Gold tinted shadow
        shimmer: '#F5F5F5',
    },

    // ─────────────────────────────────────────
    // DARK MODE - Midnight Luxury
    // ─────────────────────────────────────────
    dark: {
        // Primary - Rose Gold (Glowing)
        primary: '#D4AF76',           // Rose Gold
        primaryDark: '#B8924F',       // Dark Gold
        primaryLight: '#E8D5B7',      // Light Champagne
        primarySoft: 'rgba(212, 175, 118, 0.15)',

        // Secondary - Deep Black
        secondary: '#FFFFFF',         // White text/icons
        secondaryLight: '#A0A0A0',    // Light Gray
        secondarySoft: '#2C2C2C',     // Dark Charcoal

        // Backgrounds
        background: '#1A1A1A',        // Deep Black/Charcoal
        backgroundSecondary: '#2C2C2C', // Darker Charcoal
        backgroundTertiary: '#121212', // Pure Black

        // Cards & Surfaces
        card: '#2C2C2C',
        cardElevated: '#383838',
        surface: '#2C2C2C',
        surfaceGlass: 'rgba(26, 26, 26, 0.85)',

        // Text Hierarchy
        text: '#FFFFFF',              // Primary Text
        textSecondary: '#B8B8B8',     // Secondary Text
        textMuted: '#666666',         // Muted Text
        textOnPrimary: '#1A1A1A',     // Dark text on gold buttons

        // Borders
        border: 'rgba(255, 255, 255, 0.1)',
        borderLight: 'rgba(255, 255, 255, 0.05)',
        borderFocus: '#D4AF76',

        // Status Colors
        success: '#66BB6A',
        warning: '#FFA726',
        error: '#EF5350',

        // Special
        overlay: 'rgba(0, 0, 0, 0.8)',
        shadow: 'rgba(0, 0, 0, 0.5)',
        shimmer: '#2C2C2C',
    },
};

// ============================================
// 📏 SPACING TOKENS (8pt grid)
// ============================================

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,

    // Semantic aliases
    screenPadding: 20,
    sectionGap: 32,
    cardGap: 16,
    itemGap: 12,
};

// ============================================
// 🔲 RADIUS TOKENS
// ============================================

export const radius = {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,               // Primary radius for cards
    xl: 24,
    xxl: 32,
    round: 999,           // Circular elements

    // Semantic aliases
    button: 12,
    card: 16,
    input: 12,
    badge: 6,
};

// ============================================
// 🔤 TYPOGRAPHY TOKENS
// ============================================

export const typography = {
    // Font Families (React Native requires loading these fonts separately)
    fontFamilies: {
        heading: 'PlayfairDisplay-Bold', // Requires font asset
        body: 'Inter-Regular',           // Requires font asset
        button: 'Montserrat-Medium',     // Requires font asset
    },

    // Fixed Sizes
    sizes: {
        xs: 11,             // Captions
        sm: 13,             // Helper text
        md: 15,             // Body text
        lg: 17,             // Large body
        xl: 20,             // H4
        xxl: 24,            // H3
        display: 28,        // H2
        hero: 32,           // H1
    },

    // Weights
    weights: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Line heights
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.8,
    },

    // Letter spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
    },
};

// ============================================
// 🌑 SHADOW TOKENS
// ============================================

export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    // Level 1 - Subtle
    sm: {
        shadowColor: '#D4AF76',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    // Level 2 - Medium
    md: {
        shadowColor: '#D4AF76',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    // Level 3 - Primary/Hover
    lg: {
        shadowColor: '#D4AF76',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    // Glass Effect
    glass: {
        shadowColor: '#1F2687',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
        elevation: 4,
    },

    // Dark mode shadows
    dark: {
        none: {
            shadowColor: 'transparent',
            elevation: 0,
        },
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            elevation: 8,
        },
        glass: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 32,
            elevation: 4,
        }
    },
};

// ============================================
// ⏱️ ANIMATION TOKENS
// ============================================

export const animations = {
    durations: {
        fast: 150,
        normal: 300,
        slow: 500,
    },
    easings: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: { damping: 15, stiffness: 100 },
    },
};

// ============================================
// 📐 LAYOUT TOKENS
// ============================================

export const layout = {
    headerHeight: 60,
    tabBarHeight: 65,
    inputHeight: 50,
    buttonHeight: 50,
    iconButtonSize: 44,
    avatarSizes: {
        sm: 32,
        md: 44,
        lg: 60,
        xl: 80,
    },
};

// ============================================
// 🎨 GRADIENT PRESETS
// ============================================

export const gradients = {
    primary: ['#D4AF76', '#E8B4B8'], // Rose Gold to Soft Pink
    dark: ['#2C2C2C', '#1A1A1A'],    // Charcoal Gradient
    glass: {
        light: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.5)'],
        dark: ['rgba(44,44,44,0.9)', 'rgba(26,26,26,0.95)'],
    },
};

// ============================================
// 🏷️ THEME OBJECTS
// ============================================

export const lightTheme = {
    colors: colors.light,
    spacing,
    radius,
    typography,
    shadows,
    animations,
    layout,
    gradients,
    isDark: false,
};

export const darkTheme = {
    colors: colors.dark,
    spacing,
    radius,
    typography,
    shadows: shadows.dark,
    animations,
    layout,
    gradients,
    isDark: true,
};

// Default export
export default {
    colors,
    spacing,
    radius,
    typography,
    shadows,
    animations,
    layout,
    gradients,
    lightTheme,
    darkTheme,
};
