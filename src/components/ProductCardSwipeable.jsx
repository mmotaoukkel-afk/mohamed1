/**
 * Product Card - Cosmic Luxury (Optimized)
 * Light version without heavy animations
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    // Image, // Replaced with expo-image
    ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

const CARD_WIDTH = 160;
const IMAGE_HEIGHT = 170;

const ProductCardSwipeable = React.memo(({
    item,
    onPress,
    onAddToCart,
    onFavorite,
    isFavorite = false,
    cardWidth = CARD_WIDTH,
}) => {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    // Heart animation only (no continuous animations)
    const heartScale = useSharedValue(1);
    const handleHeartPress = useCallback(() => {
        heartScale.value = withSequence(
            withSpring(1.3, { damping: 8 }),
            withSpring(1, { damping: 10 })
        );
        onFavorite?.(item);
    }, [item, onFavorite]);

    const heartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
    }));

    // Get image URI from different formats
    const getImageUri = (img) => {
        if (!img) return null;
        if (typeof img === 'string') return img;
        if (img.src) return img.src;
        return null;
    };

    const productImages = item?.images || [];
    const placeholderImage = require('../../assets/images/placeholder.png');
    const image1 = getImageUri(productImages[0]) || placeholderImage;
    const image2 = getImageUri(productImages[1]) || getImageUri(productImages[0]) || placeholderImage;
    const images = [image1, image2];

    const isOnSale = item?.on_sale && item?.regular_price && item?.sale_price;
    const isOutOfStock = item?.stock_status === 'outofstock';

    const formatPrice = (price) => `${parseFloat(price || 0).toFixed(3)} ${t('currency')}`;

    // Handle scroll
    const handleScroll = useCallback((event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / cardWidth);
        if (index !== activeIndex && index >= 0 && index < 2) {
            setActiveIndex(index);
        }
    }, [activeIndex, cardWidth]);

    const handleDotPress = useCallback((index) => {
        scrollRef.current?.scrollTo({ x: index * cardWidth, animated: true });
        setActiveIndex(index);
    }, [cardWidth]);

    return (
        <View style={[styles.card, { width: cardWidth }]}>
            {/* Image Section */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => onPress?.(item)}>
                <View style={styles.imageContainer}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={32}
                        style={{ width: cardWidth - 12 }}
                        contentContainerStyle={{ width: (cardWidth - 12) * 2 }}
                    >
                        {images.map((imgUrl, index) => (
                            <Image
                                key={index}
                                source={imgUrl}
                                style={[styles.image, { width: cardWidth - 12, height: IMAGE_HEIGHT }]}
                                contentFit="contain"
                                transition={200}
                            />
                        ))}
                    </ScrollView>

                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', isDark ? 'rgba(26,21,32,0.4)' : 'rgba(254,251,255,0.4)']}
                        style={styles.imageGradient}
                    />

                    {/* Dots Indicator */}
                    <View style={styles.dotsContainer}>
                        {images.map((_, index) => (
                            <TouchableOpacity key={index} onPress={() => handleDotPress(index)}>
                                <View style={[
                                    styles.dot,
                                    activeIndex === index && styles.dotActive
                                ]} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Sale Badge */}
                    {isOnSale && (
                        <View style={styles.saleBadge}>
                            <Text style={styles.saleText}>✦ {t('sale')}</Text>
                        </View>
                    )}

                    {/* Sold Out Overlay */}
                    {isOutOfStock && (
                        <View style={styles.soldOutOverlay}>
                            <View style={styles.soldOutBadge}>
                                <Text style={styles.soldOutText}>{t('outOfStock')}</Text>
                            </View>
                        </View>
                    )}

                    {/* Heart Button */}
                    <TouchableOpacity style={styles.heartBtn} onPress={handleHeartPress}>
                        <Animated.View style={heartStyle}>
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={18}
                                color={isFavorite ? '#D4A5A5' : theme.textMuted}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

            {/* Product Info */}
            <TouchableOpacity style={styles.infoContainer} onPress={() => onPress?.(item)}>
                <Text style={styles.productName} numberOfLines={2}>
                    {item?.name}
                </Text>

                <View style={styles.priceRow}>
                    <Text style={isOnSale ? styles.salePrice : styles.price}>
                        {formatPrice(isOnSale ? item.sale_price : item.price)}
                    </Text>
                    {isOnSale && (
                        <Text style={styles.originalPrice}>
                            {formatPrice(item.regular_price)}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Add to Cart Button */}
            {!isOutOfStock ? (
                <TouchableOpacity
                    style={styles.addToCartBtn}
                    onPress={() => onAddToCart?.(item)}
                >
                    <LinearGradient
                        colors={[theme.primary, theme.primaryDark]}
                        style={styles.addToCartGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text style={styles.addToCartText}>{t('add')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            ) : (
                <View style={[styles.addToCartBtn, styles.soldOutCartBtn]}>
                    <Text style={styles.soldOutCartText}>{t('outOfStock')}</Text>
                </View>
            )}
        </View>
    );
});

export default ProductCardSwipeable;

const getStyles = (theme, isDark) => StyleSheet.create({
    card: {
        marginRight: 14,
        marginVertical: 6,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: isDark ? 'rgba(26,21,32,0.7)' : 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(184,159,204,0.12)' : 'rgba(212,184,224,0.25)',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        padding: 6,
    },
    imageContainer: {
        position: 'relative',
        backgroundColor: 'transparent',
        borderRadius: 16,
        overflow: 'hidden',
    },
    image: {
        backgroundColor: 'transparent',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
        width: 18,
        backgroundColor: theme.primary,
    },
    saleBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: isDark ? 'rgba(26,21,32,0.8)' : 'rgba(255,255,255,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    saleText: {
        color: theme.primary,
        fontSize: 10,
        fontWeight: '700',
    },
    soldOutOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soldOutBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    soldOutText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    heartBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: isDark ? 'rgba(26,21,32,0.8)' : 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        padding: 10,
        paddingBottom: 6,
    },
    productName: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.text,
        lineHeight: 18,
        minHeight: 36,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.text,
    },
    salePrice: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.primary,
    },
    originalPrice: {
        fontSize: 11,
        color: theme.textMuted,
        textDecorationLine: 'line-through',
    },
    addToCartBtn: {
        marginTop: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    addToCartGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 4,
    },
    addToCartText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    soldOutCartBtn: {
        backgroundColor: theme.textMuted,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    soldOutCartText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
});
