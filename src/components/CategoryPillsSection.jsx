/**
 * Cinematic Category Pills - Kataraa 🎬✨
 * Horizontal scrolling category selector with smooth animations
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CategoryPill = ({ item, isActive, onPress, index, tokens }) => {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.92, { damping: 15 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 12 });
    };

    const pillStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: isActive ? tokens.colors.primary : tokens.colors.backgroundCard,
        borderColor: isActive ? tokens.colors.primary : tokens.colors.borderLight,
    }));

    return (
        <AnimatedTouchable
            style={[
                styles.pill,
                pillStyle,
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <View style={[styles.iconContainer, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : tokens.colors.primary + '20' }]}>
                {item.iconType === 'material' ? (
                    <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={isActive ? '#fff' : tokens.colors.primary}
                    />
                ) : (
                    <Text style={styles.emoji}>{item.icon}</Text>
                )}
            </View>
            <Text style={[styles.pillText, { color: isActive ? '#fff' : tokens.colors.text }]}>
                {item.label}
            </Text>
        </AnimatedTouchable>
    );
};

export default function CategoryPillsSection({ activeCategory, onCategoryChange }) {
    const { tokens, isDark } = useTheme();
    const { t } = useTranslation();

    const categories = [
        { id: 'all', label: t('all'), icon: '✨', iconType: 'emoji' },
        { id: 'lips', label: t('lips'), icon: '💄', iconType: 'emoji' },
        { id: 'eyes', label: t('eyes'), icon: '👁️', iconType: 'emoji' },
        { id: 'skincare', label: t('skincare'), icon: '🧴', iconType: 'emoji' },
        { id: 'fragrance', label: t('fragrance'), icon: '🌸', iconType: 'emoji' },
        { id: 'hair', label: t('hair'), icon: 'hair-dryer', iconType: 'material' },
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
                        tokens={tokens}
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
        borderWidth: 1.5,
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },


    emoji: {
        fontSize: 18,
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
