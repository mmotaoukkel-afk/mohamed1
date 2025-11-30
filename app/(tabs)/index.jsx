import { Text, View, FlatList, TouchableOpacity, StyleSheet, Modal, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from 'react-native-vector-icons/Feather';
import Category from "../components/category";
import ProductCard from "../components/productCard";
import NoResults from "../components/NoResults";
import { useState, useMemo, useEffect } from "react";
import data from "../data/data";
import { useTheme } from "../../src/context/ThemeContext";
import { useFavorites } from "../../src/context/FavoritesContext";
import { BorderRadius, Spacing, FontSize } from "../../constants/theme";
import PremiumBackground from "../components/PremiumBackground";
import { LinearGradient } from 'expo-linear-gradient';
import SkeletonProduct from "../components/SkeletonProduct";
import { useRouter } from "expo-router";
import SearchBar from "../components/SearchBar";

const { width } = Dimensions.get('window');

const MyScreen = () => {
    const { colors } = useTheme();
    const { toggleFavorite } = useFavorites();
    const router = useRouter();

    const categories = ['All', 'Discount', 'T-shirt', 'Hoodie', 'Hat'];
    const popularSearches = ["T-shirt", "Shoes", "Hoodie", "Watch", "Bag", "Jacket"];

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate data loading
        const timer = setTimeout(() => {
            setProducts(data.products);
            setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleLike = (productId) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            toggleFavorite(product);
        }
        setProducts(prevProducts =>
            prevProducts.map(product =>
                product.id === productId
                    ? { ...product, isLiked: !product.isLiked }
                    : product
            )
        );
    };

    const displayedProducts = useMemo(() => {
        let filtered = products;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(product =>
                product.title.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query)
            );
        }

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        return filtered;
    }, [products, selectedCategory, searchQuery]);

    const renderHeader = () => (
        <>
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setShowSearchModal(true)}
                >
                    <Feather name="search" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/screens/OnboardingScreen")}>
                    <Text style={styles.headerTitle}>FUNNY SHOP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => router.push("/screens/NotificationsScreen")}
                >
                    <Feather name="bell" size={22} color="#fff" />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            {/* Banner */}
            <View style={styles.bannerWrapper}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bannerContainer}
                >
                    <View style={styles.bannerLeft}>
                        <View style={styles.bannerBadge}>
                            <Text style={styles.bannerBadgeText}>On Any Amount</Text>
                        </View>
                        <Text style={styles.bannerDiscount}>50 %</Text>
                        <Text style={styles.bannerOffText}>OFF</Text>
                        <TouchableOpacity
                            style={styles.bannerButton}
                            onPress={() => router.push("/screens/OnboardingScreen")}
                        >
                            <Text style={styles.bannerButtonText}>View Intro</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bannerRight}>
                        <Text style={styles.bannerEmoji}>👕</Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <FlatList
                    data={categories}
                    renderItem={({ item }) => (
                        <Category
                            item={item}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />
                    )}
                    keyExtractor={(item) => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>New Arrival</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAll}>See all</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                {/* Search Modal */}
                <Modal
                    visible={showSearchModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowSearchModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <SafeAreaView style={{ flex: 1 }}>
                                {/* Modal Header */}
                                <View style={styles.searchHeader}>
                                    <View style={{ flex: 1 }}>
                                        <SearchBar
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholder="Search products..."
                                            autoFocus={true}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setShowSearchModal(false)}
                                    >
                                        <Text style={styles.closeButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Search Content */}
                                {searchQuery.trim() === '' ? (
                                    <View style={styles.popularSearchContainer}>
                                        <Text style={styles.popularTitle}>Popular Searches</Text>
                                        <View style={styles.tagsContainer}>
                                            {popularSearches.map((tag, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.tag}
                                                    onPress={() => setSearchQuery(tag)}
                                                >
                                                    <Text style={styles.tagText}>{tag}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.resultsHeader}>
                                            <Text style={styles.resultsCount}>
                                                Found {displayedProducts.length} results
                                            </Text>
                                        </View>
                                        <FlatList
                                            data={displayedProducts}
                                            numColumns={2}
                                            keyExtractor={(item) => item.id.toString()}
                                            contentContainerStyle={styles.searchResults}
                                            columnWrapperStyle={displayedProducts.length > 0 ? styles.columnWrapper : null}
                                            renderItem={({ item }) => (
                                                <ProductCard
                                                    item={item}
                                                    isLiked={item.isLiked}
                                                    onLike={handleLike}
                                                />
                                            )}
                                            ListEmptyComponent={<NoResults searchQuery={searchQuery} />}
                                        />
                                    </>
                                )}
                            </SafeAreaView>
                        </View>
                    </View>
                </Modal>

                {isLoading ? (
                    <FlatList
                        data={[1, 2, 3, 4, 5, 6]}
                        numColumns={2}
                        keyExtractor={(item) => item.toString()}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.columnWrapper}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={renderHeader()}
                        renderItem={() => <SkeletonProduct />}
                    />
                ) : (
                    <FlatList
                        data={displayedProducts}
                        numColumns={2}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={displayedProducts.length > 0 ? styles.columnWrapper : null}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={renderHeader()}
                        renderItem={({ item }) => (
                            <ProductCard
                                item={item}
                                isLiked={item.isLiked}
                                onLike={handleLike}
                            />
                        )}
                        ListEmptyComponent={<NoResults searchQuery={searchQuery} />}
                    />
                )}
            </SafeAreaView>
        </PremiumBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 1.5,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
        borderWidth: 1,
        borderColor: '#fff',
    },
    bannerWrapper: {
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    bannerContainer: {
        flexDirection: 'row',
        padding: 24,
        alignItems: 'center',
    },
    bannerLeft: {
        flex: 1,
    },
    bannerBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    bannerBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    bannerDiscount: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 42,
    },
    bannerOffText: {
        fontSize: 24,
        fontWeight: '300',
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
        letterSpacing: 4,
    },
    bannerButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    bannerButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 14,
    },
    bannerRight: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerEmoji: {
        fontSize: 80,
    },
    categoriesContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    viewAll: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    modalContent: {
        flex: 1,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    popularSearchContainer: {
        padding: 20,
    },
    popularTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tagText: {
        color: '#fff',
        fontSize: 14,
    },
    resultsHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    resultsCount: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    searchResults: {
        padding: 16,
    },
});

export default MyScreen;