/**
 * Root Layout - Kataraa
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from 'react-error-boundary';
import AddToCartAnimation from '../src/components/AddToCartAnimation';
import { ErrorFallback } from '../src/components/GlobalErrorBoundary';
import PremiumSplash from '../src/components/PremiumSplash';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider, useCart } from '../src/context/CartContext';
import { CheckoutProvider } from '../src/context/CheckoutContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { SettingsProvider } from '../src/context/SettingsContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import '../src/services/firebaseConfig';


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
  const [showSplash, setShowSplash] = useState(true);

  // Keep native splash screen visible while loading
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
    // Hide native splash screen immediately to show our custom PremiumSplash
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

  // Show our custom PremiumSplash with the new kataraa logo
  if (showSplash) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <PremiumSplash onFinish={() => setShowSplash(false)} />
        </ThemeProvider>
      </GestureHandlerRootView>
    );
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
                    <FavoritesProvider>
                      <CheckoutProvider>
                        <InnerApp />
                      </CheckoutProvider>
                    </FavoritesProvider>
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

function InnerApp() {
  const { animationState, endAnimation } = useCart();

  return (
    <>
      <AppNavigator />
      {/* Global Add to Cart Animation Overlay */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, elevation: 99999 }} pointerEvents="box-none">
        <AddToCartAnimation
          state={animationState}
          onComplete={endAnimation}
        />
      </View>
    </>
  );
}


function AppNavigator() {
  const { theme, isDark, tokens } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/* ✨ Premium Background Pattern - Logo Colors (Global) */}


      <Stack screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: theme.background },
      }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="checkout/shipping" />
        <Stack.Screen name="checkout/payment" />
        <Stack.Screen name="checkout/success" />
        <Stack.Screen name="auth" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="orders" />
        <Stack.Screen name="voice-search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  bgOrb1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    zIndex: 0,
  },
  bgOrb2: {
    position: 'absolute',
    bottom: 50,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: 0,
  },
  bgOrb3: {
    position: 'absolute',
    top: 300, // Fixed value instead of height * 0.4
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    zIndex: 0,
  },
});
