/**
 * Cinematic Product Card - Kataraa 🎬✨
 * Premium product card with 3D tilt, glassmorphism, and smooth animations
 * Inspired by @ayzz.thedesigner and high-end beauty apps
 */

import React, { useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Kataraa Blush Pink Theme
const COLORS = {
    primary: '#F5B5C8',      // Blush Rose
    secondary: '#FFDAB9',    // Soft Peach
    accent: '#B76E79',       // Rose Gold
    background: '#FFF9F5',   // Cream White
    textPrimary: '#3D2314',  // Rich Brown
    textSecondary: '#A67B7B', // Dusty Rose
    cardBg: 'rgba(255, 255, 255, 0.85)',
    shadow: '#F5B5C8',
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ProductCardCinematic = React.memo((props) => {
    const item = props.item;
    const onPress = props.onPress;
    const onAddToCart = props.onAddToCart;
    const onFavorite = props.onFavorite;
    const isFavorite = props.isFavorite || false;
    const index = props.index || 0;

    const { t, locale } = useTranslation();

    // Handle multiple image data formats
    const imageSource = React.useMemo(() => {
        const firstImage = item.images?.[0];
        const placeholder = 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400';
        if (!firstImage) return { uri: placeholder };
        if (typeof firstImage === 'string') return { uri: firstImage };
        if (firstImage.src) return { uri: firstImage.src };
        return { uri: placeholder };
    }, [item.images]);

    const { onSale, discount, formattedPrice, formattedSalePrice, formattedRegularPrice } = React.useMemo(() => {
        const onSale = item.on_sale && item.regular_price && item.sale_price;
        const discount = onSale
            ? Math.round((1 - item.sale_price / item.regular_price) * 100)
            : 0;

        return {
            onSale,
            discount,
            formattedPrice: parseFloat(item.price || 0).toFixed(3),
            formattedSalePrice: onSale ? parseFloat(item.sale_price).toFixed(3) : null,
            formattedRegularPrice: onSale ? parseFloat(item.regular_price).toFixed(3) : null,
        };
    }, [item.on_sale, item.regular_price, item.sale_price, item.price]);

    // Animation values
    const scale = useSharedValue(1);
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const heartScale = useSharedValue(1);
    const fadeIn = useSharedValue(0);

    // Staggered fade-in animation on mount
    React.useEffect(() => {
        fadeIn.value = withTiming(1, { duration: 400 + index * 100 });
    }, []);

    // Press handlers
    const handlePressIn = () => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        rotateX.value = withSpring(5);
        rotateY.value = withSpring(-3);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        rotateX.value = withSpring(0);
        rotateY.value = withSpring(0);
    };

    const handleHeartPress = () => {
        heartScale.value = withSpring(1.4, { damping: 8 }, () => {
            heartScale.value = withSpring(1);
        });
        if (onFavorite) onFavorite(item);
    };

    // Animated styles
    const cardStyle = useAnimatedStyle(() => ({
        opacity: fadeIn.value,
        transform: [
            { scale: scale.value },
            { perspective: 1000 },
            { rotateX: `${rotateX.value}deg` },
            { rotateY: `${rotateY.value}deg` },
            {
                translateY: interpolate(
                    fadeIn.value,
                    [0, 1],
                    [30, 0],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    const heartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
    }));

    const containerRef = useRef(null);

    return (
        <AnimatedTouchable
            ref={containerRef}
            style={[styles.card, cardStyle]}
            onPress={() => onPress && onPress(item)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            {/* Card Background with Glassmorphism */}
            <View style={styles.cardInner}>
                {/* Image Container */}
                <View style={styles.imageContainer}>
                    <Image
                        source={imageSource}
                        style={styles.image}
                        contentFit="cover"
                        transition={300}
                        cachePolicy="memory-disk"
                    />

                    {/* Sale Badge */}
                    {onSale && (
                        <View style={styles.saleBadge}>
                            <Text style={styles.saleText}>-{discount}%</Text>
                        </View>
                    )}

                    {/* Favorite Heart Button */}
                    <TouchableOpacity
                        style={styles.heartButton}
                        onPress={handleHeartPress}
                    >
                        <Animated.View style={heartStyle}>
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={22}
                                color={isFavorite ? '#EF4444' : COLORS.accent}
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Add to Cart Button */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => onAddToCart && onAddToCart(item, containerRef)}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.accent]}
                            style={styles.addButtonGradient}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Product Info */}
                <View style={styles.info}>
                    <Text style={[styles.name, { textAlign: locale === 'ar' ? 'right' : 'left' }]} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                        {onSale ? (
                            <>
                                <Text style={styles.salePrice}>
                                    {formattedSalePrice} {t('currency')}
                                </Text>
                                <Text style={styles.oldPrice}>
                                    {formattedRegularPrice}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.price}>
                                {formattedPrice} {t('currency')}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </AnimatedTouchable>
    );
});

export default ProductCardCinematic;

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginBottom: 16,
        marginHorizontal: 6,
    },
    cardInner: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 24,
        overflow: 'hidden',
        // Glassmorphism shadow
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    imageContainer: {
        position: 'relative',
        backgroundColor: '#FFF5F8',
    },
    image: {
        width: '100%',
        height: CARD_WIDTH * 1.1,
        backgroundColor: '#FFF9F5',
    },
    saleBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    heartButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    addButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    addButtonGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        padding: 14,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
        height: 38,
        lineHeight: 19,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
    },
    price: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    salePrice: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#10B981',
    },
    oldPrice: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textDecorationLine: 'line-through',
    },
});
