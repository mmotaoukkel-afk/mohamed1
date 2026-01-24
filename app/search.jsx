/**
 * Search Screen - Cosmic Luxury Edition
 * 🌙 Ethereal search with floating glass elements
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useCart } from '../src/context/CartContext';
import { useCartAnimation } from '../src/context/CartAnimationContext';
import { useFavorites } from '../src/context/FavoritesContext';
import { useTranslation } from '../src/hooks/useTranslation';
import { storage } from '../src/utils/storage';
import { useSearchProducts } from '../src/hooks/useProducts';
import ProductCardSoko from '../src/components/ProductCardSoko';
import { ProductSkeleton } from '../src/components/SkeletonLoader';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const { triggerAddToCart } = useCartAnimation();
    const { toggleFavorite, isFavorite } = useFavorites();
    const styles = getStyles(theme, isDark);

    const [query, setQuery] = useState('');
    const { data: results, isLoading, isError } = useSearchProducts(query);
    const [recentSearches, setRecentSearches] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        loadRecentSearches();
    }, []);

    const loadRecentSearches = async () => {
        try {
            const saved = await storage.getItem('search_history');
            if (saved) {
                setRecentSearches(saved);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        }
    };

    const saveSearch = async (searchQuery) => {
        try {
            const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
            await storage.setItem('search_history', updated);
            setRecentSearches(updated);
        } catch (error) {
            console.error('Error saving search:', error);
        }
    };

    const clearHistory = async () => {
        try {
            await storage.removeItem('search_history');
            setRecentSearches([]);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    // Auto-save successful searches
    useEffect(() => {
        if (results && results.length > 0 && query.length >= 2) {
            saveSearch(query);
            setHasSearched(true);
        } else if (query.length < 2) {
            setHasSearched(false);
        }
    }, [results]);

    const handleRecentSearchPress = (searchQuery) => {
        setQuery(searchQuery);
    };

    const handleLoadMore = () => {
        // Client-side pagination can be added here if needed, 
        // but current API returns all matches (up to 100)
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

    return (
        <View style={styles.container}>
            {/* Cosmic Background */}
            <View style={styles.bgOrb1} />
            <View style={styles.bgOrb2} />

            {/* Header */}
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                        >
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('searchProducts')}</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    {/* Glass Search Input */}
                    <View style={styles.searchInputWrapper}>
                        <View style={[styles.searchInputContainer, { backgroundColor: isDark ? 'rgba(26,21,32,0.7)' : 'rgba(255,255,255,0.8)' }]}>
                            <Ionicons name="search" size={20} color={theme.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('searchHere')}
                                placeholderTextColor={theme.textMuted}
                                value={query}
                                onChangeText={setQuery}
                                autoFocus
                                returnKeyType="search"
                            />
                            {query.length > 0 && (
                                <TouchableOpacity onPress={() => setQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
                {!hasSearched && query.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        {recentSearches.length > 0 && (
                            <>
                                <View style={styles.recentHeader}>
                                    <Text style={styles.recentTitle}>
                                        {t('recentSearches')}
                                    </Text>
                                    <TouchableOpacity onPress={clearHistory}>
                                        <Text style={styles.clearBtn}>
                                            {t('clearHistory')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.chipsContainer}>
                                    {recentSearches.map((item, index) => (
                                        <Animated.View
                                            key={index}
                                            entering={FadeInDown.delay(index * 50).springify()}
                                        >
                                            <TouchableOpacity
                                                style={styles.chip}
                                                onPress={() => handleRecentSearchPress(item)}
                                            >
                                                <BlurView
                                                    intensity={isDark ? 25 : 45}
                                                    tint={isDark ? "dark" : "light"}
                                                    style={styles.chipBlur}
                                                >
                                                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                                                    <Text style={styles.chipText}>{item}</Text>
                                                </BlurView>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    ))}
                                </View>
                            </>
                        )}
                        <View style={styles.startSearchContainer}>
                            <View style={styles.searchIconCircle}>
                                <Ionicons name="search-outline" size={48} color={theme.primary} />
                            </View>
                            <Text style={styles.emptyText}>
                                {t('startSearching')}
                            </Text>
                        </View>
                    </View>
                ) : isLoading ? (
                    <View style={styles.content}>
                        <View style={styles.row}>
                            <ProductSkeleton style={styles.gridItem} />
                            <ProductSkeleton style={styles.gridItem} />
                        </View>
                        <View style={styles.row}>
                            <ProductSkeleton style={styles.gridItem} />
                            <ProductSkeleton style={styles.gridItem} />
                        </View>
                        <View style={styles.row}>
                            <ProductSkeleton style={styles.gridItem} />
                            <ProductSkeleton style={styles.gridItem} />
                        </View>
                    </View>
                ) : (results?.length === 0 && hasSearched) ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="search-outline" size={48} color={theme.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {t('noResultsFound')}
                        </Text>
                        <Text style={styles.emptyText}>
                            {t('tryDifferentSearch')}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.row}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}

                    />
                )}
            </View>
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    bgOrb1: {
        position: 'absolute',
        top: 100,
        right: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: theme.primary + '10',
        zIndex: -1,
    },
    bgOrb2: {
        position: 'absolute',
        bottom: 100,
        left: -60,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: theme.accent + '08',
        zIndex: -1,
    },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '300',
        color: '#fff',
        letterSpacing: 0.5,
    },
    searchInputWrapper: {
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        height: 52,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
        paddingVertical: 0,
        color: theme.text,
    },
    content: {
        flex: 1,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        letterSpacing: 0.3,
    },
    clearBtn: {
        fontSize: 13,
        color: theme.primary,
        fontWeight: '500',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 10,
    },
    chip: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    chipBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(184,159,204,0.15)' : 'rgba(212,184,224,0.25)',
        borderRadius: 18,
    },
    chipText: {
        fontSize: 14,
        color: theme.text,
    },
    startSearchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        paddingTop: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.textMuted + '15',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '300',
        color: theme.text,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    emptyText: {
        fontSize: 14,
        color: theme.textMuted,
        textAlign: 'center',
        marginTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.primary + '20',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: theme.textMuted,
        letterSpacing: 0.5,
    },
    listContent: {
        paddingBottom: 24,
        paddingTop: 16,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    gridItem: {
        width: (width - 52) / 2,
    },
});
