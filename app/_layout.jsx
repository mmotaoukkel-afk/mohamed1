import { Slot } from "expo-router";
import { useEffect } from "react";
import { AuthProvider } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CardContext";
import { CheckoutProvider } from "../src/context/CheckoutContext";
import { FavoritesProvider } from "../src/context/FavoritesContext";
import { SettingsProvider } from "../src/context/SettingsContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { registerForPushNotificationsAsync } from "../src/utils/notifications";
import ErrorBoundary from "./components/ErrorBoundary";

export default function RootLayout() {
   useEffect(() => {
      // Wrap in try-catch to handle Expo Go limitations gracefully
      (async () => {
         try {
            await registerForPushNotificationsAsync();
         } catch (error) {
            console.log('Notifications setup skipped (Expo Go limitation)');
         }
      })();
   }, []);

   return (
      <ErrorBoundary>
         <AuthProvider>
            <SettingsProvider>
               <ThemeProvider>
                  <CartProvider>
                     <FavoritesProvider>
                        <CheckoutProvider>
                           <Slot />
                        </CheckoutProvider>
                     </FavoritesProvider>
                  </CartProvider>
               </ThemeProvider>
            </SettingsProvider>
         </AuthProvider>
      </ErrorBoundary>
   )
}
