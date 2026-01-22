/**
 * Admin Layout - Kataraa
 * Layout for admin screens
 * 🔐 Protected by RequireAdmin - only admins can access
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import RequireAdmin from '../../src/components/RequireAdmin';

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

                {/* Analytics & Reports */}
                <Stack.Screen name="analytics" />
                <Stack.Screen name="analytics-dashboard" />

                {/* Settings */}
                <Stack.Screen name="settings" />
            </Stack>
        </RequireAdmin>
    );
}
