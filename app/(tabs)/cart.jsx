/**
 * Cart Screen - Kataraa Comic Luxury
 * Next-Gen Design System
 */

import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useCart } from '../../src/context/CartContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { Text, Button, Surface, IconButton } from '../../src/components/ui';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { tokens, isDark } = useTheme(); // Use tokens
  const { t } = useTranslation();
  const styles = getStyles(tokens, isDark, insets);

  const formatPrice = (price) => {
    return `${parseFloat(price || 0).toFixed(3)} ${t('currency')}`;
  };

  const cartTotal = getCartTotal();
  const shippingFee = cartTotal >= 25 ? 0 : 2;
  const finalTotal = cartTotal + shippingFee;

  const renderItem = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.cartItemContainer}
    >
      <Surface variant="glass" style={styles.cartItemSurface} padding="sm">
        <View style={styles.cartItemRow}>
          <View style={styles.imageContainer}>
            <Image
              source={item.image ? { uri: item.image } : require('../../assets/images/placeholder.png')}
              style={styles.itemImage}
              contentFit="cover"
              transition={200}
            />
          </View>

          <View style={styles.itemInfo}>
            <View style={styles.itemHeader}>
              <Text variant="body" weight="bold" numberOfLines={2} style={{ flex: 1, marginRight: 8 }}>
                {item.name}
              </Text>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={20} color={tokens.colors.error} />
              </TouchableOpacity>
            </View>

            <Text variant="title" style={{ color: tokens.colors.primary, marginVertical: 4 }}>
              {formatPrice(item.price)}
            </Text>

            <View style={styles.controlsRow}>
              <View style={[styles.quantityControl, { backgroundColor: tokens.colors.background }]}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={16} color={tokens.colors.text} />
                </TouchableOpacity>

                <Text variant="body" weight="bold" style={styles.qtyText}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color={tokens.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Surface>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Background Orbs */}
      <View style={[styles.orb, { backgroundColor: tokens.colors.primary + '10', top: -50, right: -50 }]} />
      <View style={[styles.orb, { backgroundColor: tokens.colors.accent + '10', bottom: 100, left: -50 }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-back"
            variant="ghost"
            onPress={() => router.back()}
          />
          <Text variant="title" style={{ flex: 1, textAlign: 'center' }}>{t('cartTitle')}</Text>
          {cartItems.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <Text variant="label" style={{ color: tokens.colors.error }}>{t('clearAll')}</Text>
            </TouchableOpacity>
          )}
          {cartItems.length === 0 && <View style={{ width: 40 }} />}
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: tokens.colors.primary + '15' }]}>
              <Ionicons name="cart-outline" size={64} color={tokens.colors.primary} />
            </View>
            <Text variant="title" style={{ marginTop: 24, marginBottom: 8 }}>{t('emptyCartTitle')}</Text>
            <Text variant="body" style={{ color: tokens.colors.textSecondary, marginBottom: 32 }}>{t('emptyCartSubtitle')}</Text>
            <Button
              title={t('shopNow')}
              onPress={() => router.push('/')}
              style={{ width: 200 }}
              icon={<Ionicons name="bag-handle-outline" size={20} color="#FFF" />}
            />
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />

            <Surface variant="glass" style={styles.summaryFooter} padding="md" intensity={isDark ? 60 : 80}>
              <View style={styles.summaryRow}>
                <Text variant="body" style={{ color: tokens.colors.textSecondary }}>{t('subtotal')}</Text>
                <Text variant="body" weight="bold">{formatPrice(cartTotal)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="body" style={{ color: tokens.colors.textSecondary }}>{t('shipping')}</Text>
                <Text variant="body" weight="bold" style={{ color: shippingFee === 0 ? tokens.colors.success : tokens.colors.text }}>
                  {shippingFee === 0 ? t('free') : formatPrice(shippingFee)}
                </Text>
              </View>

              {shippingFee > 0 && (
                <View style={[styles.shippingAlert, { backgroundColor: tokens.colors.warning + '15' }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={tokens.colors.warning} />
                  <Text variant="caption" style={{ color: tokens.colors.warning, marginLeft: 6 }}>
                    {t('addForFreeShipping', { amount: formatPrice(25 - cartTotal) })}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />

              <View style={styles.summaryRow}>
                <Text variant="title">{t('total')}</Text>
                <Text variant="title" style={{ color: tokens.colors.primary }}>{formatPrice(finalTotal)}</Text>
              </View>

              <Button
                title={t('checkout')}
                onPress={() => router.push('/checkout')}
                style={{ marginTop: 16 }}
                variant="primary"
                icon={<Ionicons name="card-outline" size={20} color="#FFF" />}
              />
            </Surface>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const getStyles = (tokens, isDark, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  orb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  listContent: {
    padding: 20,
    paddingBottom: 250,
  },
  cartItemContainer: {
    marginBottom: 16,
  },
  cartItemSurface: {
    borderRadius: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: tokens.colors.background,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    paddingHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryFooter: {
    position: 'absolute',
    bottom: insets.bottom + 90, // Position above the Custom Tab Bar
    left: 20,
    right: 20,
    borderRadius: 24, // Full rounded card
    padding: 20,
    // paddingBottom: 40, // Not needed as it's floating
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
    shadowColor: tokens.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shippingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
