/**
 * Admin Dashboard Design Tokens
 * Professional High-Tech Color System
 */

export const ADMIN_COLORS = {
    // Primary Palette (Tech Leadership)
    primary: {
        main: '#4F46E5',      // Deep Indigo
        light: '#6366F1',
        dark: '#4338CA',
        contrast: '#FFFFFF',
    },

    // Secondary (Data & Analytics)
    secondary: {
        main: '#06B6D4',      // Cyan
        light: '#22D3EE',
        dark: '#0891B2',
        contrast: '#FFFFFF',
    },

    // Accent (Premium)
    accent: {
        main: '#8B5CF6',      // Purple
        light: '#A78BFA',
        dark: '#7C3AED',
        contrast: '#FFFFFF',
    },

    // Status Colors
    success: {
        main: '#10B981',      // Emerald
        light: '#34D399',
        dark: '#059669',
        bg: '#D1FAE5',
        bgDark: '#064E3B',
    },

    warning: {
        main: '#F59E0B',      // Amber
        light: '#FBBF24',
        dark: '#D97706',
        bg: '#FEF3C7',
        bgDark: '#78350F',
    },

    error: {
        main: '#EF4444',      // Red
        light: '#F87171',
        dark: '#DC2626',
        bg: '#FEE2E2',
        bgDark: '#7F1D1D',
    },

    info: {
        main: '#3B82F6',      // Blue
        light: '#60A5FA',
        dark: '#2563EB',
        bg: '#DBEAFE',
        bgDark: '#1E3A8A',
    },

    // Neutrals
    neutral: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
    },
};

export const ADMIN_GRADIENTS = {
    primary: ['#4F46E5', '#7C3AED'],
    data: ['#06B6D4', '#3B82F6'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#EF4444'],
    revenue: ['#8B5CF6', '#EC4899'],
    tech: ['#4F46E5', '#06B6D4'],
};

export const ADMIN_SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 8,
    },
    colored: (color) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    }),
};

export const CHART_COLORS = {
    revenue: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
    orders: ['#06B6D4', '#22D3EE', '#67E8F9'],
    categories: ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'],
    status: {
        pending: '#F59E0B',
        confirmed: '#3B82F6',
        shipped: '#8B5CF6',
        delivered: '#10B981',
        cancelled: '#EF4444',
    },
};

export const TYPOGRAPHY = {
    fontSizes: {
        xs: 10,
        sm: 12,
        base: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
        '3xl': 24,
        '4xl': 28,
        '5xl': 32,
    },
    fontWeights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
};

export const BORDER_RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
};
