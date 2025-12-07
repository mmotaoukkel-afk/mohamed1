import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useState } from "react";
import { Alert, Dimensions, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from "../../src/context/AuthContext";
import { CartContext } from "../../src/context/CardContext";
import { useTheme } from "../../src/context/ThemeContext";
import { rateLimiters } from "../../src/utils/security";
import CartProduct from "../components/CartProduct";
import PremiumBackground from "../components/PremiumBackground";

const { width } = Dimensions.get('window');

const Basket = () => {
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { carts, totalPrice, deleteItemFromCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  const shippingCost = 0;
  const tax = (totalPrice * 0.1).toFixed(2); // 10% tax
  const finalTotal = (parseFloat(totalPrice) + parseFloat(tax) + shippingCost).toFixed(2);

  const handleCheckout = () => {
    // Rate limiting check
    if (rateLimiters && rateLimiters.api && !rateLimiters.api.isAllowed('checkout_attempt')) {
      Alert.alert(
        "Please Wait",
        "You're proceeding too quickly. Please wait a moment."
      );
      return;
    }

    // Check if cart has items
    if (!carts || carts.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart first.");
      return;
    }

    // Validate cart items (check for valid prices and quantities)
    const invalidItems = carts.filter(item =>
      !item.price || item.price <= 0 ||
      (item.quantity && item.quantity <= 0)
    );

    if (invalidItems.length > 0) {
      Alert.alert("Invalid Items", "Some items in your cart have invalid data. Please remove and re-add them.");
      return;
    }

    // Check if user is logged in
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please go to your profile and sign in to proceed with checkout",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Profile",
            onPress: () => {
              // Navigate to profile tab where guest screen will show sign in option
              navigation.getParent()?.navigate('profile');
            }
          }
        ]
      );
      return;
    }

    // User is logged in and cart is valid, proceed to checkout
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('ShippingScreen');
    }, 300);
  };

  return (
    <PremiumBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* PREMIUM HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSubtitle}>Shopping Cart</Text>
              <Text style={styles.headerTitle}>
                {carts.length} {carts.length === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
            <View style={styles.cartIconContainer}>
              <Feather name="shopping-bag" size={24} color="#fff" />
            </View>
          </View>
        </View>

        {carts.length === 0 ? (
          // EMPTY STATE
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="shopping-cart" size={64} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Add items to get started
            </Text>
          </Animated.View>
        ) : (
          <>
            {/* CART ITEMS */}
            <FlatList
              data={carts}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.cartItemWrapper}>
                  <CartProduct item={item} deleteItemFromCart={deleteItemFromCart} isGlass={true} />
                </View>
              )}
            />

            {/* BOTTOM SUMMARY CARD */}
            <View style={styles.bottomCard}>
              {/* Order Summary */}
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Order Summary</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${totalPrice}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={[styles.summaryValue, { color: '#4ade80' }]}>FREE</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax (10%)</Text>
                  <Text style={styles.summaryValue}>${tax}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${finalTotal}</Text>
                </View>
              </View>

              {/* CHECKOUT BUTTON */}
              <TouchableOpacity activeOpacity={0.9} onPress={handleCheckout}>
                <LinearGradient
                  colors={['#fff', '#f0f0f0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.checkoutButton}
                >
                  <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                  <Feather name="arrow-right" size={20} color="#667eea" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Trust Badges */}
              <View style={styles.trustBadges}>
                <View style={styles.trustItem}>
                  <Feather name="shield" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.trustText}>Secure Payment</Text>
                </View>
                <View style={styles.trustItem}>
                  <Feather name="truck" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.trustText}>Free Shipping</Text>
                </View>
                <View style={styles.trustItem}>
                  <Feather name="refresh-cw" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.trustText}>Easy Returns</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    </PremiumBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: 'rgba(255,255,255,0.8)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cartIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cartItemWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
  },
  bottomCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    backgroundColor: 'rgba(0,0,0,0.3)', // Darker glass for better contrast
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    height: 1,
    marginVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#fff',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutText: {
    color: '#667eea',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
});

export default Basket;
