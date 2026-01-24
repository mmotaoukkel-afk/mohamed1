/**
 * RelatedProducts - Horizontal carousel of similar items
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Surface, Text } from './ui';
import api from '../services/api';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.4;

export default function RelatedProducts({ productId, category, tokens }) {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRelated();
    }, [productId, category]);

    const fetchRelated = async () => {
        try {
            // Fetch products from same category (or similar tags)
            const allProducts = await api.getProducts();

            // Filter by category and exclude current product
            const related = allProducts
                .filter(p =>
                    p.id !== productId &&
                    (p.categories?.some(c => c.name === category) || p.category === category)
                )
                .slice(0, 6); // Limit to 6 items

            setProducts(related);
        } catch (error) {
            console.error('Error fetching related products:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return `${parseFloat(price || 0).toFixed(3)} MAD`;
    };

    const renderProduct = ({ item }) => {
        const onSale = item.on_sale && item.regular_price;
        const discount = onSale ? Math.round((1 - item.sale_price / item.regular_price) * 100) : 0;

        return (
            <TouchableOpacity
                onPress={() => router.push(`/product/${item.id}`)}
                activeOpacity={0.8}
            >
                <Surface variant="glass" radius="xl" style={styles.card}>
                    {/* Image */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={
                                item.images?.[0]
                                    ? typeof item.images[0] === 'string'
                                        ? { uri: item.images[0] }
                                        : { uri: item.images[0].src }
                                    : { uri: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400' }
                            }
                            style={styles.productImage}
                            resizeMode="cover"
                        />
                        {onSale && (
                            <View style={[styles.badge, { backgroundColor: tokens.colors.error }]}>
                                <Text variant="caption" style={{ color: '#FFF', fontWeight: 'bold' }}>
                                    -{discount}%
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                        <Text variant="body" numberOfLines={2} style={{ color: tokens.colors.text }}>
                            {item.name}
                        </Text>
                        <View style={styles.priceRow}>
                            <Text variant="caption" style={{ color: tokens.colors.primary, fontWeight: 'bold' }}>
                                {formatPrice(item.sale_price || item.price)}
                            </Text>
                            {onSale && (
                                <Text variant="caption" style={[styles.oldPrice, { color: tokens.colors.textMuted }]}>
                                    {formatPrice(item.regular_price)}
                                </Text>
                            )}
                        </View>
                    </View>
                </Surface>
            </TouchableOpacity>
        );
    };

    if (loading || products.length === 0) {
        return null; // Don't show section if no products
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="title" style={{ color: tokens.colors.text }}>
                    You might also like
                </Text>
                <Ionicons name="sparkles" size={20} color={tokens.colors.primary} />
            </View>

            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
                snapToInterval={ITEM_WIDTH + 12}
                decelerationRate="fast"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 24,
    },
    list: {
        paddingHorizontal: 24,
        gap: 12,
    },
    card: {
        width: ITEM_WIDTH,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: ITEM_WIDTH,
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    info: {
        padding: 12,
        gap: 6,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    oldPrice: {
        textDecorationLine: 'line-through',
        fontSize: 11,
    },
});
