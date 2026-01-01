/**
 * Product Details - Cosmic Museum Gallery
 * 🌙 Premium beauty product page with floating glass panels
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useAuth } from '../../src/context/AuthContext';
import AddToCartSuccess from '../../src/components/AddToCartSuccess';
import ReviewSection from '../../src/components/ReviewSection';
import socialService from '../../src/services/socialService';
import { useTranslation } from '../../src/hooks/useTranslation';
import { Surface, Text, Button, IconButton } from '../../src/components/ui'; // UI Kit

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { tokens, isDark } = useTheme(); // Use tokens

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [publicLikes, setPublicLikes] = useState(0);

  // Animation values
  const heartScale = useSharedValue(1);

  useEffect(() => {
    fetchProduct();
    // Subscribe to public likes
    const unsubscribeLikes = socialService.subscribeToProductStats(id, (count) => {
      setPublicLikes(count);
    });
    return () => unsubscribeLikes();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await api.getProduct(id);
      setProduct(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `${parseFloat(price || 0).toFixed(3)} ${t('currency')}`;
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: product.images?.[0]?.src,
      quantity,
    });
    setShowAddedMessage(true);
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
    router.push('/checkout/shipping');
  };

  const handleHeartPress = async () => {
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 6 }),
      withSpring(1, { damping: 10 })
    );

    const wasFavorite = isFavorite(product.id);

    toggleFavorite({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.src,
    });

    if (user) {
      try {
        await socialService.togglePublicLike(product.id, user.uid, !wasFavorite);
      } catch (error) {
        console.error('Error toggling public like:', error);
      }
    }
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const price = product.sale_price || product.price;
    const totalPrice = (parseFloat(price) * quantity).toFixed(3);
    const message = `👋 ${t('whatsappMessage')}\n📦 *${product.name}*\n💰 ${t('price')}: ${totalPrice} ${t('currency')}\n🔢 ${t('quantity')}: ${quantity}\n\n${t('thankYou')} 💜`;
    const whatsappUrl = `https://wa.me/9659910326?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl);
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const styles = getStyles(tokens, isDark);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingGlow} />
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={60} color={tokens.colors.primary} />
        <Text style={styles.loadingText}>{t('productNotFound')}</Text>
        <Button
          title={t('back')}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          variant="ghost"
        />
      </View>
    );
  }

  const images = product.images || [];
  const isLiked = isFavorite(product.id);
  const onSale = product.on_sale && product.regular_price;
  const discount = onSale ? Math.round((1 - product.sale_price / product.regular_price) * 100) : 0;
  const isInStock = product.stock_status === 'instock' || product.in_stock === true;

  return (
    <View style={styles.container}>
      {/* Cosmic Background Orbs */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Actions */}
        <SafeAreaView style={styles.headerRow}>
          <IconButton
            icon="arrow-back"
            size="md"
            variant="glass"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Animated.View style={heartStyle}>
              <IconButton
                icon={isLiked ? 'heart' : 'heart-outline'}
                size="md"
                variant="glass"
                onPress={handleHeartPress}
                iconColor={isLiked ? tokens.colors.error : tokens.colors.text}
              />
            </Animated.View>
            {publicLikes > 0 && (
              <View style={[styles.likeBadge, { backgroundColor: tokens.colors.primary }]}>
                <Text style={styles.likeBadgeText}>{publicLikes}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>

        {/* Hero Image - Museum Gallery Style */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
          <Surface variant="glass" radius="xxl" style={styles.imageFrame} padding="none">
            {/* Inner padding applied via wrapper View or style overrides if needed, here Surface glass handles background */}
            <View style={{ padding: 20 }}>
              <Image
                source={images[selectedImage]?.src ? { uri: images[selectedImage].src } : require('../../assets/images/placeholder.png')}
                style={styles.mainImage}
                resizeMode="contain"
              />
            </View>
          </Surface>

          {onSale && (
            <Surface variant="glass" style={styles.saleBadge} padding="sm" intensity={80}>
              <Text variant="caption" weight="bold" style={{ color: '#FFF' }}>
                ✦ {t('discountOff', { percent: discount })}
              </Text>
            </Surface>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbList}>
              {images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(index)}
                >
                  <Surface
                    variant={isDark ? "glass" : "elevated"}
                    padding="xs"
                    radius="lg"
                    style={[styles.thumb, selectedImage === index && { borderColor: tokens.colors.primary, borderWidth: 2 }]}
                  >
                    <Image source={{ uri: img.src }} style={styles.thumbImage} />
                  </Surface>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title Panel */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.titleTop}>
              <View style={[styles.stockIndicator, { backgroundColor: isInStock ? '#7BB4A3' : '#D4A5A5' }]} />
              <Text variant="label" style={{ color: isInStock ? '#7BB4A3' : '#D4A5A5', letterSpacing: 1.5 }}>
                {isInStock ? t('inStock') : t('outOfStock')}
              </Text>
            </View>
            <Text variant="display" weight="light" style={{ lineHeight: 38 }}>{product.name}</Text>
          </Animated.View>

          {/* Price Panel */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={{ marginVertical: 10 }}>
            <Surface variant="glass" radius="xl">
              <View style={styles.priceRow}>
                {onSale ? (
                  <View style={styles.salePriceContainer}>
                    <Text variant="title" style={{ color: '#7BB4A3' }}>{formatPrice(product.sale_price)}</Text>
                    <Text variant="body" style={styles.oldPriceVal}>{formatPrice(product.regular_price)}</Text>
                  </View>
                ) : (
                  <Text variant="title" style={{ color: tokens.colors.primary }}>{formatPrice(product.price)}</Text>
                )}

                {/* Quantity */}
                <View style={[styles.quantityWidget, { backgroundColor: tokens.colors.primary + '15' }]}>
                  <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={[styles.qBtn, { backgroundColor: tokens.colors.backgroundCard }]}>
                    <Ionicons name="remove" size={18} color={tokens.colors.primary} />
                  </TouchableOpacity>
                  <Text variant="title" style={{ minWidth: 24, textAlign: 'center' }}>{quantity}</Text>
                  <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={[styles.qBtn, { backgroundColor: tokens.colors.backgroundCard }]}>
                    <Ionicons name="add" size={18} color={tokens.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Surface>
          </Animated.View>

          {/* Description Panel */}
          {product.short_description && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.descPanel}>
              <Text variant="label" style={{ color: tokens.colors.textMuted }}>{t('description')}</Text>
              <Surface variant="glass" radius="lg">
                <Text variant="body" style={{ color: tokens.colors.textSecondary, lineHeight: 24 }}>
                  {product.short_description.replace(/<[^>]*>/g, '')}
                </Text>
              </Surface>
            </Animated.View>
          )}

          {/* Reviews Section */}
          <ReviewSection
            productId={id}
            user={user}
            theme={tokens.colors} // Pass colors object
            isDark={isDark}
            t={t}
          />

          <View style={styles.extraSpacing} />
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.floatingBottomBar}>
        <Surface variant="glass" radius="xxl" style={styles.bottomBarBlur} intensity={isDark ? 50 : 80}>
          <View style={styles.actionsRow}>
            <Button
              title={t('addToCart')}
              variant="secondary"
              icon={<Ionicons name="cart-outline" size={20} color={tokens.colors.primary} />}
              onPress={handleAddToCart}
              disabled={!isInStock}
              style={{ flex: 1 }}
            />
            <Button
              title={t('buyNow')}
              variant="primary"
              icon={<Ionicons name="flash" size={20} color="#FFF" />}
              onPress={handleBuyNow}
              disabled={!isInStock}
              style={{ flex: 1.2 }}
            />
          </View>

          <TouchableOpacity style={styles.whatsappFloat} onPress={handleWhatsAppOrder}>
            <LinearGradient colors={['#25D366', '#128C7E']} style={styles.waGradient}>
              <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
              <Text variant="label" style={{ color: '#FFF' }}>
                {t('orderViaWhatsapp', { price: (parseFloat(product.sale_price || product.price) * quantity).toFixed(3) + ' ' + t('currency') })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Surface>
      </View>

      {/* Success Modal */}
      <AddToCartSuccess
        visible={showAddedMessage}
        onClose={() => setShowAddedMessage(false)}
      />
    </View>
  );
}

const getStyles = (tokens, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  bgOrb1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: tokens.colors.primary + '15',
    zIndex: -1,
  },
  bgOrb2: {
    position: 'absolute',
    bottom: 150,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: tokens.colors.accent + '10',
    zIndex: -1,
  },
  scrollContent: { paddingBottom: 240 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
  },
  loadingGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: tokens.colors.primary + '20', // Opacity
  },
  loadingText: {
    marginTop: 16,
    marginBottom: 16,
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  likeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  likeBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  imageFrame: {
    width: width * 0.88,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: width * 0.85,
  },
  saleBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 16,
    backgroundColor: tokens.colors.error, // or just glass with text
  },
  thumbList: {
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 12,
  },
  thumb: {
    borderRadius: 18,
    overflow: 'hidden',
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },

  // Content
  contentSection: {
    paddingHorizontal: 24,
    gap: 20,
  },
  titleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  oldPriceVal: {
    color: tokens.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  quantityWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 20,
    gap: 14,
  },
  qBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descPanel: {
    gap: 12,
  },
  extraSpacing: {
    height: 40,
  },

  // Floating Bottom Bar
  floatingBottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    elevation: 0, // Surface handles elevation
  },
  bottomBarBlur: {
    padding: 16,
    gap: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  whatsappFloat: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  waGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
});
