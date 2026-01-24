/**
 * Kataraa Design System - Cosmic Luxury Theme
 * Next-Generation Beauty App - Pearl, Violet, Gold, Moon Silver
 */

// Primary Color Palette - Cosmic Luxury (Feminine)
export const COLORS = {
    // Primary - Soft Orchid Violet
    primary: '#D4B8E0',       // Soft Orchid Violet
    primaryDark: '#A78BBD',   // Deep Lavender
    primaryLight: '#F0E6F5',  // Pearl Mist

    // Accent Colors - Cosmic Elegance
    accent: '#C9B8DC',        // Moon Violet
    accentGold: '#E8DCC8',    // Champagne Gold
    moonSilver: '#E8E4EC',    // Silver Moon
    pearlWhite: '#FEFBFF',    // Pearl White

    // Status Colors
    success: '#7BB4A3',       // Sage Green (softer)
    warning: '#E8C88C',       // Warm Gold
    error: '#D4A5A5',         // Dusty Rose
    info: '#A8C5D8',          // Soft Sky

    // Neutral Colors - Pearl Cosmos
    background: '#FEFBFF',    // Pearl White
    backgroundDark: '#F8F4FC', // Lavender Mist
    card: '#ffffff',
    border: '#EDE6F2',        // Soft Violet Border
    borderDark: '#D8D0E0',

    // Text Colors - Cosmic Elegance
    text: '#2D2639',          // Deep Cosmic Purple
    textSecondary: '#6B5A7A',
    textMuted: '#9B8FA6',
    textLight: '#ffffff',

    // Special
    overlay: 'rgba(45, 38, 57, 0.4)',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassViolet: 'rgba(212, 184, 224, 0.15)',
    shadow: 'rgba(167, 139, 189, 0.12)',
};

// Gradient Presets - Cosmic Luxury
export const GRADIENTS = {
    primary: ['#D4B8E0', '#A78BBD'],
    header: ['#C9B8DC', '#A78BBD'],
    cosmicViolet: ['#D4B8E0', '#B8A0C9', '#A78BBD'],
    champagneGold: ['#F0E6F5', '#E8DCC8'],
    moonlight: ['rgba(255,255,255,0.9)', 'rgba(232,228,236,0.6)'],
    button: ['#D4B8E0', '#A78BBD'],
    card: ['#ffffff', '#FEFBFF'],
    banner: ['rgba(212,184,224,0.3)', 'rgba(167,139,189,0.6)'],
    glassLight: ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)'],
    glassDark: ['rgba(30,24,40,0.8)', 'rgba(20,16,30,0.9)'],
};

// Spacing Scale
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border Radius - More Rounded for Soft Feel
export const RADIUS = {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    xxl: 40,
    round: 999,
};

// Typography - Elegant & Modern
export const FONTS = {
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        title: 32,
        hero: 40,
    },
    weights: {
        thin: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        black: '800',
    },
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 1,
        ultraWide: 2,
    },
};

// Shadow Presets - Soft & Diffused
export const SHADOWS = {
    sm: {
        shadowColor: '#A78BBD',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    md: {
        shadowColor: '#A78BBD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    lg: {
        shadowColor: '#A78BBD',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
    },
    glow: {
        shadowColor: '#D4B8E0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
};

// Animation Timing - Cinematic & Slow
export const ANIMATIONS = {
    durations: {
        fast: 300,
        normal: 600,
        slow: 1000,
        cinematic: 1500,
        breathing: 4000,
    },
    delays: {
        stagger: 100,
        entrance: 200,
        section: 400,
    },
};

// Category Icons (for CircularCategoryIcon component)
export const CATEGORY_ICONS = [
    { id: 'masks', name: 'Masks', nameAr: 'أقنعة', icon: '🎭', color: '#E6D8F0' },
    { id: 'eyecare', name: 'Eye Care', nameAr: 'العناية بالعين', icon: '👁️', color: '#D8E6F0' },
    { id: 'suncare', name: 'Suncare', nameAr: 'واقي الشمس', icon: '☀️', color: '#F0ECD8' },
    { id: 'makeup', name: 'Makeup', nameAr: 'مكياج', icon: '💄', color: '#F0D8E6' },
    { id: 'skincare', name: 'Skincare', nameAr: 'العناية بالبشرة', icon: '✨', color: '#E0F0E6' },
    { id: 'toner', name: 'Toner', nameAr: 'تونر', icon: '💧', color: '#D8F0EC' },
    { id: 'serum', name: 'Serum', nameAr: 'سيروم', icon: '💎', color: '#E0D8F0' },
    { id: 'cleanser', name: 'Cleanser', nameAr: 'منظف', icon: '🧴', color: '#F0E6D8' },
];

export default {
    COLORS,
    GRADIENTS,
    SPACING,
    RADIUS,
    FONTS,
    SHADOWS,
    ANIMATIONS,
    CATEGORY_ICONS,
};
