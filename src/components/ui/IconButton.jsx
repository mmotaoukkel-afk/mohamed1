/**
 * IconButton Component - Kataraa UI Kit
 * 
 * Consistent icon button with optional badge for notifications.
 * Size: 40x40 (default)
 */

import React from 'react';
import {
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Text } from './Text';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const IconButton = ({
    icon,                   // Ionicons name
    onPress,
    size = 'md',            // sm | md | lg
    variant = 'default',    // default | filled | ghost
    badge,                  // Badge count (number or boolean)
    disabled = false,
    color,                  // Override icon color
    style,
    ...props
}) => {
    const { tokens, isDark } = useTheme();
    const scale = useSharedValue(1);

    // Size configurations
    const sizes = {
        sm: { container: 32, icon: 18 },
        md: { container: 40, icon: 22 },
        lg: { container: 48, icon: 26 },
    };

    const currentSize = sizes[size];

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    // Get background and icon colors
    const getVariantStyles = () => {
        switch (variant) {
            case 'filled':
                return {
                    backgroundColor: tokens.colors.primary,
                    iconColor: tokens.colors.textOnPrimary,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    iconColor: color || tokens.colors.text,
                };
            default: // default - subtle background
                return {
                    backgroundColor: tokens.colors.backgroundSecondary,
                    iconColor: color || tokens.colors.text,
                };
        }
    };

    const variantStyles = getVariantStyles();

    const containerStyles = [
        styles.container,
        {
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: currentSize.container / 2,
            backgroundColor: variantStyles.backgroundColor,
            opacity: disabled ? 0.5 : 1,
        },
        style,
    ];

    // Badge display logic
    const showBadge = badge !== undefined && badge !== false && badge !== 0;
    const badgeText = typeof badge === 'number'
        ? (badge > 99 ? '99+' : String(badge))
        : '';

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            activeOpacity={0.8}
            style={[animatedStyle, containerStyles]}
            {...props}
        >
            <Ionicons
                name={icon}
                size={currentSize.icon}
                color={variantStyles.iconColor}
            />

            {showBadge && (
                <View style={[
                    styles.badge,
                    {
                        backgroundColor: tokens.colors.error,
                        minWidth: badgeText ? 18 : 10,
                        height: badgeText ? 18 : 10,
                        borderRadius: badgeText ? 9 : 5,
                    }
                ]}>
                    {badgeText ? (
                        <Text
                            variant="caption"
                            style={[styles.badgeText, { color: '#FFFFFF' }]}
                        >
                            {badgeText}
                        </Text>
                    ) : null}
                </View>
            )}
        </AnimatedTouchable>
    );
};

// Badge component for standalone use
export const Badge = ({
    count,
    color,
    size = 'md',
    style,
}) => {
    const { tokens } = useTheme();

    const sizes = {
        sm: { minWidth: 16, height: 16, fontSize: 10 },
        md: { minWidth: 20, height: 20, fontSize: 11 },
        lg: { minWidth: 24, height: 24, fontSize: 12 },
    };

    const currentSize = sizes[size];
    const displayText = typeof count === 'number'
        ? (count > 99 ? '99+' : String(count))
        : count;

    return (
        <View style={[
            styles.standaloneBadge,
            {
                backgroundColor: color || tokens.colors.error,
                minWidth: currentSize.minWidth,
                height: currentSize.height,
                borderRadius: currentSize.height / 2,
            },
            style,
        ]}>
            <Text
                style={[
                    styles.badgeText,
                    {
                        color: '#FFFFFF',
                        fontSize: currentSize.fontSize,
                    }
                ]}
            >
                {displayText}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    standaloneBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
});

export default IconButton;
