/**
 * Text Component - Kataraa UI Kit
 * 
 * Typography styles: title | subtitle | body | caption | label
 * Respects dark/light theme automatically
 */

import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const Text = ({
    children,
    variant = 'body',       // title | subtitle | body | bodySmall | caption | label
    color,                  // Override color: primary | secondary | muted | accent | error | success
    weight,                 // Override weight: regular | medium | semibold | bold
    align = 'left',         // left | center | right
    numberOfLines,
    style,
    ...props
}) => {
    const { tokens } = useTheme();

    // Variant configurations
    const variants = {
        hero: {
            fontSize: tokens.typography.sizes.hero,
            fontWeight: tokens.typography.weights.bold,
            lineHeight: tokens.typography.sizes.hero * tokens.typography.lineHeights.tight,
            letterSpacing: tokens.typography.letterSpacing.tight,
        },
        title: {
            fontSize: tokens.typography.sizes.xl,
            fontWeight: tokens.typography.weights.bold,
            lineHeight: tokens.typography.sizes.xl * tokens.typography.lineHeights.tight,
            letterSpacing: tokens.typography.letterSpacing.tight,
        },
        subtitle: {
            fontSize: tokens.typography.sizes.lg,
            fontWeight: tokens.typography.weights.semibold,
            lineHeight: tokens.typography.sizes.lg * tokens.typography.lineHeights.normal,
        },
        body: {
            fontSize: tokens.typography.sizes.md,
            fontWeight: tokens.typography.weights.regular,
            lineHeight: tokens.typography.sizes.md * tokens.typography.lineHeights.normal,
        },
        bodySmall: {
            fontSize: tokens.typography.sizes.sm,
            fontWeight: tokens.typography.weights.regular,
            lineHeight: tokens.typography.sizes.sm * tokens.typography.lineHeights.normal,
        },
        caption: {
            fontSize: tokens.typography.sizes.xs,
            fontWeight: tokens.typography.weights.regular,
            lineHeight: tokens.typography.sizes.xs * tokens.typography.lineHeights.normal,
        },
        label: {
            fontSize: tokens.typography.sizes.sm,
            fontWeight: tokens.typography.weights.medium,
            lineHeight: tokens.typography.sizes.sm * tokens.typography.lineHeights.normal,
            letterSpacing: tokens.typography.letterSpacing.wide,
        },
    };

    // Color mappings
    const getColor = () => {
        if (!color) {
            // Default colors based on variant
            if (variant === 'caption' || variant === 'label') {
                return tokens.colors.textSecondary;
            }
            return tokens.colors.text;
        }

        const colorMap = {
            primary: tokens.colors.text,
            secondary: tokens.colors.textSecondary,
            muted: tokens.colors.textMuted,
            accent: tokens.colors.accent,
            error: tokens.colors.error,
            success: tokens.colors.success,
            primaryColor: tokens.colors.primary, // The violet color
        };

        return colorMap[color] || color; // Allow custom hex colors too
    };

    const variantStyle = variants[variant] || variants.body;

    const textStyles = [
        variantStyle,
        {
            color: getColor(),
            textAlign: align,
        },
        weight && { fontWeight: tokens.typography.weights[weight] || weight },
        style,
    ];

    return (
        <RNText
            style={textStyles}
            numberOfLines={numberOfLines}
            {...props}
        >
            {children}
        </RNText>
    );
};

// Convenience components
export const Title = (props) => <Text variant="title" {...props} />;
export const Subtitle = (props) => <Text variant="subtitle" {...props} />;
export const Body = (props) => <Text variant="body" {...props} />;
export const Caption = (props) => <Text variant="caption" {...props} />;
export const Label = (props) => <Text variant="label" {...props} />;

export default Text;
