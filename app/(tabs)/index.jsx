/**
 * 🌙 COSMIC LUXURY HOME SCREEN - Kataraa
 * Next-Generation Beauty App - Ethereal, Floating, Cinematic
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';

// Services & Context

import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useCategories, useProducts } from '../../src/hooks/useProducts';
import { useTranslation } from '../../src/hooks/useTranslation';

// Components
import DrawerMenu from '../../src/components/DrawerMenu';
import ProductCardSoko from '../../src/components/ProductCardSoko'; // Use Standardized Card
import SearchHeader from '../../src/components/SearchHeader';
import { BannerSkeleton, CategorySkeleton, ProductSkeleton } from '../../src/components/SkeletonLoader';
import { Text } from '../../src/components/ui'; // UI Kit
import AppBackground from '../../src/components/ui/AppBackground';
import { formatForState } from '../../src/utils/productUtils';


const { width, height } = Dimensions.get('window');





// ============================================
// 🌙 COSMIC HERO SECTION (kept for fallback)
// ============================================
const CosmicHero = ({ onShopNow, tokens, styles, t, isDark }) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(40);

  // Hero background video - Kataraa brand video from website
  const player = useVideoPlayer('https://kataraa.com/wp-content/uploads/2025/07/a-little-magic-for-your-skin-1-1.mp4', (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 1200 });
    slideAnim.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <View style={styles.heroContainer}>
      <VideoView
        player={player}
        style={styles.heroImage}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Cosmic Overlay */}
      <View style={[StyleSheet.absoluteFillObject, styles.heroOverlayContainer]}>
        <LinearGradient
          colors={[
            'rgba(212,184,224,0.1)',
            isDark ? 'rgba(13,10,18,0.7)' : 'rgba(254,251,255,0.6)',
            isDark ? 'rgba(13,10,18,0.95)' : 'rgba(254,251,255,0.95)',
          ].filter(Boolean)}
          style={styles.heroOverlay}
        />

        <Animated.View style={[styles.heroContent, contentStyle]}>
          {/* Ethereal Badge */}
          <View style={styles.heroBadgeContainer}>
            <View style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(26,21,32,0.7)' : 'rgba(255,255,255,0.8)' }]}>
              <Text variant="label" style={{ color: tokens.colors.primary, letterSpacing: 1 }}>
                ✦ {t('heroSubtitle')}
              </Text>
            </View>
          </View>

          {/* Main Title */}
          <Text style={[styles.heroTitle, { color: tokens.colors.text }]}>
            {t('heroTitle')}
          </Text>

          {/* CTA Button */}
          <TouchableOpacity style={styles.heroButton} onPress={onShopNow}>
            <LinearGradient
              colors={[
                tokens?.colors?.primary || '#D4AF76',
                tokens?.colors?.primaryDark || '#B8924F'
              ]}
              style={styles.heroButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroButtonText}>{t('shopNow')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
        colors={[
          (tokens?.colors?.primary || '#D4AF76') + '20',
          (tokens?.colors?.primaryDark || '#B8924F') + '30'
        ]}
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
// 🧪 COSMIC SKIN QUIZ BANNER
// ============================================
const CosmicQuizBanner = ({ onPress, tokens, styles, t, isDark }) => (
  <TouchableOpacity style={[styles.quizBannerContainer]} onPress={onPress} activeOpacity={0.95}>
    <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={styles.quizBannerBlur}>
      <LinearGradient
        colors={[
          (tokens?.colors?.primary || '#D4AF76') + '30',
          (tokens?.colors?.accent || '#E8B4B8') + '20'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quizBannerContent}
      >
        <View style={styles.quizBannerTxtBox}>
          <Text style={[styles.quizBannerTitle, { color: tokens.colors.text }]}>{t('takeSkinQuiz')}</Text>
          <Text style={[styles.quizBannerSub, { color: tokens.colors.textMuted }]}>{t('discoverYourRoutine')}</Text>
          <View style={[styles.quizBannerBtn, { backgroundColor: tokens.colors.primary }]}>
            <Text style={styles.quizBannerBtnTxt}>{t('shopNow')}</Text>
            <Ionicons name="sparkles" size={16} color="#FFF" />
          </View>
        </View>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.quizBannerIconBox}>
          <View style={[styles.quizIconCircle, { backgroundColor: tokens.colors.primary + '20' }]}>
            <Ionicons name="flask" size={40} color={tokens.colors.primary} />
          </View>
        </Animated.View>
      </LinearGradient>
    </BlurView>
  </TouchableOpacity>
);

// ============================================
// 🛒 PRODUCT CAROUSEL (Horizontal)
// ============================================
const ProductCarousel = React.memo(({ products, onProductPress, onAddToCart, onFavorite, isFavorite, styles }) => (
  <FlatList
    data={products}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.carouselContainer}
    keyExtractor={(item) => item.id.toString()}
    initialNumToRender={3}
    maxToRenderPerBatch={2}
    windowSize={5}
    removeClippedSubviews={Platform.OS === 'android'}
    renderItem={({ item }) => (
      <ProductCardSoko
        item={item}
        onPress={onProductPress}
        onAddToCart={onAddToCart}
        onFavorite={onFavorite}
        isFavorite={isFavorite(item.id)}
      />
    )}
  />
));

// ============================================
// 📦 FLOATING CATEGORY GRID
// ============================================

// Real categories from kataraa.com - Unified with products.jsx
const REAL_CATEGORIES = [
  { id: 'all', name: 'الكل', icon: '📦', color: '#E8D4F0' },
  { id: 'skincare', name: 'عناية بالبشرة', icon: '✨', color: '#D4B8E0' },
  { id: 'serum', name: 'سيروم', icon: '💧', color: '#D4B8E0' },
  { id: 'sunscreen', name: 'واقي الشمس', icon: '☀️', color: '#F0ECD8' },
  { id: 'moisturizer', name: 'مرطب للبشرة', icon: '✨', color: '#D8E6F0' },
  { id: 'cleanser', name: 'غسول', icon: '🧼', color: '#E0D8F0' },
  { id: 'toner', name: 'تونر', icon: '💦', color: '#E6D8F0' },
  { id: 'mask', name: 'ماسك للوجه', icon: '🎭', color: '#F0D8E6' },
  { id: 'eyecare', name: 'العناية بالعين', icon: '👁️', color: '#E8E4EC' },
  { id: 'haircare', name: 'العناية بالشعر', icon: '💇', color: '#E8DCC8' },
  { id: 'acne', name: 'حب الشباب', icon: '🎯', color: '#D4B8E0' },
  { id: 'antiaging', name: 'التجاعيد', icon: '⏳', color: '#F0D8E6' },
  { id: 'pads', name: 'مسحات', icon: '🧴', color: '#D8E6F0' },
  { id: 'makeup', name: 'المكياج', icon: '💄', color: '#F0D8E6' },
];

const CategoryGrid = ({ categories, onSelect, styles, tokens, t, isDark }) => {

  return (
    <View style={styles.categorySection}>
      <ElegantSectionHeader
        title={t('shopByCategory')}
        onViewAll={() => onSelect({ id: 'all' })}
        styles={styles}
        tokens={tokens}
        t={t}
      />
      <View style={styles.categoryGrid}>
        {REAL_CATEGORIES.map((cat, index) => (
          <Animated.View
            key={cat.id}
            entering={FadeInDown.delay(index * 50).springify()}
          >
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => onSelect(cat)}
              activeOpacity={0.7}
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
  const { cartItems, triggerAddToCart } = useCart();

  const { toggleFavorite, isFavorite } = useFavorites();
  const { tokens, isDark } = useTheme(); // Use tokens
  const { t } = useTranslation();
  const { addNotification, notifications } = useNotifications();

  const styles = getStyles(tokens, isDark);

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProducts(1, 100);
  const { data: categoriesData, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();

  const products = productsData || [];
  const categories = categoriesData?.filter(cat => cat.count > 0) || [];
  const loading = productsLoading || categoriesLoading;

  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && products.length > 0) {
      const hasArrivalNotif = notifications.some(n => n.type === 'arrival');
      if (!hasArrivalNotif) {
        addNotification('notifArrivalTitle', 'notifArrivalMsg', 'arrival');
      }
    }
  }, [loading, products.length, notifications.length]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchCategories()]);
    setRefreshing(false);
  }, [refetchProducts, refetchCategories]);



  const handleSearch = React.useCallback((query) => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  }, [router]);

  const handleProductPress = React.useCallback((item) => {
    router.push(`/product/${item.id}`);
  }, [router]);

  const handleAddToCart = React.useCallback((item, ref) => {
    const productData = formatForState(item);

    if (ref?.current) {
      ref.current.measureInWindow((x, y, btnWidth, btnHeight) => {
        triggerAddToCart(productData, { x: x + btnWidth / 2, y: y + btnHeight / 2 });
      });
    } else {
      triggerAddToCart(productData);
    }
  }, [triggerAddToCart]);

  const handleFavorite = React.useCallback((item) => {
    toggleFavorite(formatForState(item));
  }, [toggleFavorite]);

  // Memoized Filter functions
  const saleProducts = useMemo(() => products.filter(p => p.on_sale).slice(0, 12), [products]);
  const newArrivals = useMemo(() => products.slice(0, 12), [products]);
  const popularProducts = useMemo(() => [...products].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 12), [products]);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ✨ Cosmic Background Elements - hidden */}
      <AppBackground />

      {/* Drawer Menu */}
      <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Header */}
      <SearchHeader
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
        {/* 💎 Shop by Skin Type */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <SkinTypeSection onSelect={(type) => router.push(`/products?skin=${type.id}`)} tokens={tokens} styles={styles} t={t} isDark={isDark} />
        </Animated.View>

        {/* 🧪 Skin Quiz Banner */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <CosmicQuizBanner onPress={() => router.push('/skin-quiz')} tokens={tokens} styles={styles} t={t} isDark={isDark} />
        </Animated.View>

        {/* ✨ Promo Banner */}
        <Animated.View entering={FadeInDown.delay(400)}>
          {loading ? <BannerSkeleton /> : <CosmicPromoBanner onPress={() => router.push('/products?sale=true')} styles={styles} tokens={tokens} t={t} isDark={isDark} />}
        </Animated.View>

        {/* 🆕 New Arrivals */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
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
        </Animated.View>

        {/* 🔥 On Sale */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
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
        </Animated.View>

        {/* 📦 Shop by Category */}
        <Animated.View entering={FadeInDown.delay(700)}>
          {loading ? (
            <View style={styles.categorySection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                {[1, 2, 3, 4, 5].map(i => <CategorySkeleton key={i} />)}
              </ScrollView>
            </View>
          ) : (
            <CategoryGrid
              categories={categories}
              onSelect={(cat) => {
                if (cat.id === 'all') {
                  router.push('/products');
                } else {
                  router.push(`/products?category=${cat.id}`);
                }
              }}
              styles={styles}
              tokens={tokens}
              t={t}
              isDark={isDark}
            />
          )}
        </Animated.View>

        {/* ⭐ Popular Products */}
        <Animated.View entering={FadeInDown.delay(800)} style={styles.section}>
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
        </Animated.View>

        {/* 🌟 Why Shop With Us */}
        <WhyShopWithUs tokens={tokens} styles={styles} t={t} isDark={isDark} />

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
    backgroundColor: "transparent",
  },

  // ✨ Premium Background Pattern - HIGHLY VISIBLE
  bgOrb1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: isDark ? 'rgba(102, 126, 234, 0.35)' : 'rgba(102, 126, 234, 0.45)', // Purple - VERY VISIBLE
    zIndex: 0, // Above background
  },
  bgOrb2: {
    position: 'absolute',
    bottom: 50,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: isDark ? 'rgba(212, 175, 118, 0.30)' : 'rgba(212, 175, 118, 0.40)', // Gold - VERY VISIBLE
    zIndex: 0, // Above background
  },
  bgOrb3: {
    position: 'absolute',
    top: height * 0.4,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: isDark ? 'rgba(138, 104, 148, 0.25)' : 'rgba(184, 146, 79, 0.35)', // Accent - VERY VISIBLE
    zIndex: 0, // Above background
  },

  // Hero
  heroContainer: {
    height: height * 0.48,
    position: 'relative',
    backgroundColor: '#000',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlayContainer: {
    justifyContent: 'flex-end',
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

  // Quiz Banner Styles
  quizBannerContainer: { marginHorizontal: 20, marginBottom: 28, borderRadius: 28, overflow: 'hidden' },
  quizBannerBlur: { borderRadius: 28 },
  quizBannerContent: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingVertical: 28 },
  quizBannerTxtBox: { flex: 1, gap: 4 },
  quizBannerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  quizBannerSub: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  quizBannerBtn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start'
  },
  quizBannerBtnTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  quizBannerIconBox: { marginLeft: 16 },
  quizIconCircle: { width: 80, height: 80, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});
