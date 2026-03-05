/**
 * Admin Layout - Kataraa
 * Layout for admin screens
 * 🔐 Protected by RequireAdmin - only admins can access
 */

import { Stack } from 'expo-router';
import RequireAdmin from '../../src/components/RequireAdmin';
import { useTheme } from '../../src/context/ThemeContext';

export default function AdminLayout() {
    const { theme } = useTheme();

    return (
        <RequireAdmin>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.background },
                    animation: 'slide_from_right',
                }}
            >
                {/* Main Overview (Dashboard Home) */}
                <Stack.Screen name="overview" />

                {/* Management Pages */}
                <Stack.Screen name="products" />
                <Stack.Screen name="orders" />
                <Stack.Screen name="customers" />
                <Stack.Screen name="reviews" />

                {/* Analytics & Reports */}
                <Stack.Screen name="analytics" />
                <Stack.Screen name="analytics-dashboard" />
                <Stack.Screen name="revenue" />

                {/* Settings & Shipping */}
                <Stack.Screen name="settings" />
                <Stack.Screen name="shipping" />
            </Stack>
        </RequireAdmin>
    );
}
