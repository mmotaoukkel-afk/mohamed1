/**
 * Surface Component - Kataraa UI Kit
 * 
 * A unified card/container component with consistent
 * padding, radius, shadow, and border styling.
 * 
 * Variants: default | elevated | glass
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

export const Surface = ({
    children,
    variant = 'default',    // default | elevated | glass
    padding = 'md',         // none | sm | md | lg
    radius = 'card',        // xs | sm | md | lg | card | none
    style,
    ...props
}) => {
    const { tokens, isDark } = useTheme();

    // Padding values
    const paddingValues = {
        none: 0,
        sm: tokens.spacing.sm,
        md: tokens.spacing.md,
        lg: tokens.spacing.lg,
    };

    // Radius values
    const radiusValues = {
        none: 0,
        xs: tokens.radius.xs,
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
        card: tokens.radius.card,
    };

    // Get shadow based on variant
    const getShadow = () => {
        if (variant === 'elevated') {
            return isDark ? tokens.shadows.md : tokens.shadows.md;
        }
        if (variant === 'default') {
            return isDark ? tokens.shadows.sm : tokens.shadows.sm;
        }
        return tokens.shadows.none;
    };

    // Glass variant using BlurView
    if (variant === 'glass') {
        return (
            <BlurView
                intensity={isDark ? 40 : 60}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    styles.base,
                    {
                        padding: paddingValues[padding],
                        borderRadius: radiusValues[radius],
                        borderWidth: 1,
                        borderColor: tokens.colors.borderLight,
                        overflow: 'hidden',
                    },
                    style,
                ]}
                {...props}
            >
                {children}
            </BlurView>
        );
    }

    // Default and elevated variants
    const surfaceStyles = [
        styles.base,
        {
            backgroundColor: variant === 'elevated'
                ? tokens.colors.cardElevated
                : tokens.colors.card,
            padding: paddingValues[padding],
            borderRadius: radiusValues[radius],
            borderWidth: 1,
            borderColor: tokens.colors.border,
            ...getShadow(),
        },
        style,
    ];

    return (
        <View style={surfaceStyles} {...props}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        overflow: 'hidden',
    },
});

export default Surface;
