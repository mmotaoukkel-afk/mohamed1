
/**
 * Custom Floating Tab Bar - Kataraa  
 * Pill Design Inspired by User Request
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
    FadeInLeft,
    FadeOutRight,
    Layout,
    LinearTransition
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function CustomTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();
    const { tokens, isDark } = useTheme(); // Use tokens directly
    const { t } = useTranslation();
    const { cartItems } = useCart();

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const tabs = [
        { name: 'index', icon: isDark ? 'home' : 'home-outline', label: t('home') },
        { name: 'products', icon: isDark ? 'grid' : 'grid-outline', label: t('shop') },
        { name: 'cart', icon: isDark ? 'cart' : 'cart-outline', label: t('cart') },
        { name: 'favorites', icon: isDark ? 'heart' : 'heart-outline', label: t('favorites') },
        { name: 'profile', icon: isDark ? 'person' : 'person-outline', label: t('profile') },
    ];

    const styles = getStyles(tokens, isDark);

    const TabIcon = ({ name, label, isFocused, onPress, routeName }) => {

        const animatedContainerStyle = useAnimatedStyle(() => {
            return {
                backgroundColor: isFocused ? tokens.colors.primary : 'transparent',
                paddingHorizontal: isFocused ? tokens.spacing.lg : 0,
                flexGrow: isFocused ? 0 : 1,
                width: isFocused ? 'auto' : 50,
            };
        });

        return (
            <AnimatedTouchable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }}
                style={[styles.tabButton, animatedContainerStyle]}
                layout={LinearTransition.springify().damping(15)}
                activeOpacity={0.8}
            >
                <View>
                    <Ionicons
                        name={name}
                        size={24}
                        color={isFocused ? tokens.colors.textOnPrimary : tokens.colors.textSecondary}
                    />
                    {routeName === 'cart' && cartCount > 0 && (
                        <View style={[styles.badge, { borderColor: isFocused ? tokens.colors.primary : tokens.colors.card }]}>
                            <Text style={styles.badgeText}>
                                {cartCount > 99 ? '99+' : cartCount}
                            </Text>
                        </View>
                    )}
                </View>

                {isFocused && (
                    <Animated.Text
                        entering={FadeInLeft.duration(200).delay(100)}
                        exiting={FadeOutRight.duration(100)}
                        style={styles.label}
                        numberOfLines={1}
                    >
                        {label}
                    </Animated.Text>
                )}
            </AnimatedTouchable>
        );
    };

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
            <BlurView intensity={Platform.OS === 'ios' ? (isDark ? 60 : 80) : 0} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
                <View style={[styles.tabBarInner, { backgroundColor: isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)' }]}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        const tab = tabs.find(t => t.name === route.name) || tabs[0];

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TabIcon
                                key={route.key}
                                name={tab.icon}
                                label={tab.label}
                                isFocused={isFocused}
                                onPress={onPress}
                                routeName={route.name}
                            />
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
}

const getStyles = (tokens, isDark) => StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: tokens.spacing.md,
    },
    blurContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 35, // Slightly larger than xl for pill shape
        overflow: 'hidden',
        // Shadow logic
        shadowColor: tokens.colors.shadow,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
    },
    tabBarInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10, // Slightly reduced
        paddingHorizontal: tokens.spacing.sm,
        height: 68,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 24, // Pill shape
        gap: 8,
    },
    label: {
        color: tokens.colors.textOnPrimary,
        fontSize: tokens.typography.sizes.sm,
        fontWeight: tokens.typography.weights.semibold,
        marginLeft: 4,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -10,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: tokens.colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: tokens.colors.card,
        paddingHorizontal: 4,
        zIndex: 999,
        elevation: 10,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: -1,
    }
});
