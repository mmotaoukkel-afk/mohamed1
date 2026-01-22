/**
 * Input Component - Kataraa UI Kit
 * 
 * Unified text input with consistent height, radius, and focus states.
 * Supports: search mode, icons, error states
 */

import React, { useState } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Text } from './Text';

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input = ({
    value,
    onChangeText,
    placeholder,
    variant = 'default',    // default | search
    size = 'md',            // sm | md | lg
    leftIcon,               // Icon name from Ionicons
    rightIcon,
    onRightIconPress,
    label,
    helpText,
    error,                  // Error message string
    disabled = false,
    secureTextEntry = false,
    multiline = false,
    numberOfLines = 1,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    returnKeyType,
    onSubmitEditing,
    onFocus,
    onBlur,
    style,
    inputStyle,
    containerStyle,
    ...props
}) => {
    const { tokens, isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const borderProgress = useSharedValue(0);

    // Size configurations
    const sizes = {
        sm: { height: 40, iconSize: 18, fontSize: tokens.typography.sizes.sm },
        md: { height: 48, iconSize: 20, fontSize: tokens.typography.sizes.md },
        lg: { height: 56, iconSize: 22, fontSize: tokens.typography.sizes.lg },
    };

    const currentSize = sizes[size];

    const handleFocus = (e) => {
        setIsFocused(true);
        borderProgress.value = withTiming(1, { duration: 200 });
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        borderProgress.value = withTiming(0, { duration: 200 });
        onBlur?.(e);
    };

    const animatedBorderStyle = useAnimatedStyle(() => ({
        borderColor: error
            ? tokens.colors.error
            : borderProgress.value === 1
                ? tokens.colors.borderFocus
                : tokens.colors.border,
        borderWidth: borderProgress.value === 1 ? 1.5 : 1,
    }));

    const containerStyles = [
        styles.container,
        {
            height: multiline ? undefined : currentSize.height,
            minHeight: multiline ? currentSize.height * numberOfLines : undefined,
            backgroundColor: tokens.colors.surface,
            borderRadius: tokens.radius.input,
            paddingHorizontal: tokens.spacing.md,
        },
        disabled && { opacity: 0.5, backgroundColor: tokens.colors.backgroundSecondary },
        style,
    ];

    const inputStyles = [
        styles.input,
        {
            fontSize: currentSize.fontSize,
            color: tokens.colors.text,
        },
        leftIcon && { paddingLeft: 8 },
        rightIcon && { paddingRight: 8 },
        inputStyle,
    ];

    // Search variant
    const searchIcon = variant === 'search' ? 'search-outline' : leftIcon;

    return (
        <View style={[styles.wrapper, containerStyle]}>
            {label && (
                <Text variant="label" style={[styles.label, { color: error ? tokens.colors.error : tokens.colors.text }]}>
                    {label}
                </Text>
            )}

            <AnimatedView style={[containerStyles, animatedBorderStyle]}>
                {searchIcon && (
                    <Ionicons
                        name={searchIcon}
                        size={currentSize.iconSize}
                        color={isFocused ? tokens.colors.primary : tokens.colors.textMuted}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={tokens.colors.textMuted}
                    editable={!disabled}
                    secureTextEntry={secureTextEntry}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmitEditing}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyles}
                    {...props}
                />

                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                        style={styles.rightIcon}
                    >
                        <Ionicons
                            name={rightIcon}
                            size={currentSize.iconSize}
                            color={tokens.colors.textMuted}
                        />
                    </TouchableOpacity>
                )}

                {variant === 'search' && value?.length > 0 && (
                    <TouchableOpacity
                        onPress={() => onChangeText?.('')}
                        style={styles.rightIcon}
                    >
                        <Ionicons
                            name="close-circle"
                            size={currentSize.iconSize}
                            color={tokens.colors.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </AnimatedView>

            {helpText && !error && (
                <Text variant="caption" style={styles.helpText}>
                    {helpText}
                </Text>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={14} color={tokens.colors.error} />
                    <Text variant="caption" color="error" style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            )}
        </View>
    );
};

// Search Input convenience component
export const SearchInput = (props) => (
    <Input variant="search" placeholder="Search..." {...props} />
);

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 0,
        margin: 0,
    },
    leftIcon: {
        marginRight: 8,
    },
    rightIcon: {
        marginLeft: 8,
        padding: 4,
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
        fontWeight: '600',
    },
    helpText: {
        marginTop: 4,
        marginLeft: 4,
        opacity: 0.6,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginLeft: 4,
    },
    errorText: {
        marginLeft: 4,
    },
});

export default Input;
