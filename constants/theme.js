/**
 * World-Class Theme Colors
 * Inspired by Apple, Nike, Airbnb, and modern design trends
 * Premium color palette with perfect contrast and accessibility
 */

export const Colors = {
    light: {
        // Core Brand Colors (Premium Indigo/Purple - Apple-inspired)
        primary: '#6366F1',        // Vibrant Indigo
        primaryDark: '#4F46E5',    // Deep Indigo
        primaryLight: '#818CF8',   // Light Indigo

        // Background System
        background: '#FFFFFF',      // Pure White
        backgroundSecondary: '#F9FAFB',  // Subtle Gray

        // Card System
        card: '#FFFFFF',
        cardSecondary: '#F3F4F6',   // Light Gray Card

        // Text Hierarchy
        text: '#111827',            // Almost Black
        textSecondary: '#6B7280',   // Medium Gray
        textLight: '#9CA3AF',       // Light Gray
        textInverse: '#FFFFFF',

        // Borders & Dividers
        border: '#E5E7EB',          // Subtle Border
        borderLight: '#F3F4F6',

        // Status Colors
        success: '#10B981',         // Emerald Green
        error: '#EF4444',           // Red
        warning: '#F59E0B',         // Amber
        info: '#3B82F6',            // Blue

        // Elevation & Shadows
        shadow: '#000000',
        shadowLight: 'rgba(0, 0, 0, 0.05)',
        shadowMedium: 'rgba(0, 0, 0, 0.1)',
        shadowHeavy: 'rgba(0, 0, 0, 0.15)',

        // Accent Colors (Nike-inspired)
        accent: '#FF6B35',          // Vibrant Orange
        accentSecondary: '#FFB800', // Golden Yellow

        // Overlay
        overlay: 'rgba(0, 0, 0, 0.5)',
        overlayLight: 'rgba(0, 0, 0, 0.3)',
    },

    dark: {
        // Core Brand Colors (Adjusted for dark mode)
        primary: '#818CF8',         // Lighter Indigo for visibility
        primaryDark: '#6366F1',
        primaryLight: '#A5B4FC',

        // Background System (Premium Dark)
        background: '#0F172A',      // Deep Slate
        backgroundSecondary: '#1E293B', // Lighter Slate

        // Card System
        card: '#1E293B',            // Elevated Card
        cardSecondary: '#334155',   // Lighter Card

        // Text Hierarchy
        text: '#F1F5F9',            // Almost White
        textSecondary: '#94A3B8',   // Light Slate
        textLight: '#64748B',       // Medium Slate
        textInverse: '#0F172A',

        // Borders & Dividers
        border: '#334155',
        borderLight: '#1E293B',

        // Status Colors (Adjusted for dark)
        success: '#34D399',         // Lighter Emerald
        error: '#F87171',           // Lighter Red
        warning: '#FBBF24',         // Lighter Amber
        info: '#60A5FA',            // Lighter Blue

        // Elevation & Shadows
        shadow: '#000000',
        shadowLight: 'rgba(0, 0, 0, 0.3)',
        shadowMedium: 'rgba(0, 0, 0, 0.5)',
        shadowHeavy: 'rgba(0, 0, 0, 0.7)',

        // Accent Colors
        accent: '#FF8A65',          // Softer Orange
        accentSecondary: '#FFD54F', // Softer Yellow

        // Overlay
        overlay: 'rgba(0, 0, 0, 0.7)',
        overlayLight: 'rgba(0, 0, 0, 0.5)',
    },
};

/**
 * Typography System (San Francisco-inspired)
 */
export const Typography = {
    // Display (Hero Text)
    displayLarge: {
        fontSize: 57,
        fontWeight: '900',
        lineHeight: 64,
        letterSpacing: -0.5,
    },
    displayMedium: {
        fontSize: 45,
        fontWeight: '800',
        lineHeight: 52,
        letterSpacing: -0.5,
    },
    displaySmall: {
        fontSize: 36,
        fontWeight: '700',
        lineHeight: 44,
    },

    // Headings
    h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 36,
    },
    h3: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
    },
    h4: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
    },
    h5: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 24,
    },
    h6: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 22,
    },

    // Body Text
    bodyLarge: {
        fontSize: 17,
        fontWeight: '400',
        lineHeight: 28,
    },
    body: {
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 20,
    },

    // Labels
    label: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    labelSmall: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
    },

    // Caption
    caption: {
        fontSize: 11,
        fontWeight: '400',
        lineHeight: 16,
    },
};

/**
 * Font Size shortcuts
 */
export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

/**
 * Spacing System (8pt grid)
 */
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

/**
 * Border Radius
 */
export const BorderRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    round: 9999,
    full: 9999,
};

/**
 * Elevation (Shadow Presets)
 */
export const Elevation = {
    none: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    low: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    high: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 8,
    },
    highest: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
};

/**
 * Shadows (Alias for Elevation + extra sizes)
 */
export const Shadows = {
    ...Elevation,
    sm: Elevation.low,
    md: Elevation.medium,
    lg: Elevation.high,
    xl: Elevation.highest,
};

/**
 * Spring Animation Config
 */
export const SpringConfig = {
    light: {
        damping: 15,
        stiffness: 300,
        mass: 0.5,
    },
    medium: {
        damping: 15,
        stiffness: 200,
        mass: 1,
    },
    heavy: {
        damping: 20,
        stiffness: 150,
        mass: 1.5,
    },
    bouncy: {
        damping: 10,
        stiffness: 400,
        mass: 0.5,
    },
};

