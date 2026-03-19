/**
 * AdminPageHeader - Shared Header for all Admin Pages
 * =====================================================
 * Unified header with consistent gradient, glass buttons,
 * decorative circles, and search bar support.
 * 
 * Usage:
 *   <AdminPageHeader
 *     title="إدارة الطلبات"
 *     gradient={['#4F46E5', '#7C3AED']}  // optional, defaults to primary
 *     onBack={() => router.back()}
 *     rightIcon="add"
 *     onRightPress={() => ...}
 *   >
 *     {optional children rendered inside header (e.g. search bar)}
 *   </AdminPageHeader>
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// The ONE shared gradient palette for all admin pages
export const PAGE_GRADIENTS = {
    // Each page uses a specific gradient for identity but all are premium
    overview: ['#4F46E5', '#7C3AED'],
    orders: ['#4F46E5', '#6366F1'],
    products: ['#10B981', '#0D9488'],
    revenue: ['#F59E0B', '#EF4444'],
    customers: ['#3B82F6', '#4F46E5'],
    reviews: ['#8B5CF6', '#EC4899'],
    shipping: ['#06B6D4', '#3B82F6'],
    notifications: ['#EC4899', '#8B5CF6'],
    discounts: ['#F97316', '#F59E0B'],
    settings: ['#64748B', '#475569'],
    analytics: ['#4F46E5', '#06B6D4'],
    default: ['#4F46E5', '#7C3AED'],
};

export default function AdminPageHeader({
    title,
    gradient,
    onBack,
    rightIcon,
    onRightPress,
    rightIcon2,
    onRightPress2,
    children,
}) {
    const colors = gradient || PAGE_GRADIENTS.default;

    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
            {/* Decorative background circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />

            <SafeAreaView edges={['top']}>
                <View style={styles.row}>
                    {/* Left: Back button */}
                    {onBack ? (
                        <TouchableOpacity style={styles.glassBtn} onPress={onBack} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}

                    {/* Center: Title */}
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>

                    {/* Right: Action buttons */}
                    <View style={styles.rightGroup}>
                        {rightIcon2 && onRightPress2 && (
                            <TouchableOpacity style={styles.glassBtn} onPress={onRightPress2} activeOpacity={0.8}>
                                <Ionicons name={rightIcon2} size={22} color="#fff" />
                            </TouchableOpacity>
                        )}
                        {rightIcon && onRightPress ? (
                            <TouchableOpacity style={styles.glassBtn} onPress={onRightPress} activeOpacity={0.8}>
                                <Ionicons name={rightIcon} size={22} color="#fff" />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 40 }} />
                        )}
                    </View>
                </View>

                {/* Optional children (e.g. search bar) */}
                {children && (
                    <View style={styles.childrenWrap}>
                        {children}
                    </View>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingBottom: 20,
        overflow: 'hidden',
    },
    circle1: {
        position: 'absolute',
        width: 180, height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.07)',
        top: -50, right: -40,
    },
    circle2: {
        position: 'absolute',
        width: 100, height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        bottom: -20, left: 50,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    glassBtn: {
        width: 40, height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },
    rightGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    childrenWrap: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
});
