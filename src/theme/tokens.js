/**
 * Kataraa Design System - Unified Tokens
 * "Cosmic Luxury Minimal" Theme
 * 
 * ⚠️ RULE: Never use hex colors directly in components!
 *    Always import from this file or use useTheme() hook.
 */

// ============================================
// 🎨 COLOR TOKENS
// ============================================

export const colors = {
    // ─────────────────────────────────────────
    // LIGHT MODE - Pearl Cosmos
    // ─────────────────────────────────────────
    light: {
        // Primary - Soft Orchid Violet
        primary: '#9B7BB8',           // Main CTA color
        primaryDark: '#7A5A99',       // Pressed/hover state
        primaryLight: '#C9B8DC',      // Subtle backgrounds
        primarySoft: '#F0E6F5',       // Very light tint

        // Accent - Champagne Gold (5% usage only!)
        accent: '#C9A962',            // Price badges, highlights
        accentLight: '#E8DCC8',       // Soft gold tint
        accentMuted: '#D4C49A',       // Subdued gold

        // Backgrounds (80% of UI)
        background: '#FDFBFE',        // Main background - Off-white Pearl
        backgroundSecondary: '#F8F4FC', // Cards, sections
        backgroundTertiary: '#F3EEF8', // Elevated surfaces

        // Cards & Surfaces
        card: '#FFFFFF',
        cardElevated: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceGlass: 'rgba(255, 255, 255, 0.85)',

        // Text Hierarchy
        text: '#2D2639',              // Primary text - Deep Cosmic Purple
        textSecondary: '#6B5A7A',     // Secondary text
        textMuted: '#9B8FA6',         // Muted/placeholder
        textOnPrimary: '#FFFFFF',     // Text on primary buttons

        // Borders
        border: '#EDE6F2',            // Default border
        borderLight: '#F5F0F9',       // Subtle border
        borderFocus: '#9B7BB8',       // Focus state

        // Status Colors
        success: '#5BA37B',           // Sage green
        warning: '#D4A54A',           // Warm gold
        error: '#C47070',             // Dusty rose
        info: '#6A9BC3',              // Soft sky

        // Special
        overlay: 'rgba(45, 38, 57, 0.5)',
        shadow: 'rgba(45, 38, 57, 0.08)',
        shimmer: '#F0E6F5',
    },

    // ─────────────────────────────────────────
    // DARK MODE - Deep Plum Cosmos
    // ─────────────────────────────────────────
    dark: {
        // Primary - Soft Violet (glowing)
        primary: '#B89FCC',           // Main CTA
        primaryDark: '#9B7BB8',       // Pressed state
        primaryLight: '#D4C4E8',      // Soft glow
        primarySoft: 'rgba(184, 159, 204, 0.15)',

        // Accent - Warm Gold
        accent: '#C9A962',            // Same gold, less intense
        accentLight: '#D4B87A',
        accentMuted: '#A89050',

        // Backgrounds - Deep Plum / Near-black
        background: '#0D0A12',        // Main - almost black
        backgroundSecondary: '#16121D', // Cards
        backgroundTertiary: '#1E1828', // Elevated

        // Cards & Surfaces
        card: '#1A1520',
        cardElevated: '#211A2A',
        surface: '#16121D',
        surfaceGlass: 'rgba(26, 21, 32, 0.9)',

        // Text Hierarchy
        text: '#F8F4FC',              // Pearl white
        textSecondary: '#C9B8DC',     // Soft violet
        textMuted: '#8A7A9A',         // Muted
        textOnPrimary: '#0D0A12',     // Dark text on light buttons

        // Borders
        border: 'rgba(184, 159, 204, 0.2)',
        borderLight: 'rgba(184, 159, 204, 0.1)',
        borderFocus: '#B89FCC',

        // Status Colors (same, slightly adjusted)
        success: '#6BC48B',
        warning: '#E4B55A',
        error: '#D48080',
        info: '#7AABDB',

        // Special
        overlay: 'rgba(0, 0, 0, 0.7)',
        shadow: 'rgba(0, 0, 0, 0.4)',
        shimmer: '#241E2D',
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

    // Semantic aliases
    screenPadding: 16,    // Global screen padding
    sectionGap: 24,       // Between sections
    cardGap: 12,          // Between cards
    itemGap: 8,           // Between small items
};

// ============================================
// 🔲 RADIUS TOKENS
// ============================================

export const radius = {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,               // Primary radius for cards
    xl: 24,
    xxl: 32,
    round: 999,           // Circular elements

    // Semantic aliases
    button: 14,
    card: 18,
    input: 12,
    badge: 8,
    avatar: 999,
};

// ============================================
// 🔤 TYPOGRAPHY TOKENS
// ============================================

export const typography = {
    // Size scale (6 sizes only - no clutter!)
    sizes: {
        xs: 11,             // Captions, badges
        sm: 13,             // Small labels
        md: 15,             // Body text
        lg: 17,             // Large body, subtitles
        xl: 22,             // Section titles
        hero: 28,           // Hero headings
    },

    // Weight scale
    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Line heights (relative to font size)
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.7,
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
    sm: {
        shadowColor: '#2D2639',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#2D2639',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#2D2639',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
    },
    // For dark mode (use programmatically)
    dark: {
        none: {
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
        },
        sm: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 8,
        },
    },
};

// ============================================
// ⏱️ ANIMATION TOKENS
// ============================================

export const animations = {
    // Durations (in ms)
    durations: {
        instant: 100,       // Button press
        fast: 200,          // Quick transitions
        normal: 300,        // Standard animations
        slow: 500,          // Elaborate animations
    },

    // Stagger delays
    stagger: {
        fast: 50,
        normal: 100,
        slow: 150,
    },

    // Spring configs (for react-native-reanimated)
    spring: {
        gentle: { damping: 20, stiffness: 150 },
        snappy: { damping: 15, stiffness: 300 },
        bouncy: { damping: 10, stiffness: 400 },
    },
};

// ============================================
// 📐 LAYOUT TOKENS
// ============================================

export const layout = {
    headerHeight: 56,
    tabBarHeight: 60,
    inputHeight: 48,
    buttonHeight: 48,
    iconButtonSize: 40,
    avatarSizes: {
        sm: 32,
        md: 40,
        lg: 56,
        xl: 80,
    },
};

// ============================================
// 🎨 GRADIENT PRESETS
// ============================================

export const gradients = {
    primary: ['#9B7BB8', '#7A5A99'],
    primarySoft: ['#C9B8DC', '#9B7BB8'],
    gold: ['#C9A962', '#A89050'],
    glass: {
        light: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)'],
        dark: ['rgba(26,21,32,0.9)', 'rgba(13,10,18,0.95)'],
    },
};

// ============================================
// 🏷️ THEME OBJECTS (for ThemeContext)
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
