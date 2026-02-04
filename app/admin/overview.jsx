/**
 * Admin Overview - Kataraa
 * Professional Dashboard with Charts & Modern Design
 * 🔐 Protected by RequireAdmin
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { getDashboardStats, getRecentOrders, getWeeklyRevenue, getCategorySales, getTopSellingProducts } from '../../src/services/adminAnalytics';
import { getAllCustomers } from '../../src/services/adminCustomerService';
import { getSmartAlerts } from '../../src/services/smartAlertsService';
import currencyService from '../../src/services/currencyService';
import { useNotifications } from '../../src/context/NotificationContext';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import Surface from '../../src/components/ui/Surface';

const { width } = Dimensions.get('window');

// Helper to get formatted date
const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date().toLocaleDateString('ar-MA', options);
};

export default function AdminOverview() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user, role } = useAuth();
    const { expoPushToken, registrationError } = useNotifications();
    const styles = getStyles(theme, isDark);

    const [stats, setStats] = useState({
        revenue: { value: currencyService.formatAdminPrice(0), change: '+0%', isPositive: true },
        orders: { value: '0', change: '+0%', isPositive: true },
        customers: { value: '0', change: '+0%', isPositive: true },
        products: { value: '0', change: '+0%', isPositive: true },
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [weeklyRevenue, setWeeklyRevenue] = useState([]);
    const [categorySales, setCategorySales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [smartAlerts, setSmartAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [kpiData, ordersData, revenueData, catSalesData, alertsData, topProductsData] = await Promise.all([
                getDashboardStats(),
                getRecentOrders(),
                getWeeklyRevenue(),
                getCategorySales(),
                getSmartAlerts(),
                getTopSellingProducts(5)
            ]);

            if (kpiData) setStats(kpiData);
            if (ordersData) setRecentOrders(ordersData);
            if (revenueData) setWeeklyRevenue(revenueData);
            if (catSalesData) setCategorySales(catSalesData);
            if (alertsData) setSmartAlerts(alertsData);
            if (topProductsData) setTopProducts(topProductsData);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };



    // Order status counts
    const orderStats = {
        pending: recentOrders.filter(o => o.status === 'pending').length,
        confirmed: recentOrders.filter(o => o.status === 'confirmed' || o.status === 'processing').length,
        shipped: recentOrders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length,
        delivered: recentOrders.filter(o => o.status === 'delivered').length,
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F8FAFC' }]}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: isDark ? theme.background : '#F8FAFC' }}>
                {/* Clean Header */}
                <View style={styles.header}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                            <Text style={[styles.dateText, { color: theme.textSecondary, letterSpacing: 1 }]}>
                                {getFormattedDate().toUpperCase()} • SYSTEM ACTIVE
                            </Text>
                        </View>
                        <Text style={[styles.greeting, { color: theme.text, letterSpacing: -0.5 }]}>
                            مرحباً، {user?.displayName || 'المشرف'}
                        </Text>
                        <Text style={[styles.subGreeting, { color: theme.textSecondary, opacity: 0.8 }]}>
                            مركز التحكم • حالة المتجر المباشرة
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.headerBtn, { backgroundColor: theme.backgroundCard }]}
                            onPress={() => router.push('/admin/settings')}
                        >
                            <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.headerBtn, { backgroundColor: theme.backgroundCard }]}
                            onPress={() => router.push('/admin/notifications')}
                        >
                            <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                            {user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.avatarText}>
                                        {user?.displayName?.charAt(0) || 'م'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* System Connection Diagnostic */}
                <View style={[styles.statusBanner, { backgroundColor: expoPushToken ? (isDark ? '#065F4630' : '#D1FAE5') : (isDark ? '#991B1B30' : '#FEE2E2'), borderColor: expoPushToken ? '#05966950' : '#DC262650', borderWidth: 1 }]}>
                    <Ionicons
                        name={expoPushToken ? "pulse" : "alert-circle-outline"}
                        size={14}
                        color={expoPushToken ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.statusText, { color: expoPushToken ? (isDark ? '#A7F3D0' : '#059669') : (isDark ? '#FECACA' : '#DC2626') }]}>
                        {expoPushToken
                            ? 'النظام متصل وبانتظار البيانات...'
                            : (registrationError || 'هناك مشكلة في الاتصال بالنظام')}
                    </Text>
                    {expoPushToken && (
                        <View style={[styles.roleBadge, { backgroundColor: '#0EA5E9' }]}>
                            <Text style={styles.roleText}>{role}</Text>
                        </View>
                    )}
                </View>

                {/* Smart Alerts Section */}
                {smartAlerts.length > 0 && (
                    <View style={styles.alertsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                            {smartAlerts.map((alert, idx) => (
                                <TouchableOpacity
                                    key={alert.id || idx}
                                    style={[styles.alertChip, { backgroundColor: isDark ? alert.color + '10' : alert.color + '15', borderColor: alert.color + '40', borderStyle: 'dashed' }]}
                                    onPress={() => alert.action && router.push(alert.action)}
                                >
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: alert.color }} />
                                    <View>
                                        <Text style={[styles.alertChipTitle, { color: alert.color, letterSpacing: 0.5 }]}>{alert.title.toUpperCase()}</Text>
                                        <Text style={[styles.alertChipMsg, { color: theme.textSecondary }]} numberOfLines={1}>{alert.message}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </SafeAreaView >

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {/* KPI Cards Row 1 */}
                <View style={styles.kpiRow}>
                    {/* Total Revenue - Featured */}
                    <Animated.View
                        entering={FadeInDown.delay(100).duration(600)}
                        style={{ flex: 1.5 }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/admin/analytics')}
                            style={{ flex: 1 }}
                        >
                            <Surface variant="glass" padding="none" style={styles.kpiCardLargeGlass}>
                                <LinearGradient
                                    colors={isDark ? ['#1e293b', '#0f172a'] : ['#F0F9FF', '#E0F2FE']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ padding: 16, flex: 1, borderLeftWidth: 4, borderLeftColor: '#0EA5E9' }}
                                >
                                    <View style={styles.kpiHeader}>
                                        <View style={[styles.iconBox, { backgroundColor: '#0EA5E9' }]}>
                                            <Ionicons name="stats-chart" size={16} color="#FFF" />
                                        </View>
                                        <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>إجمالي الإيرادات</Text>
                                        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                                    </View>
                                    <Text style={[styles.kpiValueLarge, { color: theme.text }]}>{stats.revenue.value}</Text>
                                    <View style={styles.kpiFooter}>
                                        <Text style={[styles.kpiSubtext, { color: theme.textSecondary }]}>مقارنة بالشهر الماضي</Text>
                                        <View style={[styles.changeBadge, { backgroundColor: stats.revenue.isPositive ? '#D1FAE530' : '#FEE2E230' }]}>
                                            <Ionicons
                                                name={stats.revenue.isPositive ? "trending-up" : "trending-down"}
                                                size={12}
                                                color={stats.revenue.isPositive ? '#10B981' : '#EF4444'}
                                            />
                                            <Text style={[styles.changeText, { color: stats.revenue.isPositive ? '#10B981' : '#EF4444' }]}>
                                                {stats.revenue.change}
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </Surface>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Total Orders */}
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(600)}
                        style={{ flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/admin/orders')}
                            style={{ flex: 1 }}
                        >
                            <Surface variant="glass" padding="none" style={styles.kpiCardSmallGlass}>
                                <LinearGradient
                                    colors={isDark ? ['#1e293b', '#0f172a'] : ['#F5F3FF', '#EDE9FE']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ padding: 16, flex: 1, borderLeftWidth: 4, borderLeftColor: '#8B5CF6' }}
                                >
                                    <View style={styles.kpiHeader}>
                                        <View style={[styles.iconBox, { backgroundColor: '#8B5CF6' }]}>
                                            <Ionicons name="receipt" size={14} color="#FFF" />
                                        </View>
                                        <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>الطلبات</Text>
                                    </View>
                                    <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.orders.value}</Text>
                                    <View style={[styles.changeBadge, { backgroundColor: stats.orders.isPositive ? '#D1FAE530' : '#FEE2E230', marginTop: 8 }]}>
                                        <Text style={[styles.changeTextSmall, { color: stats.orders.isPositive ? '#10B981' : '#EF4444' }]}>
                                            {stats.orders.change}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </Surface>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* KPI Cards Row 2 */}
                <View style={styles.kpiRow}>
                    {/* Customers */}
                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600)}
                        style={{ flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/admin/customers')}
                            style={{ flex: 1 }}
                        >
                            <Surface variant="glass" padding="md" style={styles.kpiCardHalf}>
                                <View style={styles.kpiHeader}>
                                    <View style={[styles.iconBoxSmall, { backgroundColor: '#F59E0B' }]}>
                                        <Ionicons name="people" size={14} color="#FFF" />
                                    </View>
                                    <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>الزبناء</Text>
                                    <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                                </View>
                                <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.customers.value}</Text>
                            </Surface>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Products */}
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(600)}
                        style={{ flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/admin/products')}
                            style={{ flex: 1 }}
                        >
                            <Surface variant="glass" padding="md" style={styles.kpiCardHalf}>
                                <View style={styles.kpiHeader}>
                                    <View style={[styles.iconBoxSmall, { backgroundColor: '#10B981' }]}>
                                        <Ionicons name="cube" size={14} color="#FFF" />
                                    </View>
                                    <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>المنتجات</Text>
                                    <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                                </View>
                                <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.products.value}</Text>
                            </Surface>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Revenue Chart */}
                <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                    <Surface variant="glass" style={styles.chartCardGlass} padding="none">
                        <View style={{ padding: 20 }}>
                            <View style={styles.chartHeader}>
                                <View>
                                    <Text style={[styles.chartTitle, { color: theme.text }]}>الإيرادات الأسبوعية</Text>
                                    <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
                                        الإجمالي: {currencyService.formatAdminPrice(weeklyRevenue.reduce((acc, curr) => acc + curr.value, 0))}
                                    </Text>
                                </View>
                                <View
                                    style={[styles.iconBoxSmall, { backgroundColor: '#0EA5E9' }]}
                                >
                                    <Ionicons name="flash" size={14} color="#FFF" />
                                </View>
                            </View>

                            {/* Bar Chart */}
                            <View style={styles.barChart}>
                                {weeklyRevenue.length > 0 ? weeklyRevenue.map((item, index) => (
                                    <View key={index} style={styles.barItem}>
                                        <View style={styles.barContainer}>
                                            <LinearGradient
                                                colors={['#0EA5E9', '#22D3EE']}
                                                style={[
                                                    styles.bar,
                                                    { height: `${weeklyRevenue.length > 0 ? (item.value / (Math.max(...weeklyRevenue.map(d => d.value)) || 1)) * 100 : 0}%` }
                                                ]}
                                            />
                                        </View>
                                        <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.day}</Text>
                                    </View>
                                )) : (
                                    loading ? (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 120 }}>
                                            <ActivityIndicator color={theme.primary} />
                                        </View>
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 120 }}>
                                            <Text style={{ color: theme.textMuted, fontSize: 12 }}>لا توجد بيانات لهذا الأسبوع</Text>
                                        </View>
                                    )
                                )}
                            </View>
                        </View>
                    </Surface>
                </Animated.View>

                {/* Orders & Customers Summary */}
                <View style={styles.summaryRow}>
                    {/* Orders Card */}
                    <Animated.View
                        entering={FadeInRight.delay(600).duration(600)}
                        style={{ flex: 1 }}
                    >
                        <Surface variant="glass" padding="md" style={styles.summaryCardGlass}>
                            <View style={[styles.summaryIcon, { backgroundColor: isDark ? '#0EA5E915' : '#E0F2FE' }]}>
                                <Ionicons name="layers" size={24} color="#0EA5E9" />
                            </View>
                            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.orders.value}</Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>طلب</Text>
                            <View style={[styles.pillBadge, { backgroundColor: '#0EA5E920', borderWeight: 1, borderColor: '#0EA5E930' }]}>
                                <Text style={[styles.summarySubtext, { color: '#0EA5E9', fontSize: 10, fontWeight: '700' }]}>
                                    {orderStats.pending} قيد المعالجة
                                </Text>
                            </View>
                        </Surface>
                    </Animated.View>

                    {/* Customers Card */}
                    <Animated.View
                        entering={FadeInRight.delay(700).duration(600)}
                        style={{ flex: 1 }}
                    >
                        <TouchableOpacity
                            onPress={() => router.push('/admin/customers')}
                            style={{ flex: 1 }}
                        >
                            <Surface variant="glass" padding="md" style={styles.summaryCardGlass}>
                                <View style={[styles.summaryIcon, { backgroundColor: isDark ? '#8B5CF615' : '#F5F3FF' }]}>
                                    <Ionicons name="finger-print" size={24} color="#8B5CF6" />
                                </View>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.customers.value}</Text>
                                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>زبون</Text>
                                <View style={[styles.pillBadge, { backgroundColor: '#8B5CF620', borderWeight: 1, borderColor: '#8B5CF630' }]}>
                                    <Text style={[styles.summarySubtext, { color: '#8B5CF6', fontSize: 10, fontWeight: '700' }]}>
                                        قاعدة البيانات نشطة
                                    </Text>
                                </View>
                            </Surface>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Top Selling Products */}
                <Animated.View entering={FadeInDown.delay(850).duration(600)}>
                    <Surface variant="glass" padding="none" style={styles.topProductsSection}>
                        <View style={styles.ordersSectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#0EA5E9' }} />
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>المنتجات الأكثر مبيعاً</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/admin/products')}>
                                <Ionicons name="options-outline" size={16} color="#0EA5E9" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                            {topProducts.length > 0 ? topProducts.map((product, index) => (
                                <TouchableOpacity
                                    key={product.id || index}
                                    style={[
                                        styles.productRow,
                                        index === topProducts.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                    onPress={() => router.push(`/admin/products?search=${product.name}`)}
                                >
                                    <View style={styles.productRevenue}>
                                        <Text style={[styles.revenueText, { color: '#10B981' }]}>
                                            {currencyService.formatAdminPrice(product.revenue)}
                                        </Text>
                                        <Text style={{ fontSize: 9, color: theme.textSecondary, letterSpacing: 1 }}>REVENUE</Text>
                                    </View>

                                    <View style={styles.productInfo}>
                                        <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                                        <Text style={[styles.productSales, { color: theme.textSecondary }]}>
                                            🔥 {product.sales} قطعة مباعة
                                        </Text>
                                    </View>

                                    {product.image ? (
                                        <Image source={{ uri: product.image }} style={styles.productImage} />
                                    ) : (
                                        <View style={styles.productPlaceholder}>
                                            <Ionicons name="image-outline" size={20} color={theme.primary} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )) : (
                                loading ? (
                                    <ActivityIndicator color={theme.primary} style={{ margin: 20 }} />
                                ) : (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Ionicons name="stats-chart-outline" size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>لا توجد بيانات مبيعات حالياً</Text>
                                    </View>
                                )
                            )}
                        </View>
                    </Surface>
                </Animated.View>

                {/* Category Pie Chart */}
                <Animated.View entering={FadeInDown.delay(800).duration(600)}>
                    <Surface variant="glass" padding="md" style={styles.chartCardGlass}>
                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={[styles.chartTitle, { color: theme.text }]}>توزيع الفئات</Text>
                            </View>
                            <View style={[styles.iconBoxSmall, { backgroundColor: '#8B5CF6' }]}>
                                <Ionicons name="analytics" size={14} color="#FFF" />
                            </View>
                        </View>

                        <View style={styles.pieChartContainer}>
                            {/* Simple Pie Representation */}
                            <View style={styles.pieChart}>
                                {categorySales.length > 0 ? categorySales.map((cat, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.pieSlice,
                                            {
                                                backgroundColor: cat.color,
                                                width: 40 + ((cat.value / (Math.max(...categorySales.map(c => c.value)) || 1)) * 40),
                                                height: 40 + ((cat.value / (Math.max(...categorySales.map(c => c.value)) || 1)) * 40),
                                                borderRadius: 50,
                                                position: 'absolute',
                                                top: 60 - ((cat.value / (Math.max(...categorySales.map(c => c.value)) || 1)) * 20),
                                                left: 60 - ((cat.value / (Math.max(...categorySales.map(c => c.value)) || 1)) * 20) + (index * 5),
                                                opacity: 0.8 - (index * 0.1),
                                                zIndex: categorySales.length - index
                                            }
                                        ]}
                                    />
                                )) : (
                                    loading ? (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <ActivityIndicator color={theme.primary} />
                                        </View>
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <Ionicons name="pie-chart-outline" size={24} color={theme.textMuted} />
                                        </View>
                                    )
                                )}
                            </View>

                            {/* Legend */}
                            <View style={styles.pieLegend}>
                                {categorySales.length > 0 ? categorySales.map((cat, index) => (
                                    <View key={index} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                                        <View>
                                            <Text style={[styles.legendText, { color: theme.text }]}>{cat.name}</Text>
                                            <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                                                {currencyService.formatAdminPrice(cat.value)}
                                            </Text>
                                        </View>
                                    </View>
                                )) : (
                                    <Text style={{ color: theme.textSecondary }}>لا توجد بيانات مبيعات</Text>
                                )}
                            </View>
                        </View>
                    </Surface>
                </Animated.View>

                {/* Order Status Cards */}
                <Animated.View entering={FadeInUp.delay(900).duration(600)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12 }}>
                        <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#10B981' }} />
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                            حالة العمليات الميدانية
                        </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusCardsScroll}>
                        {[
                            { label: 'طلبات جديدة', value: orderStats.pending + orderStats.confirmed, icon: 'sparkles', colors: ['#0EA5E9', '#3B82F6'], change: '+3.2%' },
                            { label: 'بانتظار التأكيد', value: orderStats.pending, icon: 'time', colors: ['#8B5CF6', '#6366F1'], change: '+2.4%' },
                            { label: 'في الطريق', value: orderStats.shipped, icon: 'bicycle', colors: ['#EC4899', '#D946EF'], change: '-0.5%' },
                            { label: 'تم التوصيل', value: orderStats.delivered, icon: 'checkmark-done', colors: ['#10B981', '#059669'], change: '+2.8%' },
                        ].map((item, idx) => (
                            <Surface key={idx} variant="glass" padding="none" style={styles.statusCardGlass}>
                                <LinearGradient
                                    colors={item.colors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.statusCardGradient}
                                >
                                    <View style={styles.statusCardUpper}>
                                        <View style={styles.statusIconBox}>
                                            <Ionicons name={item.icon} size={16} color="#fff" />
                                        </View>
                                        <Text style={styles.statusCardValue}>{item.value}</Text>
                                    </View>
                                    <Text style={styles.statusCardLabel}>{item.label}</Text>
                                    <View style={styles.statusCardFooter}>
                                        <Ionicons name={item.change.startsWith('+') ? "trending-up" : "trending-down"} size={10} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.statusCardChangeText}>{item.change}</Text>
                                    </View>
                                </LinearGradient>
                            </Surface>
                        ))}
                    </ScrollView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(1000).duration(600)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
                        <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#0EA5E9' }} />
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                            اختصارات التحكم السريع
                        </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        <TouchableOpacity
                            style={[styles.quickActionCard, { backgroundColor: '#0EA5E915' }]}
                            onPress={() => router.push('/admin/orders')}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#0EA5E9' }]}>
                                <Ionicons name="receipt" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.quickActionCardText, { color: theme.text }]}>الطلبات</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionCard, { backgroundColor: '#8B5CF615' }]}
                            onPress={() => router.push('/admin/products')}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#8B5CF6' }]}>
                                <Ionicons name="cube" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.quickActionCardText, { color: theme.text }]}>المنتجات</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionCard, { backgroundColor: '#10B98115' }]}
                            onPress={() => router.push('/admin/coupons')}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#10B981' }]}>
                                <Ionicons name="gift" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.quickActionCardText, { color: theme.text }]}>الكوبونات</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionCard, { backgroundColor: '#6366F115' }]}
                            onPress={() => router.push('/admin/broadcast')}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#6366F1' }]}>
                                <Ionicons name="megaphone" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.quickActionCardText, { color: theme.text }]}>إعلان عام</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionCard, { backgroundColor: '#EC489915' }]}
                            onPress={() => router.push('/admin/banners')}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#EC4899' }]}>
                                <Ionicons name="images" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.quickActionCardText, { color: theme.text }]}>الواجهة</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>

                {/* Recent Orders List */}
                <Animated.View entering={FadeInUp.delay(1100).duration(600)}>
                    <Surface variant="glass" padding="none" style={styles.ordersSectionGlass}>
                        <View style={styles.ordersSectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#8B5CF6' }} />
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>سجل العمليات الأخير</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/admin/orders')}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={[styles.seeAllText, { color: '#8B5CF6' }]}>فحص الكل</Text>
                                    <Ionicons name="scan-outline" size={14} color="#8B5CF6" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={{ paddingHorizontal: 16 }}>
                            {recentOrders?.slice(0, 5).map((order, index) => (
                                <View
                                    key={order.id}
                                    style={[
                                        styles.orderRow,
                                        index < Math.min(recentOrders.length, 5) - 1 && {
                                            borderBottomWidth: 1,
                                            borderBottomColor: theme.border,
                                        }
                                    ]}
                                >
                                    <View style={styles.orderInfo}>
                                        <Text style={[styles.orderId, { color: '#0EA5E9', fontFamily: 'monospace', fontSize: 11 }]}>
                                            ID: {order.id?.slice(-8).toUpperCase() || 'REF-0000'}
                                        </Text>
                                        <Text style={[styles.orderCustomer, { color: theme.text, fontWeight: '700' }]}>{order.customer}</Text>
                                    </View>
                                    <View style={styles.orderMeta}>
                                        <Text style={[styles.orderAmount, { color: theme.text }]}>
                                            {currencyService.formatAdminPrice(order.total || parseFloat(order.amount))}
                                        </Text>
                                        <View style={[
                                            styles.orderStatusBadge,
                                            { backgroundColor: getStatusColor(order.status) + '20' }
                                        ]}>
                                            <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                                                {getStatusLabel(order.status)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {recentOrders.length === 0 && (
                            <View style={styles.emptyOrders}>
                                <Ionicons name="receipt-outline" size={40} color={theme.textMuted} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>لا توجد طلبات حديثة</Text>
                            </View>
                        )}
                    </Surface>
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

// Helper functions content continues here...
const getStatusColor = (status) => {
    switch (status) {
        case 'delivered': return '#10B981'; // Emerald
        case 'shipped':
        case 'out_for_delivery': return '#0EA5E9'; // Cyan Tech
        case 'processing':
        case 'confirmed': return '#8B5CF6'; // Violet Neural
        case 'pending': return '#F59E0B'; // Amber Alert
        case 'cancelled': return '#F43F5E'; // Rose
        default: return '#94A3B8'; // Slate
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'delivered': return 'تم التوصيل';
        case 'shipped': return 'تم الشحن';
        case 'out_for_delivery': return 'جارٍ التوصيل';
        case 'processing': return 'قيد التجهيز';
        case 'confirmed': return 'مؤكد';
        case 'pending': return 'في الانتظار';
        case 'cancelled': return 'ملغي';
        default: return status;
    }
};

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    subGreeting: {
        fontSize: 13,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    alertsContainer: {
        marginTop: 12,
        marginBottom: 4,
    },
    alertChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        marginRight: 10,
        borderWidth: 1,
        gap: 10,
        minWidth: 180,
    },
    alertChipTitle: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    alertChipMsg: {
        fontSize: 11,
        marginTop: 1,
    },

    // KPI Cards
    kpiRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 12,
    },
    kpiCardLargeGlass: {
        flex: 1.5,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
    },
    kpiCardSmallGlass: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBoxSmall: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    kpiCardHalf: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    kpiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    kpiValueLarge: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    kpiValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    kpiFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    kpiSubtext: {
        fontSize: 10,
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    changeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    changeTextSmall: {
        fontSize: 10,
        fontWeight: '600',
    },

    // Charts
    chartCardGlass: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    chartSubtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
    },
    barItem: {
        flex: 1,
        alignItems: 'center',
    },
    barContainer: {
        width: 24,
        height: 100,
        backgroundColor: '#E5E7EB',
        borderRadius: 6,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 6,
    },
    barLabel: {
        fontSize: 10,
        marginTop: 8,
    },

    // Summary Cards
    summaryRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    summaryCardGlass: {
        flex: 1,
        borderRadius: 24,
        alignItems: 'center',
        overflow: 'hidden',
    },
    pillBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 8,
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    summaryLabel: {
        fontSize: 14,
        marginTop: 4,
    },
    summarySubtext: {
        fontSize: 11,
        marginTop: 8,
    },

    // Pie Chart
    pieChartContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pieChart: {
        width: 140,
        height: 140,
        position: 'relative',
    },
    pieLegend: {
        flex: 1,
        marginLeft: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
    },

    // Status Cards
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statusCardsScroll: {
        paddingVertical: 8,
        paddingLeft: 16,
    },
    statusCardGlass: {
        width: 140,
        height: 140,
        marginRight: 12,
        borderRadius: 24,
        overflow: 'hidden',
    },
    statusCardGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    statusCardUpper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statusIconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusCardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    statusCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    statusCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 4,
    },
    statusCardChangeText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
    },

    // Quick Actions
    quickActionsScroll: {
        marginVertical: 12,
    },
    quickActionCard: {
        width: 100,
        height: 110,
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    actionIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    quickActionCardText: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    // Orders Section
    ordersSectionGlass: {
        marginHorizontal: 16,
        marginBottom: 32,
        borderRadius: 24,
        overflow: 'hidden',
    },
    ordersSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: '600',
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderCustomer: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    orderMeta: {
        alignItems: 'flex-end',
    },
    orderAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    orderStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 4,
    },
    orderStatusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    emptyOrders: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        borderRadius: 10,
        marginTop: 8,
        marginBottom: 16,
        gap: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    // Top Products
    topProductsSection: {
        marginHorizontal: 16,
        marginBottom: 32,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    productImage: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    productPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        flex: 1,
        marginHorizontal: 14,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'right',
    },
    productSales: {
        fontSize: 12,
        marginTop: 3,
        textAlign: 'right',
    },
    productRevenue: {
        alignItems: 'flex-start',
    },
    revenueText: {
        fontSize: 15,
        fontWeight: '800',
    },
});
