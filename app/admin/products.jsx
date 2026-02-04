/**
 * Admin Products - Kataraa
 * Enhanced product management page for admins
 * 🔐 Protected by RequireAdmin
 * Features: CRUD, Stock Management, Categories, Low Stock Alerts
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import AddProductModal from '../../src/components/admin/AddProductModal';
import {
    getAllProducts,
    deleteProduct,
    PRODUCT_CATEGORIES,
} from '../../src/services/adminProductService';
import { syncMockProductsToFirestore, getProductCount } from '../../src/services/syncProducts';
import currencyService from '../../src/services/currencyService';

export default function AdminProducts() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const { search } = useLocalSearchParams();
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState(search || '');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const options = { limitCount: 100 };
            if (selectedCategory !== 'all') {
                options.category = selectedCategory;
            }

            let fetchedProducts = await getAllProducts(options);

            // Auto-sync if no products exist (First Run)
            if (fetchedProducts.length === 0 && selectedCategory === 'all') {
                console.log('No products found, auto-syncing mock data...');
                await syncMockProductsToFirestore();
                fetchedProducts = await getAllProducts(options);
            }

            setProducts(fetchedProducts);
        } catch (error) {
            console.error('Error loading products:', error);
            Alert.alert('خطأ', 'فشل في تحميل المنتجات');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    // Initial load and filter effect
    React.useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter products locally for search (since Firestore search is limited)
    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Stats
    const stats = {
        total: products.length,
        active: products.filter(p => p.status === 'active').length,
        lowStock: products.filter(p => p.status === 'low_stock').length,
        outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const handleAddProduct = () => {
        setEditingProduct(null);
        setShowAddModal(true);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setShowAddModal(true);
    };

    const handleDeleteProduct = (productId, productName) => {
        Alert.alert(
            'حذف المنتج',
            `هل أنت متأكد من حذف "${productName}"؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProduct(productId);
                            // Refresh data from Firestore
                            loadData();
                            Alert.alert('تم الحذف', 'تم حذف المنتج بنجاح');
                        } catch (error) {
                            console.error('Error deleting product:', error);
                            Alert.alert('خطأ', 'فشل في حذف المنتج');
                        }
                    }
                }
            ]
        );
    };

    const handleProductSaved = () => {
        setShowAddModal(false);
        setEditingProduct(null);
        // Refresh from Firestore
        loadData();
    };



    const getStatusBadge = (status, stock, lowStockThreshold = 5) => {
        // Auto-calculate status based on stock
        if (stock === 0) {
            return { label: 'نفذ', color: '#EF4444', icon: 'alert-circle' };
        } else if (stock <= lowStockThreshold) {
            return { label: 'كمية قليلة', color: '#F59E0B', icon: 'warning' };
        } else if (status === 'active') {
            return { label: 'متوفر', color: '#10B981', icon: 'checkmark-circle' };
        } else if (status === 'draft') {
            return { label: 'مسودة', color: '#6B7280', icon: 'document' };
        }
        return { label: 'متوفر', color: '#10B981', icon: 'checkmark-circle' };
    };

    const getCategoryName = (item) => {
        if (item.categories?.[0]?.name) {
            return item.categories[0].name;
        }
        const cat = PRODUCT_CATEGORIES.find(c => c.id === item.category);
        return cat ? cat.name : (item.category || 'غير مصنف');
    };

    const renderProduct = ({ item }) => {
        const status = getStatusBadge(item.status, item.stock, item.lowStockThreshold);
        // Fix: backend stores images as objects {src: url}, so we must access .src
        const firstImage = item.images?.[0];
        const imageUri = (typeof firstImage === 'object' ? firstImage?.src : firstImage) || 'https://via.placeholder.com/100';

        return (
            <TouchableOpacity
                style={[styles.productCard, { backgroundColor: theme.backgroundCard }]}
                onPress={() => handleEditProduct(item)}
                activeOpacity={0.7}
            >
                <Image source={{ uri: imageUri }} style={styles.productImage} />

                <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
                        {item.name}
                    </Text>
                    {item.sku ? (
                        <Text style={{ color: theme.textMuted, fontSize: 10, marginBottom: 4 }}>
                            SKU: {item.sku}
                        </Text>
                    ) : null}

                    <View style={styles.priceRow}>
                        <Text style={[styles.productPrice, { color: theme.primary }]}>
                            {currencyService.formatAdminPrice(item.price)}
                        </Text>
                        <Text style={[styles.categoryText, { color: theme.textMuted }]}>
                            {getCategoryName(item)}
                        </Text>
                    </View>

                    <View style={styles.productMeta}>
                        <View style={styles.stockBadge}>
                            <Ionicons name="cube-outline" size={12} color={theme.textSecondary} />
                            <Text style={[styles.stockText, { color: theme.textSecondary }]}>
                                {item.stock}
                            </Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                            <Ionicons name={status.icon} size={10} color={status.color} />
                            <Text style={[styles.statusText, { color: status.color }]}>
                                {status.label}
                            </Text>
                        </View>
                    </View>

                    {item.tags?.length > 0 && (
                        <View style={styles.tagsRow}>
                            {item.tags.slice(0, 2).map((tag, i) => (
                                <Text key={i} style={[styles.tagChip, { color: theme.textMuted }]}>
                                    #{tag}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.productActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.primary + '20' }]}
                        onPress={() => handleEditProduct(item)}
                    >
                        <Ionicons name="create-outline" size={18} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
                        onPress={() => handleDeleteProduct(item.id, item.name)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderLowStockAlert = () => {
        if (stats.lowStock === 0 && stats.outOfStock === 0) return null;

        return (
            <TouchableOpacity
                style={[styles.alertBanner, { backgroundColor: '#FEF3C720' }]}
                onPress={() => setSelectedCategory('all')}
            >
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <Text style={[styles.alertText, { color: '#F59E0B' }]}>
                    {stats.lowStock + stats.outOfStock} منتجات تحتاج انتباهك
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>إدارة المنتجات</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddProduct}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, { backgroundColor: theme.backgroundCard }]}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="البحث عن منتج..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Category Filters */}
            <View style={{ transform: [{ scaleX: -1 }] }}>
                {/* Trick to force RTL direction for horizontal list on Android/iOS consistently */}
                <FlatList
                    horizontal
                    data={[{ id: 'all', name: 'الكل', icon: '📦' }, ...PRODUCT_CATEGORIES]}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.categoriesContainer, { flexDirection: 'row-reverse' }]}
                    renderItem={({ item }) => (
                        <View style={{ transform: [{ scaleX: -1 }] }}>
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor: selectedCategory === item.id
                                            ? theme.primary
                                            : theme.backgroundCard,
                                        borderColor: selectedCategory === item.id ? theme.primary : theme.border,
                                        borderWidth: 1,
                                    }
                                ]}
                                onPress={() => setSelectedCategory(item.id)}
                            >
                                <Text style={styles.categoryIcon}>{item.icon}</Text>
                                <Text style={[
                                    styles.categoryChipText,
                                    { color: selectedCategory === item.id ? '#fff' : theme.text }
                                ]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={[styles.statItem, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.total}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>إجمالي</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>متوفر</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.lowStock}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>قليل</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.outOfStock}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>نفذ</Text>
                </View>
            </View>

            {/* Low Stock Alert */}
            {renderLowStockAlert()}

            {/* Products List */}
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={renderProduct}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={64} color={theme.textMuted} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            جاري تحميل المنتجات...
                        </Text>
                    </View>
                }
            />

            {/* Add/Edit Product Modal */}
            <AddProductModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleProductSaved}
                editProduct={editingProduct}
            />
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        padding: 16,
        paddingBottom: 8,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        textAlign: 'right',
    },
    categoriesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 10,
        minWidth: 80,
        height: 44,
        justifyContent: 'center',
        gap: 8,
    },
    categoryIcon: {
        fontSize: 14,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        paddingRight: 4,
    },
    statsBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        padding: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 10,
        marginTop: 2,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    alertText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
        paddingTop: 4,
    },
    productCard: {
        flexDirection: 'row-reverse',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 16,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    categoryText: {
        fontSize: 11,
    },
    productMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 8,
    },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stockText: {
        fontSize: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    tagsRow: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 8,
    },
    tagChip: {
        fontSize: 11,
    },
    productActions: {
        gap: 12,
        paddingLeft: 8,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
    },
    emptyBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
