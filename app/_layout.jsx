/**
 * Root Layout - Kataraa
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { CartProvider } from '../src/context/CartContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { CheckoutProvider } from '../src/context/CheckoutContext';
import { CartAnimationProvider } from '../src/context/CartAnimationContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { SettingsProvider } from '../src/context/SettingsContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../src/components/GlobalErrorBoundary';
import '../src/services/firebaseConfig';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after layout is ready
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <SettingsProvider>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <AuthProvider>
              <CartProvider>
                <CartAnimationProvider>
                  <FavoritesProvider>
                    <CheckoutProvider>
                      <AppNavigator />
                    </CheckoutProvider>
                  </FavoritesProvider>
                </CartAnimationProvider>
              </CartProvider>
            </AuthProvider>
          </ErrorBoundary>
        </SettingsProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

function AppNavigator() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: theme.background },
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="checkout/shipping" />
        <Stack.Screen name="checkout/payment" />
        <Stack.Screen name="checkout/success" />
        <Stack.Screen name="auth" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="orders" />
        <Stack.Screen name="voice-search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

