/**
 * 🌙 COSMIC LUXURY HOME SCREEN - Kataraa
 * Next-Generation Beauty App - Ethereal, Floating, Cinematic
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';

// Services & Context
import { useCart } from '../../src/context/CartContext';
import { useCartAnimation } from '../../src/context/CartAnimationContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useProducts, useCategories } from '../../src/hooks/useProducts';
import { getAllBanners } from '../../src/services/adminBannerService';
import { FlashList } from '@shopify/flash-list';

// Components
import SearchHeader from '../../src/components/SearchHeader';
import ProductCardCinematic from '../../src/components/ProductCardCinematic'; // Cinematic 3D Card
import DrawerMenu from '../../src/components/DrawerMenu';
import { ProductSkeleton, CategorySkeleton, BannerSkeleton } from '../../src/components/SkeletonLoader';
import { Text, Surface, EmptyState } from '../../src/components/ui'; // UI Kit

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ============================================
// 🌙 COSMIC HERO SECTION
// ============================================
const CosmicHero = ({ banners, onShopNow, tokens, styles, t, isDark }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(40);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 1200 });
    slideAnim.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, [activeIndex]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  // Fallback if no banners
  const displayBanners = banners && banners.length > 0 ? banners : [{
    id: 'default',
    title: t('heroTitle'),
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    isActive: true
  }];

  const currentBanner = displayBanners[activeIndex];

  useEffect(() => {
    if (displayBanners.length > 1) {
      const interval = setInterval(() => {
        fadeAnim.value = 0;
        slideAnim.value = 40;
        setActiveIndex((prev) => (prev + 1) % displayBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [displayBanners.length]);

  return (
    <View style={styles.heroContainer}>
      <Image
        source={{ uri: currentBanner.imageUrl }}
        style={[styles.heroImage, StyleSheet.absoluteFill]}
        contentFit="cover"
        transition={500}
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={[
          'rgba(212,184,224,0.1)',
          isDark ? 'rgba(13,10,18,0.7)' : 'rgba(254,251,255,0.6)',
          isDark ? 'rgba(13,10,18,0.95)' : 'rgba(254,251,255,0.95)',
        ]}
        style={styles.heroOverlay}
      />

      <Animated.View style={[styles.heroContent, contentStyle]}>
        <View style={styles.heroBadgeContainer}>
          <View style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(26,21,32,0.7)' : 'rgba(255,255,255,0.8)' }]}>
            <Text variant="label" style={{ color: tokens.colors.primary, letterSpacing: 1 }}>
              ✦ {currentBanner.title || t('heroSubtitle')}
            </Text>
          </View>
        </View>

        <Text style={[styles.heroTitle, { color: tokens.colors.text }]}>
          {currentBanner.title ? currentBanner.title : t('heroTitle')}
        </Text>

        <TouchableOpacity style={styles.heroButton} onPress={() => onShopNow(currentBanner)}>
          <LinearGradient
            colors={[tokens.colors.primary, tokens.colors.primaryDark]}
            style={styles.heroButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.heroButtonText}>{t('shopNow')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Carousel Indicators */}
        {displayBanners.length > 1 && (
          <View style={styles.indicatorContainer}>
            {displayBanners.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.indicator,
                  { backgroundColor: i === activeIndex ? tokens.colors.primary : 'rgba(255,255,255,0.3)' }
                ]}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// ============================================
// 💎 FLOATING SKIN TYPE SELECTOR
// ============================================
const SkinTypeSection = ({ onSelect, tokens, styles, t, isDark }) => {
  const skinTypes = [
    { id: 'oily', name: t('oily'), icon: '💧', color: '#A8D8EA' },
    { id: 'dry', name: t('dry'), icon: '🍃', color: '#C9E4CA' },
    { id: 'mixed', name: t('mixed'), icon: '⚖️', color: '#E8DCC8' },
    { id: 'sensitive', name: t('sensitive'), icon: '🌸', color: '#F0D8E6' },
  ];

  return (
    <View style={styles.skinTypeSection}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={{ color: tokens.colors.primary, fontWeight: '600' }}>{t('viewAll')}</Text>
          <Ionicons name="arrow-back" size={14} color={tokens.colors.primary} />
        </TouchableOpacity>
        <Text variant="title" style={{ color: tokens.colors.text }}>
          {t('shopBySkin')} ✨
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.skinTypeList}
      >
        {skinTypes.map((type, index) => (
          <Animated.View
            key={type.id}
            entering={FadeInDown.delay(index * 100).springify()}
          >
            <TouchableOpacity
              style={styles.skinTypeCard}
              onPress={() => onSelect(type)}
            >
              <BlurView
                intensity={isDark ? 30 : 50}
                tint={isDark ? "dark" : "light"}
                style={styles.skinTypeBlur}
              >
                <View style={[styles.skinTypeIcon, { backgroundColor: type.color + '40' }]}>
                  <Text style={styles.skinTypeEmoji}>{type.icon}</Text>
                </View>
                <Text variant="label" style={{ color: tokens.colors.text }}>{type.name}</Text>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

// ============================================
// 🎯 ELEGANT SECTION HEADER
// ============================================
const ElegantSectionHeader = ({ title, subtitle, onViewAll, tokens, styles, t }) => (
  <View style={styles.elegantHeader}>
    <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll}>
      <Text style={{ color: tokens.colors.primary, fontWeight: '600' }}>{t('viewAll')}</Text>
      <Ionicons name="arrow-back" size={14} color={tokens.colors.primary} />
    </TouchableOpacity>
    <View style={styles.elegantTitleContainer}>
      <Text variant="title" style={{ color: tokens.colors.text }}>{title}</Text>
      {subtitle && <Text variant="caption" style={{ color: tokens.colors.textMuted }}>{subtitle}</Text>}
    </View>
  </View>
);

// ============================================
// ✨ COSMIC PROMO BANNER
// ============================================
const CosmicPromoBanner = ({ onPress, styles, tokens, t, isDark }) => (
  <TouchableOpacity style={styles.promoBanner} onPress={onPress}>
    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.promoBlur}>
      <LinearGradient
        colors={[tokens.colors.primary + '20', tokens.colors.primaryDark + '30']}
        style={styles.promoGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.promoLeft}>
          <Text style={styles.promoEmoji}>✨</Text>
          <View>
            <Text variant="subtitle" style={{ color: tokens.colors.text }}>{t('flashSale')}</Text>
            <Text variant="caption" style={{ color: tokens.colors.textSecondary }}>
              {t('flashSaleSubtitle')}
            </Text>
          </View>
        </View>
        <View style={[styles.promoBtn, { backgroundColor: tokens.colors.primary + '30' }]}>
          <Text style={{ color: tokens.colors.primary, fontWeight: 'bold' }}>
            {t('shopNow')} ←
          </Text>
        </View>
      </LinearGradient>
    </BlurView>
  </TouchableOpacity>
);

// ============================================
// 🛒 PRODUCT CAROUSEL (Horizontal)
// ============================================
const ProductCarousel = React.memo(({ products, onProductPress, onAddToCart, onFavorite, isFavorite, styles }) => {
  const renderItem = React.useCallback(({ item, index }) => (
    <ProductCardCinematic
      item={item}
      onPress={onProductPress}
      onAddToCart={onAddToCart}
      onFavorite={onFavorite}
      isFavorite={isFavorite(item.id)}
      index={index}
    />
  ), [onProductPress, onAddToCart, onFavorite, isFavorite]);

  return (
    <FlashList
      data={products}
      horizontal
      estimatedItemSize={CARD_WIDTH + 12}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContainer}
      keyExtractor={(item) => item.id.toString()}
      initialNumToRender={3}
      removeClippedSubviews={Platform.OS === 'android'}
      renderItem={renderItem}
    />
  );
});

// ============================================
// 📦 FLOATING CATEGORY GRID
// ============================================
const CategoryGrid = ({ categories, onSelect, styles, tokens, t, isDark }) => {
  // Real categories from kataraa.com
  const categoryData = [
    { id: 'سيروم', name: 'سيروم', icon: '💧', color: '#D4B8E0' },
    { id: 'واقي الشمس', name: 'واقي الشمس', icon: '☀️', color: '#F0ECD8' },
    { id: 'مرطب للبشرة', name: 'مرطب', icon: '✨', color: '#D8E6F0' },
    { id: 'غسول', name: 'غسول', icon: '🧼', color: '#E0D8F0' },
    { id: 'تونر', name: 'تونر', icon: '💦', color: '#E6D8F0' },
    { id: 'ماسك للوجه', name: 'ماسك', icon: '🎭', color: '#F0D8E6' },
    { id: 'العناية بالعين', name: 'العين', icon: '👁️', color: '#E8E4EC' },
    { id: 'العناية بالشعر', name: 'الشعر', icon: '💇', color: '#E8DCC8' },
    { id: 'حب الشباب والبثور', name: 'حب الشباب', icon: '🎯', color: '#D4B8E0' },
    { id: 'تجاعيد البشره', name: 'التجاعيد', icon: '⏳', color: '#F0D8E6' },
    { id: 'مسحات', name: 'مسحات', icon: '🧴', color: '#D8E6F0' },
    { id: 'المكياج', name: 'المكياج', icon: '💄', color: '#F0D8E6' },
  ];

  return (
    <View style={styles.categorySection}>
      <ElegantSectionHeader
        title={t('shopByCategory')}
        onViewAll={() => { }}
        styles={styles}
        tokens={tokens}
        t={t}
      />
      <View style={styles.categoryGrid}>
        {categoryData.map((cat, index) => (
          <Animated.View
            key={cat.id}
            entering={FadeInDown.delay(index * 50).springify()}
          >
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => onSelect(cat)}
            >
              <BlurView
                intensity={isDark ? 25 : 45}
                tint={isDark ? "dark" : "light"}
                style={styles.categoryBlur}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '50' }]}>
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                </View>
                <Text variant="label" style={{ color: tokens.colors.text, textAlign: 'center' }}>{cat.name}</Text>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// ============================================
// 🌟 WHY SHOP WITH US
// ============================================
const WhyShopWithUs = ({ tokens, styles, t, isDark }) => {
  const features = [
    { icon: 'shield-checkmark', title: t('guaranteed'), desc: t('guaranteedDesc') },
    { icon: 'cube', title: t('variety'), desc: t('varietyDesc') },
    { icon: 'star', title: t('experience'), desc: t('experienceDesc') },
    { icon: 'car', title: t('delivery'), desc: t('deliveryDesc') },
  ];

  return (
    <View style={styles.whySection}>
      <Text variant="title" style={{ color: tokens.colors.text, textAlign: 'center', marginBottom: 20 }}>
        {t('whyShop')} ✨
      </Text>
      <View style={styles.whyGrid}>
        {features.map((f, i) => (
          <Animated.View
            key={i}
            style={styles.whyCardContainer}
            entering={FadeInDown.delay(i * 100).springify()}
          >
            <BlurView intensity={isDark ? 25 : 45} tint={isDark ? "dark" : "light"} style={styles.whyCard}>
              <View style={[styles.whyIconContainer, { backgroundColor: tokens.colors.primary + '20' }]}>
                <Ionicons name={f.icon} size={22} color={tokens.colors.primary} />
              </View>
              <Text variant="body" weight="bold" style={{ color: tokens.colors.text, marginBottom: 4, textAlign: 'center' }}>{f.title}</Text>
              <Text variant="caption" style={{ color: tokens.colors.textMuted, textAlign: 'center' }}>{f.desc}</Text>
            </BlurView>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// ============================================
// 📱 MAIN HOME SCREEN
// ============================================

export default function HomeScreen() {
  const router = useRouter();
  const { cartItems } = useCart();
  const { triggerAddToCart } = useCartAnimation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { tokens, isDark } = useTheme(); // Use tokens
  const { t } = useTranslation();
  const { addNotification, notifications } = useNotifications();

  const styles = getStyles(tokens, isDark);

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts
  } = useProducts(1, 100);

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories
  } = useCategories();

  const products = productsData || [];
  const categories = categoriesData?.filter(cat => cat.count > 0) || [];

  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const loading = productsLoading || categoriesLoading || bannersLoading;

  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadBanners = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setBannersLoading(true);
      const fetchedBanners = await getAllBanners(true);
      setBanners(fetchedBanners);
    } catch (err) {
      console.error('Error loading banners:', err);
    } finally {
      setBannersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    if (!loading && products.length > 0) {
      const lastArrivalCheck = notifications.find(n => n.type === 'arrival');
      if (!lastArrivalCheck) {
        addNotification(
          'notifArrivalTitle',
          'notifArrivalMsg',
          'arrival'
        );
      }
    }
  }, [loading, products]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchCategories(), loadBanners(true)]);
    setRefreshing(false);
  }, [refetchProducts, refetchCategories, loadBanners]);



  const handleSearch = React.useCallback((query) => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  }, [router]);

  const handleProductPress = React.useCallback((item) => {
    router.push(`/product/${item.id}`);
  }, [router]);

  const handleAddToCart = React.useCallback((item, sourceRef) => {
    triggerAddToCart({
      id: item.id,
      name: item.name,
      price: item.sale_price || item.price,
      image: item.images?.[0]?.src,
      quantity: 1,
    }, sourceRef);
  }, [triggerAddToCart]);

  const handleFavorite = React.useCallback((item) => {
    toggleFavorite({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.images?.[0]?.src,
      quantity: 1,
    });
  }, [toggleFavorite]);

  // Memoized Filter functions
  const saleProducts = useMemo(() => products.filter(p => p.on_sale).slice(0, 12), [products]);
  const newArrivals = useMemo(() => products.slice(0, 12), [products]);
  const popularProducts = useMemo(() => [...products].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 12), [products]);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Cosmic Background Orbs */}
      <View style={[styles.bgOrb1, { backgroundColor: tokens.colors.primary + '10' }]} />
      <View style={[styles.bgOrb2, { backgroundColor: tokens.colors.secondarySoft + '08' }]} />

      {/* Drawer Menu */}
      <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Header */}
      <SearchHeader
        title="KATARAA"
        onSearch={handleSearch}
        onCartPress={() => router.push('/cart')}
        onNotificationPress={() => router.push('/notifications')}
        onMenuPress={() => router.push('/profile')}
        cartCount={cartItems.length}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tokens.colors.primary} />
        }
      >
        {productsError ? (
          <EmptyState
            title={t('errorTitle') || 'Connection Error'}
            description={t('errorDescription') || 'Failed to fetch products. Please check your connection.'}
            icon="cloud-offline-outline"
            actionLabel={t('retry') || 'Retry'}
            onAction={handleRefresh}
            style={{ marginVertical: 60 }}
          />
        ) : (
          <>
            {/* 🌙 Cosmic Hero */}
            {loading ? <BannerSkeleton /> : (
              <CosmicHero
                banners={banners}
                onShopNow={(banner) => {
                  if (banner.link) {
                    router.push(banner.link);
                  } else {
                    router.push('/products');
                  }
                }}
                tokens={tokens}
                styles={styles}
                t={t}
                isDark={isDark}
              />
            )}

            {/* 💎 Shop by Skin Type */}
            <SkinTypeSection onSelect={(type) => router.push(`/products?skin=${type.id}`)} tokens={tokens} styles={styles} t={t} isDark={isDark} />

            {/* ✨ Promo Banner */}
            {loading ? <BannerSkeleton /> : <CosmicPromoBanner onPress={() => router.push('/products?sale=true')} styles={styles} tokens={tokens} t={t} isDark={isDark} />}

            {/* 🆕 New Arrivals */}
            <View style={styles.section}>
              <ElegantSectionHeader
                title={t('newArrivals')}
                subtitle={t('newArrivalsSub')}
                onViewAll={() => router.push('/products')}
                tokens={tokens}
                styles={styles}
                t={t}
              />
              {loading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
                  {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
                </ScrollView>
              ) : (
                <ProductCarousel
                  products={newArrivals}
                  onProductPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  onFavorite={handleFavorite}
                  isFavorite={isFavorite}
                  styles={styles}
                />
              )}
            </View>

            {/* 🔥 On Sale */}
            <View style={styles.section}>
              <ElegantSectionHeader
                title={t('onSale')}
                subtitle={t('onSaleSub')}
                onViewAll={() => router.push('/products?sale=true')}
                tokens={tokens}
                styles={styles}
                t={t}
              />
              {loading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
                  {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
                </ScrollView>
              ) : (
                <ProductCarousel
                  products={saleProducts}
                  onProductPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  onFavorite={handleFavorite}
                  isFavorite={isFavorite}
                  styles={styles}
                />
              )}
            </View>

            {/* 📦 Shop by Category */}
            {loading ? (
              <View style={styles.categorySection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                  {[1, 2, 3, 4, 5].map(i => <CategorySkeleton key={i} />)}
                </ScrollView>
              </View>
            ) : (
              <CategoryGrid
                categories={categories}
                onSelect={(cat) => router.push(`/products?category=${cat.id}`)}
                styles={styles}
                tokens={tokens}
                t={t}
                isDark={isDark}
              />
            )}

            {/* ⭐ Popular Products */}
            <View style={styles.section}>
              <ElegantSectionHeader
                title={t('bestSellers')}
                subtitle={t('bestSellersSub')}
                onViewAll={() => router.push('/products')}
                tokens={tokens}
                styles={styles}
                t={t}
              />
              {loading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
                  {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
                </ScrollView>
              ) : (
                <ProductCarousel
                  products={popularProducts}
                  onProductPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  onFavorite={handleFavorite}
                  isFavorite={isFavorite}
                  styles={styles}
                />
              )}
            </View>



            {/* 🌟 Why Shop With Us */}
            <WhyShopWithUs tokens={tokens} styles={styles} t={t} isDark={isDark} />

            {/* 💜 More Products */}
            <View style={styles.section}>
              <ElegantSectionHeader
                title={t('discoverMore')}
                subtitle={t('discoverMoreSub')}
                onViewAll={() => router.push('/products')}
                tokens={tokens}
                styles={styles}
                t={t}
              />
              {loading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
                  {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
                </ScrollView>
              ) : (
                <ProductCarousel
                  products={products.slice(12, 24)}
                  onProductPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  onFavorite={handleFavorite}
                  isFavorite={isFavorite}
                  styles={styles}
                />
              )}
            </View>

            {/* Newsletter CTA - Glass Style */}
            <View style={styles.newsletterSection}>
              <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.newsletterBlur}>
                <LinearGradient
                  colors={[tokens.colors.primary + '20', tokens.colors.primaryDark + '30']}
                  style={styles.newsletterGradient}
                >
                  <Text style={styles.newsletterEmoji}>💌</Text>
                  <Text variant="title" style={{ color: tokens.colors.text, marginBottom: 8 }}>{t('joinFamily')}</Text>
                  <Text variant="body" style={{ color: tokens.colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>{t('joinFamilySub')}</Text>
                  <TouchableOpacity style={styles.newsletterBtn}>
                    <LinearGradient
                      colors={[tokens.colors.primary, tokens.colors.primaryDark]}
                      style={styles.newsletterBtnGradient}
                    >
                      <Text style={styles.newsletterBtnText}>{t('subscribe')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </View>

            {/* Footer Space */}
            <View style={{ height: 120 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================
// 🎨 COSMIC LUXURY STYLES
// ============================================
const getStyles = (tokens, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  bgOrb1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: -1,
  },
  bgOrb2: {
    position: 'absolute',
    bottom: 200,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    zIndex: -1,
  },

  // Hero
  heroContainer: {
    height: height * 0.48,
    position: 'relative',
  },
  heroImage: {
    flex: 1,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  heroBadgeContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 24,
  },
  heroButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 16,
    gap: 10,
  },
  heroButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Skin Type Section
  skinTypeSection: {
    marginTop: 28,
    marginBottom: 20,
  },
  skinTypeList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  skinTypeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  skinTypeBlur: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.15)' : 'rgba(212,184,224,0.3)',
    borderRadius: 24,
  },
  skinTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  skinTypeEmoji: {
    fontSize: 26,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Elegant Header
  elegantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  elegantTitleContainer: {
    alignItems: 'flex-end',
  },

  // Promo Banner
  promoBanner: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  promoBlur: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.15)' : 'rgba(212,184,224,0.3)',
  },
  promoGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  promoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  promoEmoji: {
    fontSize: 32,
  },
  promoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },

  // Section
  section: {
    marginVertical: 12,
  },
  carouselContainer: {
    paddingHorizontal: 20,
  },

  // Category Grid
  categorySection: {
    marginVertical: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 48) / 4,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryBlur: {
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.1)' : 'rgba(212,184,224,0.2)',
    borderRadius: 20,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 22,
  },

  // Why Shop Section
  whySection: {
    marginHorizontal: 20,
    marginVertical: 24,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  whyCardContainer: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  whyCard: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.1)' : 'rgba(212,184,224,0.2)',
    borderRadius: 24,
  },
  whyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Newsletter
  newsletterSection: {
    marginHorizontal: 20,
    marginVertical: 28,
    borderRadius: 28,
    overflow: 'hidden',
  },
  newsletterBlur: {
    borderWidth: 1,
    borderColor: isDark ? 'rgba(184,159,204,0.15)' : 'rgba(212,184,224,0.3)',
    borderRadius: 28,
  },
  newsletterGradient: {
    padding: 36,
    alignItems: 'center',
  },
  newsletterEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  newsletterBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  newsletterBtnGradient: {
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  newsletterBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  indicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -30,
    gap: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
