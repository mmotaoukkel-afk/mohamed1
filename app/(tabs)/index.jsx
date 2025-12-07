import Feather from '@expo/vector-icons/Feather';
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavorites } from "../../src/context/FavoritesContext";
import { useTheme } from "../../src/context/ThemeContext";
import HomeHeader from "../components/HomeHeader";
import PremiumBackground from "../components/PremiumBackground";

import api from "../services/api";

const { width } = Dimensions.get('window');
const PRODUCTS_PER_PAGE = 50;

const MyScreen = () => {
    const { colors } = useTheme();
    const { toggleFavorite, isFavorite } = useFavorites();
    const router = useRouter();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([{ id: 0, name: "الكل" }]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 🔥 Cache للصفحات المحملة
    const pagesCache = useRef({});

    const [selectedCategory, setSelectedCategory] = useState("الكل");
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);

    useEffect(() => {
        fetchProducts(1);
        fetchCategories();
    }, []);

    const fetchProducts = async (page) => {
        // 🔥 تحقق من الكاش أولاً
        if (pagesCache.current[page]) {
            setProducts(pagesCache.current[page]);
            setCurrentPage(page);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const data = await api.getProducts(page, PRODUCTS_PER_PAGE);

            const formattedProducts = data.map(product => ({
                id: product.id,
                name: product.name,
                price: product.price || "0",
                image: product.images?.[0]?.src || "https://via.placeholder.com/300",
                category: product.categories?.[0]?.name || "غير مصنف",
                categoryId: product.categories?.[0]?.id || 0,
            }));

            // 🔥 حفظ فـ الكاش
            pagesCache.current[page] = formattedProducts;

            setProducts(formattedProducts);
            setCurrentPage(page);

            // حساب عدد الصفحات (تقريبي)
            if (page === 1 && data.length === PRODUCTS_PER_PAGE) {
                setTotalPages(Math.ceil(3500 / PRODUCTS_PER_PAGE));
            }

        } catch (err) {
            console.error("Error:", err);
            setError("فشل في تحميل المنتجات");
        } finally {
            setIsLoading(false);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            fetchProducts(page);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await api.getCategories();
            const formattedCategories = [
                { id: 0, name: "الكل" },
                ...data.map(cat => ({ id: cat.id, name: cat.name }))
            ];
            setCategories(formattedCategories);
        } catch (err) {
            console.error("Error:", err);
        }
    };

    const handleLike = (product) => {
        toggleFavorite({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        });
    };

    const displayedProducts = useMemo(() => {
        let filtered = products;
        if (searchQuery.trim()) {
            filtered = filtered.filter(p => p.name.includes(searchQuery));
        }
        if (selectedCategory !== "الكل") {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }
        return filtered;
    }, [products, selectedCategory, searchQuery]);

    const renderProduct = ({ item }) => (
        <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/product/${item.id}`)}>
            <Image source={{ uri: item.image }} style={styles.productImage} />

            <View style={styles.arBadge}>
                <Feather name="box" size={12} color="#fff" />
                <Text style={styles.arText}>3D</Text>
            </View>

            <TouchableOpacity style={styles.heartButton} onPress={() => handleLike(item)}>
                <Feather name="heart" size={18} color={isFavorite(item.id) ? "#ff4757" : "#fff"} />
            </TouchableOpacity>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>{item.price} د.ك</Text>
            </View>
        </TouchableOpacity>
    );

    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === item.name && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory(item.name)}
        >
            <Text style={[styles.categoryText, selectedCategory === item.name && styles.categoryTextActive]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    // 🔥 أزرار الصفحات
    const renderPagination = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        return (
            <View style={styles.pagination}>
                {/* زر السابق */}
                <TouchableOpacity
                    style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <Feather name="chevron-right" size={20} color={currentPage === 1 ? "#666" : "#fff"} />
                </TouchableOpacity>

                {/* أرقام الصفحات */}
                {start > 1 && (
                    <>
                        <TouchableOpacity style={styles.pageButton} onPress={() => goToPage(1)}>
                            <Text style={styles.pageText}>1</Text>
                        </TouchableOpacity>
                        {start > 2 && <Text style={styles.pageDots}>...</Text>}
                    </>
                )}

                {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                    <TouchableOpacity
                        key={page}
                        style={[styles.pageButton, currentPage === page && styles.pageButtonActive]}
                        onPress={() => goToPage(page)}
                    >
                        <Text style={[styles.pageText, currentPage === page && styles.pageTextActive]}>
                            {page}
                        </Text>
                    </TouchableOpacity>
                ))}

                {end < totalPages && (
                    <>
                        {end < totalPages - 1 && <Text style={styles.pageDots}>...</Text>}
                        <TouchableOpacity style={styles.pageButton} onPress={() => goToPage(totalPages)}>
                            <Text style={styles.pageText}>{totalPages}</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* زر التالي */}
                <TouchableOpacity
                    style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                    onPress={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <Feather name="chevron-left" size={20} color={currentPage === totalPages ? "#666" : "#fff"} />
                </TouchableOpacity>
            </View>
        );
    };

    const ListHeader = () => (
        <View>
            <HomeHeader />
            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesList}
            />
        </View>
    );

    if (isLoading && products.length === 0) {
        return (
            <PremiumBackground>
                <SafeAreaView style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>جاري تحميل المنتجات...</Text>
                </SafeAreaView>
            </PremiumBackground>
        );
    }

    if (error) {
        return (
            <PremiumBackground>
                <SafeAreaView style={[styles.container, styles.centerContent]}>
                    <Feather name="wifi-off" size={48} color="#fff" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchProducts(1)}>
                        <Text style={styles.retryText}>إعادة المحاولة</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </PremiumBackground>
        );
    }

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setShowSearchModal(true)}>
                        <Feather name="search" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>KATARAA</Text>
                    <TouchableOpacity style={styles.iconButton} onPress={() => fetchProducts(currentPage)}>
                        <Feather name="refresh-cw" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                ) : (
                    <FlatList
                        data={displayedProducts}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        contentContainerStyle={styles.productsList}
                        columnWrapperStyle={styles.productsRow}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={ListHeader}
                        ListFooterComponent={renderPagination}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Feather name="package" size={48} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.emptyText}>لا توجد منتجات</Text>
                            </View>
                        }
                    />
                )}

                <Modal visible={showSearchModal} animationType="fade" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.searchContainer}>
                            <View style={styles.searchInputWrapper}>
                                <Feather name="search" size={20} color="#999" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="ابحث عن منتج..."
                                    placeholderTextColor="#999"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                            </View>
                            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                                <Text style={styles.closeSearch}>إغلاق</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 2 },
    iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    categoriesList: { marginBottom: 16, maxHeight: 50, paddingLeft: 8 },
    categoryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 10 },
    categoryButtonActive: { backgroundColor: '#fff' },
    categoryText: { color: '#fff', fontWeight: '600' },
    categoryTextActive: { color: '#667eea' },
    productsList: { paddingBottom: 20 },
    productsRow: { justifyContent: 'space-between', marginBottom: 16 },
    productCard: { width: (width - 48) / 2, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, overflow: 'hidden' },
    productImage: { width: '100%', height: 150, backgroundColor: 'rgba(255,255,255,0.1)' },
    arBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
    arText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    heartButton: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    productInfo: { padding: 12 },
    productName: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 6 },
    productPrice: { fontSize: 16, fontWeight: '800', color: '#fff' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', paddingTop: 60, paddingHorizontal: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, height: 50 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
    closeSearch: { color: '#fff', fontSize: 16, fontWeight: '600' },
    loadingText: { color: '#fff', fontSize: 16, marginTop: 16 },
    errorText: { color: '#fff', fontSize: 16, marginTop: 16, textAlign: 'center' },
    retryButton: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
    retryText: { color: '#fff', fontWeight: '600' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 12 },
    // 🔥 Pagination Styles
    pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, gap: 8 },
    pageButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    pageButtonActive: { backgroundColor: '#fff' },
    pageButtonDisabled: { opacity: 0.5 },
    pageText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    pageTextActive: { color: '#667eea' },
    pageDots: { color: '#fff', fontSize: 14 },
});

export default MyScreen;
