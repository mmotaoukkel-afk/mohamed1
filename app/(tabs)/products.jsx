/**
 * Products Screen - Kataraa SOKO Style
 * Redesigned products listing with brand sections and improved layout
 * Dark Mode Supported 🌙
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
    Modal,
    ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Services & Context
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../../src/context/CartContext';
import { useCartAnimation } from '../../src/context/CartAnimationContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useTheme } from '../../src/context/ThemeContext';

// Components
import SearchHeader from '../../src/components/SearchHeader';
import ProductCardSoko from '../../src/components/ProductCardSoko';
import BrandSection from '../../src/components/BrandSection';
import { ProductSkeleton, CategorySkeleton } from '../../src/components/SkeletonLoader';

import { useTranslation } from '../../src/hooks/useTranslation';
import { useInfiniteProducts, useCategories } from '../../src/hooks/useProducts';

const { width } = Dimensions.get('window');

export default function ProductsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { cartItems } = useCart();
    const { triggerAddToCart } = useCartAnimation();
    const { toggleFavorite, isFavorite } = useFavorites();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(theme, isDark);

    const [selectedCategory, setSelectedCategory] = useState(params.category || null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'brand'
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price_low', 'price_high', 'name'

    // Real categories from kataraa.com
    const realCategories = [
        { id: 'سيروم', name: 'سيروم', icon: '💧' },
        { id: 'واقي الشمس', name: 'واقي الشمس', icon: '☀️' },
        { id: 'مرطب للبشرة', name: 'مرطب', icon: '✨' },
        { id: 'غسول', name: 'غسول', icon: '🧼' },
        { id: 'تونر', name: 'تونر', icon: '💦' },
        { id: 'ماسك للوجه', name: 'ماسك', icon: '🎭' },
        { id: 'العناية بالعين', name: 'العين', icon: '👁️' },
        { id: 'العناية بالشعر', name: 'الشعر', icon: '💇' },
        { id: 'حب الشباب والبثور', name: 'حب الشباب', icon: '🎯' },
        { id: 'تجاعيد البشره', name: 'التجاعيد', icon: '⏳' },
        { id: 'مسحات', name: 'مسحات', icon: '🧴' },
        { id: 'المكياج', name: 'المكياج', icon: '💄' },
    ];

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

    const handleAddToCart = React.useCallback((item) => {
        triggerAddToCart({
            id: item.id,
            name: item.name,
            price: item.sale_price || item.price,
            image: item.images?.[0]?.src,
            quantity: 1,
        });
    }, [triggerAddToCart]);

    const handleFavorite = React.useCallback((item) => {
        toggleFavorite({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.images?.[0]?.src,
        });
    }, [toggleFavorite]);

    // Group products by category for brand view
    const getProductsByCategory = () => {
        const grouped = {};
        categories.slice(0, 5).forEach(cat => {
            grouped[cat.id] = {
                name: cat.name,
                products: products.filter(p =>
                    p.categories?.some(c => c.id === cat.id)
                ).slice(0, 6)
            };
        });
        return grouped;
    };

    // Render product for grid view
    // Render product for grid view
    const renderProduct = React.useCallback(({ item }) => (
        <View style={styles.gridItem}>
            <ProductCardSoko
                item={item}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
                onFavorite={handleFavorite}
                isFavorite={isFavorite(item.id)}
            />
        </View>
    ), [handleProductPress, handleAddToCart, handleFavorite, isFavorite, styles.gridItem]);

    // Category Mapping Helper - Enhanced with premium beauty icons
    const getCategoryDetails = (catName) => {
        const lowerName = catName?.toLowerCase() || '';

        // Skincare & Basics
        if (lowerName.includes('skincare') || lowerName.includes('العناية بالبشرة'))
            return { label: t('skincare') || 'Skincare', icon: 'face-woman-outline', provider: MaterialCommunityIcons };

        // Acne
        if (lowerName.includes('acne') || lowerName.includes('حب الشباب'))
            return { label: t('acne'), icon: 'bandage-outline', provider: Ionicons };

        // Makeup
        if (lowerName.includes('makeup') || lowerName.includes('المكياج'))
            return { label: t('makeup'), icon: 'eye-outline', provider: Ionicons };

        // Hair
        if (lowerName.includes('hair') || lowerName.includes('الشعر'))
            return { label: t('hair'), icon: 'hair-dryer-outline', provider: MaterialCommunityIcons };

        // Body
        if (lowerName.includes('body') || lowerName.includes('الجسم'))
            return { label: t('body'), icon: 'emoticon-outline', provider: MaterialCommunityIcons };

        // Serum
        if (lowerName.includes('serum') || lowerName.includes('السيروم'))
            return { label: t('serum'), icon: 'water-outline', provider: Ionicons };

        // Sun Care
        if (lowerName.includes('sun') || lowerName.includes('شمس'))
            return { label: t('suncare'), icon: 'sunny-outline', provider: Ionicons };

        // Value Sets
        if (lowerName.includes('set') || lowerName.includes('مجموعات'))
            return { label: t('sets'), icon: 'gift-outline', provider: Ionicons };

        // Nails
        if (lowerName.includes('nail') || lowerName.includes('أظافر'))
            return { label: t('nail') || 'Nail', icon: 'bottle-tonic-plus-outline', provider: MaterialCommunityIcons };

        // Cleansers
        if (lowerName.includes('cleanser') || lowerName.includes('منظفات'))
            return { label: t('cleansers'), icon: 'water-outline', provider: MaterialCommunityIcons };

        // Masks
        if (lowerName.includes('mask') || lowerName.includes('ماسك'))
            return { label: t('masks'), icon: 'face-mask-outline', provider: MaterialCommunityIcons };

        // Creams & Moisturizers
        if (lowerName.includes('cream') || lowerName.includes('moist') || lowerName.includes('مرطب'))
            return { label: t('moisturizers'), icon: 'lotion-outline', provider: MaterialCommunityIcons };

        // Eye Care
        if (lowerName.includes('eye') || lowerName.includes('عين'))
            return { label: t('eyeCare'), icon: 'eye-circle-outline', provider: MaterialCommunityIcons };

        // Lip Care
        if (lowerName.includes('lip') || lowerName.includes('شفاه'))
            return { label: t('lipCare'), icon: 'lipstick', provider: MaterialCommunityIcons };

        // Toner
        if (lowerName.includes('toner') || lowerName.includes('تونر'))
            return { label: t('toners'), icon: 'bottle-wine-outline', provider: MaterialCommunityIcons };

        // Anti-Aging
        if (lowerName.includes('aging') || lowerName.includes('تجاعيد'))
            return { label: t('antiAging'), icon: 'auto-fix', provider: MaterialCommunityIcons };

        return { label: catName, icon: 'dots-grid', provider: MaterialCommunityIcons };
    };

    // Render category chip
    const renderCategory = ({ item }) => {
        const isAll = item.id === null;
        const details = isAll ? { label: t('all'), icon: 'apps-outline', provider: Ionicons } : getCategoryDetails(item.name);
        const IconProvider = details.provider || Ionicons;

        return (
            <TouchableOpacity
                style={styles.categoryCircleWrapper}
                onPress={() => handleCategorySelect(item.id)}
            >
                <View
                    style={[
                        styles.categoryCircle,
                        selectedCategory === item.id && styles.categoryCircleActive,
                    ]}
                >
                    <IconProvider
                        name={details.icon}
                        size={22}
                        color={selectedCategory === item.id ? '#fff' : (isDark ? theme.primary : '#1A1A1A')}
                    />
                </View>
                <Text style={[
                    styles.categoryCircleLabel,
                    { color: selectedCategory === item.id ? theme.primary : theme.textSecondary },
                    selectedCategory === item.id && { fontWeight: '700' }
                ]}>
                    {details.label}
                </Text>
            </TouchableOpacity>
        );
    };

    // Render header with categories
    const ListHeader = () => (
        <View style={styles.listHeader}>
            {/* Real Categories Filter with Arabic names */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
            >
                {/* All Button */}
                <TouchableOpacity
                    style={styles.categoryCircleWrapper}
                    onPress={() => setSelectedCategory(null)}
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
                    ]}>الكل</Text>
                </TouchableOpacity>

                {/* Real Categories */}
                {realCategories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={styles.categoryCircleWrapper}
                        onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                    >
                        <View style={[
                            styles.categoryCircle,
                            selectedCategory === cat.id && styles.categoryCircleActive,
                        ]}>
                            <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                        </View>
                        <Text style={[
                            styles.categoryCircleLabel,
                            { color: selectedCategory === cat.id ? theme.primary : theme.textSecondary },
                            selectedCategory === cat.id && { fontWeight: '700' }
                        ]}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

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
                    {products.length} منتج
                </Text>
            </View>
        </View>
    );

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
                        {realCategories.map(cat => (
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
                    ListHeaderComponent={ListHeader}
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
                            onViewAll={() => handleCategorySelect(parseInt(catId))}
                            onProductPress={handleProductPress}
                            onAddToCart={handleAddToCart}
                            onFavorite={handleFavorite}
                            isFavorite={isFavorite}
                        />
                    )}
                    keyExtractor={([id]) => id}
                    ListHeaderComponent={ListHeader}
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
        backgroundColor: theme.background,
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
