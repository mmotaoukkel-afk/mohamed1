/**
 * Product Card SOKO Style - Kataraa
 * Cosmic Luxury Minimal Style
 * Dark Mode Supported 🌙
 */

import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import currencyService from '../services/currencyService';
import { Surface, Text } from './ui'; // Import from UI Kit

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const ProductCardSoko = React.memo(({
    item,
    onPress,
    onAddToCart,
    onFavorite,
    isFavorite = false,
    showBrand = false,
}) => {
    const { tokens, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(tokens, isDark, t);

    const getImageSource = () => {
        const firstImage = item?.images?.[0];
        const placeholder = { uri: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400' };
        if (!firstImage) return placeholder;
        if (typeof firstImage === 'string') return { uri: firstImage };
        if (firstImage.src) return { uri: firstImage.src };
        return placeholder;
    };
    const imageSource = getImageSource();

    const isOnSale = item?.on_sale && item?.regular_price && item?.sale_price;
    const isOutOfStock = item?.stock_status === 'outofstock';

    const formatPrice = (price) => {
        return currencyService.formatPrice(price);
    };

    const getDiscountPercent = () => {
        if (!isOnSale) return 0;
        return Math.round((1 - parseFloat(item.sale_price) / parseFloat(item.regular_price)) * 100);
    };

    const containerRef = React.useRef(null);

    return (
        <TouchableOpacity
            ref={containerRef}
            onPress={() => onPress?.(item)}
            activeOpacity={0.9}
        >
            <Surface
                style={styles.card}
                padding="none"
                radius="lg"
                variant={isDark ? 'elevated' : 'default'}
            >
                {/* Image Container */}
                <View style={styles.imageContainer}>
                    <Image
                        source={imageSource}
                        style={styles.image}
                        contentFit="cover"
                        transition={200}
                    />

                    {/* Favorite Button */}
                    <TouchableOpacity
                        style={styles.favoriteBtn}
                        onPress={() => onFavorite?.(item)}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={18}
                            color={isFavorite ? tokens.colors.error : tokens.colors.textMuted}
                        />
                    </TouchableOpacity>

                    {/* Sale Badge */}
                    {isOnSale && (
                        <View style={styles.saleBadge}>
                            <Text variant="caption" weight="bold" style={{ color: '#fff', fontSize: 10 }}>
                                -{getDiscountPercent()}%
                            </Text>
                        </View>
                    )}

                    {/* Sold Out Overlay */}
                    {isOutOfStock && (
                        <View style={styles.soldOutOverlay}>
                            <View style={styles.soldOutBadge}>
                                <Text variant="caption" weight="semibold" style={{ color: '#fff' }}>
                                    {t('outOfStock')}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Add to Cart Button - kept custom for specific sizing */}
                    {!isOutOfStock && (
                        <TouchableOpacity
                            style={styles.addToCartBtn}
                            onPress={() => onAddToCart?.(item, containerRef)}
                        >
                            <LinearGradient
                                colors={[tokens.colors.primary, tokens.colors.primaryDark]}
                                style={styles.addToCartGradient}
                            >
                                <Ionicons name="add" size={16} color="#fff" />
                                <Text variant="caption" weight="semibold" style={styles.addToCartText}>
                                    {t('addToCart')}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Product Info */}
                <View style={styles.infoContainer}>
                    {/* Product Name */}
                    <Text variant="bodySmall" numberOfLines={2} style={styles.productName}>
                        {item?.name}
                    </Text>

                    {/* Price Row */}
                    <View style={styles.priceRow}>
                        {isOnSale ? (
                            <>
                                <Text variant="body" weight="bold" color="accent">
                                    {formatPrice(item.sale_price)}
                                </Text>
                                <Text variant="caption" style={styles.originalPrice}>
                                    {formatPrice(item.regular_price)}
                                </Text>
                            </>
                        ) : (
                            <Text variant="body" weight="bold" color="primary">
                                {formatPrice(item.price)}
                            </Text>
                        )}
                    </View>
                </View>
            </Surface>
        </TouchableOpacity>
    );
});

export default ProductCardSoko;

const getStyles = (tokens, isDark, t) => StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginHorizontal: 4,
        marginBottom: tokens.spacing.md,
        overflow: 'hidden',
        borderWidth: 0, // Surface handles border, but we want clean look
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1,
        backgroundColor: tokens.colors.backgroundSecondary,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    favoriteBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: tokens.colors.surfaceGlass,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: tokens.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saleBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: tokens.colors.error,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    soldOutOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soldOutBadge: {
        backgroundColor: tokens.colors.textMuted,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addToCartBtn: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    addToCartGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 4,
    },
    addToCartText: {
        color: '#fff',
    },
    infoContainer: {
        padding: tokens.spacing.sm,
    },
    productName: {
        height: 36, // Fixed height for 2 lines
        textAlign: t('locale') === 'ar' ? 'right' : 'left',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    originalPrice: {
        color: tokens.colors.textMuted,
        textDecorationLine: 'line-through',
    },
});
