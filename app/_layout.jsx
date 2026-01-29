/**
 * Root Layout - Kataraa
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSettings } from '../src/context/SettingsContext';
import { ConsentModal } from '../src/components/ui';

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
import { RecentlyViewedProvider } from '../src/context/RecentlyViewedContext';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../src/components/GlobalErrorBoundary';
import { PatternBackground } from '../src/components/ui';
import '../src/services/firebaseConfig';

import { useFonts } from 'expo-font';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  // Keep splash screen visible while loading
  SplashScreen.preventAutoHideAsync();

  // Load premium fonts (Uncomment when you have the .ttf files in assets/fonts)
  /*
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
  });
  */

  // Temporary bypass until fonts are added
  const fontsLoaded = true;

  useEffect(() => {
    // Hide splash screen only when fonts are ready
    if (fontsLoaded) {
      const hideSplash = async () => {
        await SplashScreen.hideAsync();
      };
      hideSplash();
    }
  }, [fontsLoaded]);

  // Return null to keep Splash Screen visible if fonts aren't loaded
  if (!fontsLoaded) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SettingsProvider>
            <NotificationProvider>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <AuthProvider>
                  <CartProvider>
                    <CartAnimationProvider>
                      <FavoritesProvider>
                        <RecentlyViewedProvider>
                          <CheckoutProvider>
                            <AppNavigator />
                          </CheckoutProvider>
                        </RecentlyViewedProvider>
                      </FavoritesProvider>
                    </CartAnimationProvider>
                  </CartProvider>
                </AuthProvider>
              </ErrorBoundary>
            </NotificationProvider>
          </SettingsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { theme } = useTheme();
  const { consentGiven } = useSettings();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <Stack screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: 'transparent' },
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="checkout/index" options={{ title: 'Checkout' }} />
        <Stack.Screen name="checkout/success" />
        <Stack.Screen name="auth" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="orders" />
        <Stack.Screen name="voice-search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <ConsentModal visible={consentGiven === null} />
    </View>
  );
}

