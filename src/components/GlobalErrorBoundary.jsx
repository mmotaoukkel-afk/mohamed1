import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
    // Defensive context consumption - these might be undefined if the error happened high in the tree
    const themeContext = useTheme();
    const translationContext = useTranslation();

    const theme = themeContext?.theme || { background: '#fff', text: '#000', error: '#f44336', primary: '#000', textSecondary: '#666' };
    const t = translationContext?.t || ((k) => k);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
                    <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>
                    {t('somethingWentWrong') || 'Something went wrong'}
                </Text>

                <Text style={[styles.message, { color: theme.textSecondary }]}>
                    {error.message}
                </Text>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={resetErrorBoundary}
                >
                    <Text style={styles.buttonText}>
                        {t('tryAgain') || 'Try Again'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ErrorFallback;
