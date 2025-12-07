import { Slot } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { FavoritesProvider } from "../src/context/FavoritesContext";
import { CheckoutProvider } from "../src/context/CheckoutContext";
import { CartProvider } from "../src/context/CardContext";

export default function RootLayout() {
   return (
      <AuthProvider>
         <ThemeProvider>
            <CartProvider>
               <FavoritesProvider>
                  <CheckoutProvider>
                     <Slot />
                  </CheckoutProvider>
               </FavoritesProvider>
            </CartProvider>
         </ThemeProvider>
      </AuthProvider>
   )
}
