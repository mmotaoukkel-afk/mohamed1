import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import Text from './Text';
import Button from './Button';

const EmptyState = ({
    icon = 'basket-outline',
    title,
    description,
    actionLabel,
    onAction,
    style,
}) => {
    const { tokens } = useTheme();

    return (
        <Animated.View
            entering={FadeInUp.springify().damping(15)}
            style={[styles.container, style]}
        >
            <View style={[styles.iconContainer, { backgroundColor: tokens.colors.primary + '15' }]}>
                <Ionicons name={icon} size={64} color={tokens.colors.primary} />
            </View>

            <Text variant="title" style={[styles.title, { color: tokens.colors.text }]}>
                {title}
            </Text>

            <Text variant="body" style={[styles.description, { color: tokens.colors.textSecondary }]}>
                {description}
            </Text>

            {actionLabel && onAction && (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    style={styles.button}
                    icon={<Ionicons name="arrow-forward" size={20} color="#FFF" />}
                />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
        marginBottom: 32,
        maxWidth: 300,
    },
    button: {
        minWidth: 180,
    },
});

export default EmptyState;
