/**
 * Brand Section Component - Kataraa
 * Horizontal scrollable product section with brand header and "View All"
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../theme/colors';
import ProductCardSoko from './ProductCardSoko';
import { useTranslation } from '../hooks/useTranslation';

export default function BrandSection({
    title,
    titleAr,
    products = [],
    onViewAll,
    onProductPress,
    onAddToCart,
    onFavorite,
    isFavorite,
}) {
    const { t } = useTranslation();
    if (!products || products.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={onViewAll}
                >
                    <Text style={styles.viewAllText}>{t('viewAll')}</Text>
                    <Ionicons name="arrow-forward-circle" size={20} color={COLORS.primary} />
                </TouchableOpacity>

                <Text style={styles.title}>{titleAr || title}</Text>
            </View>

            {/* Products Horizontal List */}
            <FlatList
                data={products}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                keyExtractor={(item) => item.id?.toString()}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <ProductCardSoko
                            item={item}
                            onPress={() => onProductPress?.(item)}
                            onAddToCart={onAddToCart}
                            onFavorite={onFavorite}
                            isFavorite={isFavorite?.(item.id)}
                        />
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'right',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '500',
    },
    listContainer: {
        paddingHorizontal: SPACING.sm,
    },
    cardWrapper: {
        width: 160,
        marginRight: SPACING.sm,
    },
});
