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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Services & Context
import api from '../../src/services/api';
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

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(params.category || null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'brand'

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchProducts(), fetchCategories()]);
        setLoading(false);
    };

    const fetchProducts = async (pageNum = 1, category = null) => {
        try {
            const data = await api.getProducts(pageNum, 50, category); // 50 منتج لكل صفحة
            if (pageNum === 1) {
                setProducts(data || []);
            } else {
                setProducts(prev => {
                    const combined = [...prev, ...(data || [])];
                    // Deduplicate by ID
                    const uniqueMap = new Map();
                    combined.forEach(item => uniqueMap.set(item.id, item));
                    return Array.from(uniqueMap.values());
                });
            }
            setHasMore((data?.length || 0) === 50); // 50 منتج يعني في صفحات أخرى
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await api.getCategories();
            const filtered = data?.filter(cat => cat.count > 0) || [];

            // Priority keywords for categories with custom icons
            const priorityKeywords = [
                'skincare', 'العناية بالبشرة', 'acne', 'حب الشباب', 'makeup', 'المكياج',
                'hair', 'الشعر', 'body', 'الجسم', 'serum', 'السيروم', 'sun', 'شمس',
                'set', 'مجموعات', 'nail', 'أظافر', 'cleanser', 'منظفات', 'mask',
                'ماسك', 'cream', 'moist', 'مرطب', 'eye', 'عين', 'lip', 'شفاه',
                'toner', 'تونر', 'aging', 'تجاعيد'
            ];

            // Sort: Priority items first
            const sorted = filtered.sort((a, b) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                const isAPriority = priorityKeywords.some(key => nameA.includes(key));
                const isBPriority = priorityKeywords.some(key => nameB.includes(key));

                if (isAPriority && !isBPriority) return -1;
                if (!isAPriority && isBPriority) return 1;
                return 0;
            });

            setCategories(sorted);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleRefresh = React.useCallback(async () => {
        setRefreshing(true);
        setPage(1);
        await fetchProducts(1, selectedCategory);
        setRefreshing(false);
    }, [selectedCategory]);

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchProducts(nextPage, selectedCategory);
        }
    };

    const handleCategorySelect = React.useCallback(async (categoryId) => {
        const newCategory = categoryId === selectedCategory ? null : categoryId;
        setSelectedCategory(newCategory);
        setPage(1);
        setLoading(true);
        await fetchProducts(1, newCategory);
        setLoading(false);
    }, [selectedCategory]);

    const handleSearch = (query) => {
        if (query.trim()) {
            api.searchProducts(query).then(results => {
                setProducts(results || []);
            });
        } else {
            handleRefresh();
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
            {/* Categories Filter */}
            <FlatList
                data={[{ id: null, name: t('all') }, ...categories]}
                renderItem={renderCategory}
                keyExtractor={(item) => (item.id || 'all').toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
            />

            {/* View Mode Toggle & Results Count */}
            <View style={styles.filterRow}>
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

                <Text style={styles.resultsCount}>
                    {t('itemCount', { count: products.length })}
                </Text>
            </View>
        </View>
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
                        hasMore && products.length > 0 ? (
                            <ActivityIndicator style={styles.footerLoader} color={theme.primary} />
                        ) : null
                    }
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.row}
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
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
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
