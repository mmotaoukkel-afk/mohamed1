/**
 * Button Component - Kataraa UI Kit
 * 
 * Variants: primary | secondary | text
 * Sizes: sm | md | lg
 * 
 * Features:
 * - Press animation (scale 0.98)
 * - Loading state with ActivityIndicator
 * - Disabled state
 * - Full width option
 */

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button = ({
    children,
    title,                  // Optional title text (alternative to children)
    variant = 'primary',    // primary | secondary | text
    size = 'md',            // sm | md | lg
    onPress,
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,                   // Optional icon component
    iconPosition = 'left',  // left | right
    style,
    textStyle,
    ...props
}) => {
    const { tokens, isDark } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    };

    // Size configurations
    const sizes = {
        sm: { height: 36, paddingHorizontal: 16, fontSize: tokens.typography.sizes.sm },
        md: { height: 48, paddingHorizontal: 24, fontSize: tokens.typography.sizes.md },
        lg: { height: 56, paddingHorizontal: 32, fontSize: tokens.typography.sizes.lg },
    };

    const currentSize = sizes[size];

    // Variant styles
    const getVariantStyles = () => {
        const { colors, shadows } = tokens;

        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: colors.primary,
                    textColor: colors.textOnPrimary,
                    borderWidth: 0,
                    // Add premium shadow
                    ...shadows.md,
                    shadowColor: colors.primary, // Tinted shadow
                };
            case 'secondary':
                return {
                    backgroundColor: 'transparent',
                    textColor: colors.text,
                    borderWidth: 1.5,
                    borderColor: colors.borderFocus,
                };
            case 'text':
                return {
                    backgroundColor: 'transparent',
                    textColor: colors.primary,
                    borderWidth: 0,
                };
            default:
                return {
                    backgroundColor: colors.primary,
                    textColor: colors.textOnPrimary,
                    borderWidth: 0,
                    ...shadows.md,
                };
        }
    };

    const variantStyles = getVariantStyles();

    const buttonStyles = [
        styles.base,
        {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            backgroundColor: variantStyles.backgroundColor,
            borderWidth: variantStyles.borderWidth,
            borderColor: variantStyles.borderColor,
            borderRadius: tokens.radius.button,
            opacity: disabled ? 0.5 : 1,
            // Apply shadows from variant
            shadowColor: variantStyles.shadowColor,
            shadowOffset: variantStyles.shadowOffset,
            shadowOpacity: variantStyles.shadowOpacity,
            shadowRadius: variantStyles.shadowRadius,
            elevation: variantStyles.elevation,
        },
        fullWidth && styles.fullWidth,
        style,
    ];

    const textStyles = [
        styles.text,
        {
            color: variantStyles.textColor,
            fontSize: currentSize.fontSize,
            fontFamily: tokens.typography.fontFamilies.button, // Use Montserrat
            fontWeight: tokens.typography.weights.medium,
        },
        textStyle,
    ];

    const renderContent = () => (
        <View style={styles.content}>
            {loading ? (
                <ActivityIndicator color={variantStyles.textColor} size="small" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <View style={styles.iconLeft}>{icon}</View>
                    )}
                    <Text style={textStyles}>{children || title}</Text>
                    {icon && iconPosition === 'right' && (
                        <View style={styles.iconRight}>{icon}</View>
                    )}
                </>
            )}
        </View>
    );

    // Primary variant with gradient option
    if (variant === 'primary' && !disabled) {
        return (
            <AnimatedTouchable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.9}
                style={[animatedStyle, fullWidth && styles.fullWidth, style]}
                {...props}
            >
                <LinearGradient
                    colors={[tokens.colors.primary, tokens.colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.base,
                        {
                            height: currentSize.height,
                            paddingHorizontal: currentSize.paddingHorizontal,
                            borderRadius: tokens.radius.button,
                        },
                    ]}
                >
                    {renderContent()}
                </LinearGradient>
            </AnimatedTouchable>
        );
    }

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[animatedStyle, buttonStyles]}
            {...props}
        >
            {renderContent()}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullWidth: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        textAlign: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
});

export default Button;
