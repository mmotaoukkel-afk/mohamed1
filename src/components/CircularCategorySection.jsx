/**
 * Circular Category Icon Component - Kataraa
 * Circular icons for category navigation like reference design
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme/colors';

// Default category data with icons
const DEFAULT_CATEGORIES = [
    { id: 'masks', name: 'Masks', nameAr: 'أقنعة', icon: 'color-palette', color: '#E1BEE7' },
    { id: 'eyecare', name: 'Eye Care', nameAr: 'العناية بالعين', icon: 'eye', color: '#B3E5FC' },
    { id: 'suncare', name: 'Suncare', nameAr: 'واقي الشمس', icon: 'sunny', color: '#FFF9C4' },
    { id: 'makeup', name: 'Makeup', nameAr: 'مكياج', icon: 'sparkles', color: '#F8BBD9' },
    { id: 'skincare', name: 'Skincare', nameAr: 'العناية بالبشرة', icon: 'flower', color: '#C8E6C9' },
    { id: 'serum', name: 'Serum', nameAr: 'سيروم', icon: 'water', color: '#D1C4E9' },
];

// Single Category Icon
const CategoryIcon = ({ item, onPress, isActive }) => (
    <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => onPress?.(item)}
        activeOpacity={0.7}
    >
        <View style={[
            styles.iconContainer,
            { backgroundColor: item.color || '#E1BEE7' },
            isActive && styles.iconContainerActive,
        ]}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.categoryImage} />
            ) : (
                <Ionicons
                    name={item.icon || 'grid'}
                    size={24}
                    color={COLORS.primary}
                />
            )}
        </View>
        <Text style={[
            styles.categoryName,
            isActive && styles.categoryNameActive,
        ]}>
            {item.nameAr || item.name}
        </Text>
    </TouchableOpacity>
);

// Categories Section Component
export default function CircularCategorySection({
    categories = DEFAULT_CATEGORIES,
    activeCategory = null,
    onCategoryPress,
    title = 'Featured Collections',
    titleAr = 'المجموعات المميزة',
}) {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{titleAr}</Text>

            <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                keyExtractor={(item) => item.id?.toString() || item.name}
                renderItem={({ item }) => (
                    <CategoryIcon
                        item={item}
                        onPress={onCategoryPress}
                        isActive={activeCategory === item.id}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: SPACING.md,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textAlign: 'right',
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
    },
    listContainer: {
        paddingHorizontal: SPACING.md,
        gap: SPACING.lg,
    },
    categoryItem: {
        alignItems: 'center',
        width: 70,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
        ...SHADOWS.sm,
    },
    iconContainerActive: {
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    categoryImage: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    categoryName: {
        fontSize: 11,
        color: COLORS.text,
        textAlign: 'center',
        fontWeight: '500',
    },
    categoryNameActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
});
