/**
 * RequireAdmin - Kataraa
 * Protected wrapper component for admin routes
 * 🔐 Prevents unauthorized access to admin pages
 * Uses useAdminGuard hook for route protection
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAdminGuard } from '../guards/role.guard';

export default function RequireAdmin({ children }) {
    const { theme } = useTheme();
    const { isAllowed, isChecking, redirectTo } = useAdminGuard();

    // Show loading while guard is checking
    if (isChecking) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                    جارٍ التحقق من الصلاحيات...
                </Text>
            </View>
        );
    }

    // Not allowed - show error (redirect is handled by guard)
    if (!isAllowed) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={styles.errorIcon}>🚫</Text>
                <Text style={[styles.errorTitle, { color: theme.text }]}>
                    صفحة المشرفين فقط
                </Text>
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                    هذه الصفحة مخصصة للمشرفين فقط. لا تملك صلاحيات الوصول إليها.
                </Text>
                <Text style={[styles.redirectText, { color: theme.textMuted }]}>
                    جارٍ إعادة التوجيه...
                </Text>
            </View>
        );
    }

    // ✅ Access granted - render protected content
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
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    errorText: {
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
