/**
 * RequireAuth - Kataraa
 * Protected wrapper component for authenticated routes
 * 🔐 Ensures user is logged in (any role)
 * Uses useAuthGuard hook for route protection
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthGuard } from '../guards/role.guard';

export default function RequireAuth({ children }) {
    const { theme } = useTheme();
    const { isAllowed, isChecking } = useAuthGuard();

    // Show loading while guard is checking
    if (isChecking) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                    جارٍ التحقق...
                </Text>
            </View>
        );
    }

    // Not logged in - show message (redirect is handled by guard)
    if (!isAllowed) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={[styles.title, { color: theme.text }]}>
                    يجب تسجيل الدخول
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    سجّل الدخول للوصول إلى هذه الصفحة
                </Text>
                <Text style={[styles.redirectText, { color: theme.textMuted }]}>
                    جارٍ إعادة التوجيه...
                </Text>
            </View>
        );
    }

    // ✅ User is authenticated - render content
    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    redirectText: {
        marginTop: 20,
        fontSize: 13,
    },
});
