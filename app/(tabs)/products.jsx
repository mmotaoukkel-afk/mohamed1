/**
 * Products Screen - Kataraa SOKO Style
 * Redesigned products listing with brand sections and improved layout
 * Dark Mode Supported 🌙
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Services & Context
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useTheme } from '../../src/context/ThemeContext';

// Components
import BrandSection from '../../src/components/BrandSection';
import ProductCardSoko from '../../src/components/ProductCardSoko';
import SearchHeader from '../../src/components/SearchHeader';
import { ProductSkeleton } from '../../src/components/SkeletonLoader';
import AppBackground from '../../src/components/ui/AppBackground';

import { useCategories, useInfiniteProducts } from '../../src/hooks/useProducts';
import { useTranslation } from '../../src/hooks/useTranslation';
import api from '../../src/services/api';
import { formatForState } from '../../src/utils/productUtils';

const { width, height } = Dimensions.get('window');

// Real categories from kataraa.com - Using English Slugs for Firestore filtering
const REAL_CATEGORIES = [
    { id: 'skincare', name: 'عناية بالبشرة', icon: '✨', slug: 'العناية-بالبشرة' },
    { id: 'serum', name: 'سيروم', icon: '💧', slug: 'سيروم' },
    { id: 'sunscreen', name: 'واقي الشمس', icon: '☀️', slug: 'واقي-الشمس' },
    { id: 'moisturizer', name: 'مرطب للبشرة', icon: '✨', slug: 'مرطب-للبشرة' },
    { id: 'cleanser', name: 'غسول', icon: '🧼', slug: 'غسول' },
    { id: 'toner', name: 'تونر', icon: '💦', slug: 'تونر' },
    { id: 'mask', name: 'ماسك للوجه', icon: '🎭', slug: 'ماسك-للوجه' },
    { id: 'eyecare', name: 'العناية بالعين', icon: '👁️', slug: 'العناية-بالعين' },
    { id: 'haircare', name: 'العناية بالشعر', icon: '💇', slug: 'العناية-بالشعر' },
    { id: 'acne', name: 'حب الشباب', icon: '🎯', slug: 'حب-الشباب-والبثور' },
    { id: 'antiaging', name: 'التجاعيد', icon: '⏳', slug: 'تجاعيد-البشره' },
    { id: 'pads', name: 'مسحات', icon: '🧴', slug: 'مسحات' },
    { id: 'makeup', name: 'المكياج', icon: '💄', slug: 'المكياج' },
];

// Helper to get matching details for a category
const getCategoryUI = (item, t) => {
    if (!item || item.id === null) {
        return { label: t('all') || 'الكل', icon: 'apps-outline', provider: Ionicons, emoji: '📦' };
    }

    const name = item.name?.toLowerCase() || '';
    const id = item.id?.toLowerCase() || '';

    if (id === 'serum' || name.includes('سيروم'))
        return { label: t('serum'), icon: 'water-outline', provider: Ionicons, emoji: '💧' };
    if (id === 'sunscreen' || name.includes('شمس'))
        return { label: t('suncare'), icon: 'sunny-outline', provider: Ionicons, emoji: '☀️' };
    if (id === 'moisturizer' || name.includes('مرطب'))
        return { label: t('moisturizers'), icon: 'lotion-outline', provider: MaterialCommunityIcons, emoji: '✨' };
    if (id === 'cleanser' || name.includes('غسول'))
        return { label: t('cleansers'), icon: 'water-outline', provider: MaterialCommunityIcons, emoji: '🧼' };
    if (id === 'toner' || name.includes('تونر'))
        return { label: t('toners'), icon: 'bottle-wine-outline', provider: MaterialCommunityIcons, emoji: '💦' };
    if (id === 'mask' || name.includes('ماسك'))
        return { label: t('masks'), icon: 'face-mask-outline', provider: MaterialCommunityIcons, emoji: '🎭' };
    if (id === 'eyecare' || name.includes('عين'))
        return { label: t('eyeCare'), icon: 'eye-circle-outline', provider: MaterialCommunityIcons, emoji: '👁️' };
    if (id === 'haircare' || name.includes('شعر'))
        return { label: t('hair'), icon: 'hair-dryer-outline', provider: MaterialCommunityIcons, emoji: '💇' };
    if (id === 'makeup' || id === 'makeup' || name.includes('مكياج'))
        return { label: t('makeup'), icon: 'eye-outline', provider: Ionicons, emoji: '💄' };
    if (id === 'acne' || name.includes('حب'))
        return { label: t('acne'), icon: 'bandage-outline', provider: Ionicons, emoji: '🎯' };
    if (id === 'antiaging' || name.includes('تجاعيد'))
        return { label: t('antiAging'), icon: 'auto-fix', provider: MaterialCommunityIcons, emoji: '⏳' };
    if (id === 'pads' || name.includes('مسحة'))
        return { label: t('pads') || 'مسحات', icon: 'lotion-outline', provider: MaterialCommunityIcons, emoji: '🧴' };

    return { label: item.name, icon: 'dots-grid', provider: MaterialCommunityIcons, emoji: item.icon || '✨' };
};

export default function ProductsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { cartItems, addToCart, triggerAddToCart } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(theme, isDark);

    // Sanitize incoming category param (map Arabic to English slug if needed)
    const initialCategory = params.category ? (
        REAL_CATEGORIES.find(c =>
            c.name === params.category ||
            c.id === params.category ||
            c.slug === params.category
        )?.id || params.category
    ) : null;

    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'brand'
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price_low', 'price_high', 'name'

    // Map sort values to API values
    const getSortOption = () => {
        switch (sortBy) {
            case 'price_low': return 'price-asc';
            case 'price_high': return 'price-desc';
            case 'name': return 'alphabetic';
            default: return 'newest';
        }
    };

    // Use React Query Infinite Hook
    const {
        data: productsData,
        isLoading: productsLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchProducts
    } = useInfiniteProducts(
        50,
        selectedCategory,
        getSortOption(),
        params.skin
    );

    const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

    // Flatten pages into a single array
    const products = productsData?.pages?.flatMap(page => page) || [];
    const categories = categoriesData?.filter(cat => cat.count > 0) || [];
    const loading = productsLoading || categoriesLoading;

    const [refreshing, setRefreshing] = useState(false);

    // Refetching is handled automatically by React Query keys when params change


    const handleRefresh = React.useCallback(async () => {
        setRefreshing(true);
        api.clearCache(); // Clear WooCommerce cache to get fresh data from website
        await refetchProducts();
        setRefreshing(false);
    }, [refetchProducts]);

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleCategorySelect = React.useCallback(async (categoryId) => {
        const newCategory = categoryId === selectedCategory ? null : categoryId;
        setSelectedCategory(newCategory);
    }, [selectedCategory]);


    const handleSearch = (query) => {
        // Search is handled by the search screen, just navigate
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

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

    // Group products by category for brand view
    const getProductsByCategory = () => {
        const grouped = {};
        REAL_CATEGORIES.forEach(cat => {
            const matchedProducts = products.filter(p =>
                p.categories?.some(c =>
                    c.name === cat.name ||
                    c.slug === cat.slug ||
                    c.id?.toString() === cat.id
                )
            ).slice(0, 6);
            if (matchedProducts.length > 0) {
                grouped[cat.id] = {
                    name: cat.name,
                    products: matchedProducts
                };
            }
        });
        return grouped;
    };

    // Render product for grid view
    // Render product for grid view
    const renderProduct = React.useCallback(({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(600)} style={styles.gridItem}>
            <ProductCardSoko
                item={item}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
                onFavorite={handleFavorite}
                isFavorite={isFavorite(item.id)}
            />
        </Animated.View>
    ), [handleProductPress, handleAddToCart, handleFavorite, isFavorite, styles.gridItem]);

    // Category Mapping Helper moved outside component

    // Render category chip
    const renderCategoryItem = React.useCallback(({ item, index }) => {
        const isAll = item.id === null;
        const details = getCategoryUI(item, t);
        const IconProvider = details.provider || Ionicons;
        const isActive = selectedCategory === item.id;

        return (
            <Animated.View
                key={item.id || 'all'}
                entering={FadeInDown.delay(index * 50).springify()}
            >
                <TouchableOpacity
                    style={styles.categoryCircleWrapper}
                    onPress={() => handleCategorySelect(item.id)}
                >
                    <View
                        style={[
                            styles.categoryCircle,
                            isActive && styles.categoryCircleActive,
                        ]}
                    >
                        {isActive ? (
                            <Text style={{ fontSize: 20 }}>{details.emoji}</Text>
                        ) : (
                            <IconProvider
                                name={details.icon}
                                size={22}
                                color={isDark ? theme.primary : '#1A1A1A'}
                            />
                        )}
                    </View>
                    <Text style={[
                        styles.categoryCircleLabel,
                        { color: isActive ? theme.primary : theme.textSecondary },
                        isActive && { fontWeight: '700' }
                    ]}>
                        {details.label}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        );
    }, [selectedCategory, t, theme, isDark, styles, handleCategorySelect]);

    // Render header with categories
    const MemoizedHeader = React.useMemo(() => (
        <View style={styles.listHeader}>
            <View style={{ transform: [{ scaleX: -1 }] }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.categoriesList, { flexDirection: 'row-reverse' }]}
                >
                    <View style={{ transform: [{ scaleX: -1 }], flexDirection: 'row' }}>
                        {/* All Button */}
                        <TouchableOpacity
                            style={styles.categoryCircleWrapper}
                            onPress={() => handleCategorySelect(null)}
                        >
                            <View style={[
                                styles.categoryCircle,
                                selectedCategory === null && styles.categoryCircleActive,
                            ]}>
                                <Text style={styles.categoryEmoji}>📦</Text>
                            </View>
                            <Text style={[
                                styles.categoryCircleLabel,
                                { color: selectedCategory === null ? theme.primary : theme.textSecondary },
                                selectedCategory === null && { fontWeight: '700' }
                            ]}>{t('all') || 'الكل'}</Text>
                        </TouchableOpacity>

                        {/* Real Categories */}
                        {REAL_CATEGORIES.map((cat, index) => renderCategoryItem({ item: cat, index }))}
                    </View>
                </ScrollView>
            </View>

            {/* Filter Row with Filter Button */}
            <View style={styles.filterRow}>
                {/* View Mode Toggle */}
                <View style={styles.viewModeToggle}>
                    <TouchableOpacity
                        style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
                        onPress={() => setViewMode('grid')}
                    >
                        <Ionicons name="grid" size={18} color={viewMode === 'grid' ? '#fff' : theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewModeBtn, viewMode === 'brand' && styles.viewModeBtnActive]}
                        onPress={() => setViewMode('brand')}
                    >
                        <Ionicons name="list" size={18} color={viewMode === 'brand' ? '#fff' : theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Filter Button */}
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name="options-outline" size={20} color={theme.primary} />
                    <Text style={[styles.filterBtnText, { color: theme.primary }]}>فلترة</Text>
                </TouchableOpacity>

                <Text style={styles.resultsCount}>
                    {products.length} {t('products')}
                </Text>
            </View>
        </View>
    ), [selectedCategory, viewMode, products.length, styles, theme, t, renderCategoryItem, handleCategorySelect]);

    // Filter Modal
    const FilterModal = () => (
        <Modal
            visible={filterModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>فلترة المنتجات</Text>
                        <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Sort Options */}
                    <Text style={[styles.filterSectionTitle, { color: theme.text }]}>الترتيب</Text>
                    {[
                        { id: 'newest', label: 'الأحدث' },
                        { id: 'price_low', label: 'السعر: من الأقل للأعلى' },
                        { id: 'price_high', label: 'السعر: من الأعلى للأقل' },
                        { id: 'name', label: 'الاسم' },
                    ].map(option => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.sortOption,
                                sortBy === option.id && { backgroundColor: theme.primary + '20' }
                            ]}
                            onPress={() => setSortBy(option.id)}
                        >
                            <Text style={{ color: sortBy === option.id ? theme.primary : theme.text }}>
                                {option.label}
                            </Text>
                            {sortBy === option.id && (
                                <Ionicons name="checkmark" size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* Category Filter in Modal */}
                    <Text style={[styles.filterSectionTitle, { color: theme.text, marginTop: 20 }]}>التصنيف</Text>
                    <ScrollView style={{ maxHeight: 200 }}>
                        <TouchableOpacity
                            style={[
                                styles.sortOption,
                                selectedCategory === null && { backgroundColor: theme.primary + '20' }
                            ]}
                            onPress={() => setSelectedCategory(null)}
                        >
                            <Text style={{ color: selectedCategory === null ? theme.primary : theme.text }}>
                                📦 الكل
                            </Text>
                            {selectedCategory === null && (
                                <Ionicons name="checkmark" size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                        {REAL_CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.sortOption,
                                    selectedCategory === cat.id && { backgroundColor: theme.primary + '20' }
                                ]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <Text style={{ color: selectedCategory === cat.id ? theme.primary : theme.text }}>
                                    {cat.icon} {cat.name}
                                </Text>
                                {selectedCategory === cat.id && (
                                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Apply Button */}
                    <TouchableOpacity
                        style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                        onPress={() => setFilterModalVisible(false)}
                    >
                        <Text style={styles.applyBtnText}>تطبيق</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // No full screen loader. Show skeletons in list.
    // if (loading && products.length === 0) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color={theme.primary} />
    //             <Text style={styles.loadingText}>{t('loadingProducts')}</Text>
    //         </View>
    //     );
    // }

    return (
        <View style={styles.container}>
            {/* ✨ Cosmic Background Elements */}
            <AppBackground />

            {/* Header with Search */}
            <SearchHeader
                title={t('productsTitle')}
                onSearch={handleSearch}
                onCartPress={() => router.push('/cart')}
                onNotificationPress={() => router.push('/notifications')}
                onMenuPress={() => router.push('/profile')}
                cartCount={cartItems.length}
            />

            {viewMode === 'grid' ? (
                // Grid View
                <FlatList
                    key="grid-view"
                    data={loading && products.length === 0 ? [1, 2, 3, 4, 5, 6] : products}
                    renderItem={loading && products.length === 0 ?
                        () => <View style={styles.gridItem}><ProductSkeleton style={{ width: '100%' }} /></View> :
                        renderProduct
                    }
                    keyExtractor={(item, index) => loading && products.length === 0 ? index.toString() : item.id.toString()}
                    numColumns={2}
                    ListHeaderComponent={MemoizedHeader}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={60} color={theme.textMuted} />
                            <Text style={styles.emptyText}>{t('noProducts')}</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.primary}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <ActivityIndicator style={styles.footerLoader} color={theme.primary} />
                        ) : null
                    }
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.row}
                    initialNumToRender={6}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    removeClippedSubviews={true}
                    updateCellsBatchingPeriod={50}
                />
            ) : (
                // Brand/Category View
                <FlatList
                    key="brand-view"
                    data={Object.entries(getProductsByCategory())}
                    renderItem={({ item: [catId, data] }) => (
                        <BrandSection
                            key={catId}
                            title={data.name}
                            titleAr={data.name}
                            products={data.products}
                            onViewAll={() => handleCategorySelect(catId)}
                            onProductPress={handleProductPress}
                            onAddToCart={handleAddToCart}
                            onFavorite={handleFavorite}
                            isFavorite={isFavorite}
                        />
                    )}
                    keyExtractor={([id]) => id}
                    ListHeaderComponent={MemoizedHeader}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.primary}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}

            {/* Render Filter Modal */}
            <FilterModal />
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },

    // ✨ Premium Background Pattern
    bgOrb1: {
        position: 'absolute',
        top: -100,
        right: -80,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: isDark ? 'rgba(102, 126, 234, 0.25)' : 'rgba(102, 126, 234, 0.35)',
        zIndex: 0,
    },
    bgOrb2: {
        position: 'absolute',
        bottom: 50,
        left: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: isDark ? 'rgba(212, 175, 118, 0.20)' : 'rgba(212, 175, 118, 0.30)',
        zIndex: 0,
    },
    bgOrb3: {
        position: 'absolute',
        top: height * 0.4,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: isDark ? 'rgba(138, 104, 148, 0.15)' : 'rgba(184, 146, 79, 0.25)',
        zIndex: 0,
    },
    // ... existing styles ...
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(30,30,40,0.6)' : 'rgba(255,255,255,0.8)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: theme.border,
        marginLeft: 8,
    },
    filterBtnText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    applyBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    loadingText: {
        marginTop: 16,
        color: theme.textSecondary,
        fontSize: 14,
    },
    listHeader: {
        paddingTop: 16,
    },
    categoriesList: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    categoryCircleWrapper: {
        alignItems: 'center',
        marginRight: 18,
        width: 60,
    },
    categoryCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: isDark ? 'rgba(30,30,40,0.6)' : '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryCircleActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
        shadowColor: theme.primary,
        shadowOpacity: 0.3,
    },
    categoryCircleLabel: {
        marginTop: 6,
        fontSize: 10,
        textAlign: 'center',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    viewModeToggle: {
        flexDirection: 'row',
        backgroundColor: isDark ? 'rgba(30,30,40,0.6)' : 'rgba(255,255,255,0.8)',
        borderRadius: 8,
        padding: 2,
        borderWidth: 1,
        borderColor: theme.border,
    },
    viewModeBtn: {
        padding: 8,
        borderRadius: 6,
    },
    viewModeBtnActive: {
        backgroundColor: theme.primary,
    },
    resultsCount: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    listContent: {
        paddingBottom: 48,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    gridItem: {
        width: (width - 48) / 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        marginTop: 16,
        color: theme.textMuted,
        fontSize: 16,
    },
    footerLoader: {
        paddingVertical: 24,
    },
});
