/**
 * Cinematic Category Pills - Kataraa 🎬✨
 * Horizontal scrolling category selector with smooth animations
 */

import React from 'react';
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Kataraa Blush Pink Theme
const COLORS = {
    primary: '#F5B5C8',
    secondary: '#FFDAB9',
    accent: '#B76E79',
    background: '#FFF9F5',
    textPrimary: '#3D2314',
    textSecondary: '#A67B7B',
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CategoryPill = ({ item, isActive, onPress, index }) => {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.92, { damping: 15 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 12 });
    };

    const pillStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedTouchable
            style={[
                styles.pill,
                isActive && styles.pillActive,
                pillStyle,
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                {item.iconType === 'material' ? (
                    <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={isActive ? '#fff' : COLORS.accent}
                    />
                ) : (
                    <Text style={styles.emoji}>{item.icon}</Text>
                )}
            </View>
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {item.label}
            </Text>
        </AnimatedTouchable>
    );
};

export default function CategoryPillsSection({ activeCategory, onCategoryChange }) {
    const categories = [
        { id: 'all', label: 'الكل', icon: '✨', iconType: 'emoji' },
        { id: 'lips', label: 'الشفاه', icon: '💄', iconType: 'emoji' },
        { id: 'eyes', label: 'العيون', icon: '👁️', iconType: 'emoji' },
        { id: 'skincare', label: 'العناية', icon: '🧴', iconType: 'emoji' },
        { id: 'fragrance', label: 'العطور', icon: '🌸', iconType: 'emoji' },
        { id: 'hair', label: 'الشعر', icon: 'hair-dryer', iconType: 'material' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={90}
            >
                {categories.map((item, index) => (
                    <CategoryPill
                        key={item.id}
                        item={item}
                        index={index}
                        isActive={activeCategory === item.id}
                        onPress={() => onCategoryChange(item.id)}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 10,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: 'rgba(245, 181, 200, 0.3)',
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    pillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        shadowOpacity: 0.35,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(245, 181, 200, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    emoji: {
        fontSize: 18,
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    pillTextActive: {
        color: '#fff',
    },
});
