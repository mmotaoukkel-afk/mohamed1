/**
 * Admin Overview - Kataraa
 * Professional High-Tech Dashboard
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, I18nManager, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminNotificationCenter } from '../../src/components/admin/AdminNotificationCenter';
import { ADMIN_COLORS, ADMIN_GRADIENTS } from '../../src/constants/adminDesignTokens';
import { useAuth } from '../../src/context/AuthContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
    getCategorySales,
    getDashboardStats,
    getNewCustomersToday,
    getOrderStatusTrends,
    getRecentOrders,
    getWeeklyRevenue
} from '../../src/services/adminAnalyticsService';
import { notifyAdmins } from '../../src/services/adminNotificationService';
import currencyService from '../../src/services/currencyService';


// width declaration removed to avoid top-level ReferenceError

// Helper to get formatted date
const getFormattedDate = (locale = 'ar-MA') => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    try {
        return new Date().toLocaleDateString(locale, options);
    } catch (e) {
        return new Date().toLocaleDateString('en-US', options);
    }
};

export default function AdminOverview() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user, isAdmin, logout } = useAuth();
    const { adminUnreadCount, addNotification } = useNotifications();
    const styles = getStyles(theme, isDark, I18nManager.isRTL);

    const [stats, setStats] = useState({
        revenue: { value: currencyService.formatAdminPrice(0), change: '+0%', isPositive: true },
        orders: { value: '0', change: '+0%', isPositive: true },
        customers: { value: '0', change: '+0%', isPositive: true },
        products: { value: '0', change: '+0%', isPositive: true },
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [weeklyRevenue, setWeeklyRevenue] = useState([]);
    const [categorySales, setCategorySales] = useState([]);
    const [newCustomersToday, setNewCustomersToday] = useState(0);
    const [orderTrends, setOrderTrends] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadAlerts, setUnreadAlerts] = useState(0); // This state is still used for local alerts, not global adminUnreadCount

    const loadData = useCallback(async () => {
        try {
            const [kpiData, ordersData, revenueData, catSalesData, newCustomers, trends] = await Promise.all([
                getDashboardStats(),
                getRecentOrders(),
                getWeeklyRevenue(),
                getCategorySales(),
                getNewCustomersToday(),
                getOrderStatusTrends()
            ]);

            if (kpiData) setStats(kpiData);
            if (ordersData) setRecentOrders(ordersData);
            if (revenueData) setWeeklyRevenue(revenueData);
            if (catSalesData) setCategorySales(catSalesData);
            setNewCustomersToday(newCustomers || 0);
            setOrderTrends(trends);
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

    const processedAlerts = useRef(new Set());

    // 🔄 Reactive Refresh: Reload dashboard data when new admin notifications arrive
    useEffect(() => {
        if (adminUnreadCount > 0) {
            console.log('🔄 [AdminOverview] Refreshing data due to new admin notification');
            loadData();
        }
    }, [adminUnreadCount, loadData]);



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
                    <View style={{ alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }}>
                        <Text style={[styles.dateText, { color: theme.primary }]}>{getFormattedDate(locale === 'ar' ? 'ar-MA' : 'en-US')}</Text>
                        <Text style={[styles.greeting, { color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                            {t('hello')}, {user?.displayName || t('admin')}! 👋
                        </Text>
                        <Text style={[styles.subGreeting, { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                            {t('storeActivityMonth')}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.headerBtn, { backgroundColor: theme.primary + '15' }]}
                            onPress={() => {
                                if (typeof addNotification === 'function') {
                                    addNotification(t('localNotif'), t('localNotifDesc'), 'success', { scope: 'admin', isLocal: true });
                                }
                            }}
                            onLongPress={async () => {
                                try {
                                    if (typeof addNotification === 'function') {
                                        addNotification(t('remoteNotif'), t('remoteNotifDesc'), 'info', { scope: 'admin', isLocal: true });
                                    }
                                    const result = await notifyAdmins(
                                        t('pushTestTitle'),
                                        t('pushTestMsg', { name: user?.displayName || t('admin') }),
                                        { type: 'test', time: new Date().toISOString() }
                                    );
                                    if (result.success) {
                                        addNotification(t('sentSuccessfully'), t('sentSuccessfullyDesc'), 'success', { scope: 'admin', isLocal: true });
                                    } else {
                                        addNotification(t('sendFailed'), result.error || t('unexpectedError'), 'error', { scope: 'admin', isLocal: true });
                                    }
                                } catch (error) {
                                    console.log('Error testing push:', error);
                                }
                            }}
                        >
                            <Ionicons name="flask-outline" size={20} color={theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerBtn}
                            onPress={() => setShowNotifications(true)}
                        >
                            <Ionicons name="notifications-outline" size={24} color={theme.text} />
                            {adminUnreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{adminUnreadCount > 9 ? '9+' : adminUnreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.headerBtn, { backgroundColor: theme.backgroundCard }]}
                            onPress={() => router.push('/admin/settings')}
                        >
                            <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarText}>
                                    {user?.displayName?.charAt(0) || t('avatarFallback')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>

            <AdminNotificationCenter
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {loading ? (
                    <View style={{ padding: 16 }}>
                        {/* Loading Skeleton */}
                        <View style={styles.kpiRow}>
                            <View style={[styles.skeletonCard, { flex: 1.5, height: 120 }]} />
                            <View style={[styles.skeletonCard, { flex: 1, height: 120 }]} />
                        </View>
                        <View style={styles.kpiRow}>
                            <View style={[styles.skeletonCard, { flex: 1, height: 100 }]} />
                            <View style={[styles.skeletonCard, { flex: 1, height: 100 }]} />
                        </View>
                        <View style={[styles.skeletonCard, { marginHorizontal: 16, height: 200, marginBottom: 16 }]} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary, textAlign: 'center' }]}>
                            {t('loadingData')}...
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* KPI Cards - Premium Gradient Design */}
                        <View style={styles.kpiRow}>
                            {/* Total Revenue - Featured with Gradient */}
                            <TouchableOpacity
                                style={styles.kpiCardLarge}
                                onPress={() => router.push('/admin/revenue')}
                                activeOpacity={0.95}
                            >
                                <LinearGradient
                                    colors={ADMIN_GRADIENTS.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.gradientCard}
                                >
                                    <View style={styles.kpiHeader}>
                                        <View style={styles.iconBadge}>
                                            <Ionicons name="trending-up" size={20} color="#FFF" />
                                        </View>
                                        <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.7)" />
                                    </View>
                                    <Text style={[styles.kpiLabelWhite, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('totalRevenue')}</Text>
                                    <Text style={[styles.kpiValueLarge, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{stats.revenue.value}</Text>
                                    <View style={styles.kpiFooter}>
                                        <Text style={styles.kpiSubtextWhite}>{t('thisMonth')}</Text>
                                        <View style={[styles.changeBadgeWhite, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                            <Ionicons
                                                name={stats.revenue.isPositive ? "arrow-up" : "arrow-down"}
                                                size={12}
                                                color="#FFF"
                                            />
                                            <Text style={styles.changeTextWhite}>
                                                {stats.revenue.change}
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Total Orders - Cyan Gradient */}
                            <TouchableOpacity
                                style={styles.kpiCardSmall}
                                onPress={() => router.push('/admin/orders')}
                                activeOpacity={0.95}
                            >
                                <LinearGradient
                                    colors={ADMIN_GRADIENTS.data}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.gradientCardSmall}
                                >
                                    <View style={styles.kpiHeader}>
                                        <View style={styles.iconBadgeSmall}>
                                            <Ionicons name="receipt-outline" size={16} color="#FFF" />
                                        </View>
                                    </View>
                                    <Text style={[styles.kpiLabelWhite, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('orders')}</Text>
                                    <Text style={[styles.kpiValue, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{stats.orders.value}</Text>
                                    <View style={[styles.changeBadgeWhite, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8 }]}>
                                        <Ionicons
                                            name={stats.orders.isPositive ? "arrow-up" : "arrow-down"}
                                            size={10}
                                            color="#FFF"
                                        />
                                        <Text style={styles.changeTextSmallWhite}>
                                            {stats.orders.change}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* KPI Cards Row 2 - Light Cards with Color Accents */}
                        <View style={styles.kpiRow}>
                            {/* Customers */}
                            <TouchableOpacity
                                style={[styles.kpiCardHalf, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}
                                onPress={() => router.push('/admin/customers')}
                                activeOpacity={0.9}
                            >
                                <View style={styles.kpiHeader}>
                                    <View style={[styles.iconBadgeAccent, { backgroundColor: ADMIN_COLORS.success.bg }]}>
                                        <Ionicons name="people" size={18} color={ADMIN_COLORS.success.main} />
                                    </View>
                                </View>
                                <Text style={[styles.kpiLabel, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('customers')}</Text>
                                <Text style={[styles.kpiValue, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{stats.customers.value}</Text>
                                <View style={[styles.changeBadge, { backgroundColor: stats.customers.isPositive ? ADMIN_COLORS.success.bg : ADMIN_COLORS.error.bg, marginTop: 8 }]}>
                                    <Ionicons name={stats.customers.isPositive ? "trending-up" : "trending-down"} size={10} color={stats.customers.isPositive ? ADMIN_COLORS.success.main : ADMIN_COLORS.error.main} />
                                    <Text style={[styles.changeTextSmall, { color: stats.customers.isPositive ? ADMIN_COLORS.success.main : ADMIN_COLORS.error.main }]}>{stats.customers.change}</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Products */}
                            <TouchableOpacity
                                style={[styles.kpiCardHalf, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}
                                onPress={() => router.push('/admin/products')}
                                activeOpacity={0.9}
                            >
                                <View style={styles.kpiHeader}>
                                    <View style={[styles.iconBadgeAccent, { backgroundColor: ADMIN_COLORS.warning.bg }]}>
                                        <Ionicons name="cube" size={18} color={ADMIN_COLORS.warning.main} />
                                    </View>
                                </View>
                                <Text style={[styles.kpiLabel, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('products')}</Text>
                                <Text style={[styles.kpiValue, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{stats.products.value}</Text>
                                <View style={[styles.changeBadge, { backgroundColor: stats.products.isPositive ? ADMIN_COLORS.success.bg : ADMIN_COLORS.error.bg, marginTop: 8 }]}>
                                    <Ionicons name={stats.products.isPositive ? "trending-up" : "trending-down"} size={10} color={stats.products.isPositive ? ADMIN_COLORS.success.main : ADMIN_COLORS.error.main} />
                                    <Text style={[styles.changeTextSmall, { color: stats.products.isPositive ? ADMIN_COLORS.success.main : ADMIN_COLORS.error.main }]}>{stats.products.change}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Revenue Chart - Enhanced Design */}
                        <View style={[styles.chartCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                            <View style={styles.chartHeader}>
                                <View>
                                    <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <View style={[styles.iconBadgeAccent, { backgroundColor: ADMIN_COLORS.primary.light + '20', [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 10, width: 32, height: 32 }]}>
                                            <Ionicons name="trending-up" size={16} color={ADMIN_COLORS.primary.main} />
                                        </View>
                                        <Text style={[styles.chartTitle, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('weeklyRevenue')}</Text>
                                    </View>
                                    <Text style={[styles.chartSubtitle, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('last7Days')}</Text>
                                </View>
                                <TouchableOpacity
                                    style={{ padding: 8, borderRadius: 8, backgroundColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[100] }}
                                    onPress={() => router.push('/admin/revenue')}>
                                    <Ionicons name="open-outline" size={18} color={ADMIN_COLORS.primary.main} />
                                </TouchableOpacity>
                            </View>

                            {/* Bar Chart with Gradient */}
                            <View style={[styles.barChart, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                                {weeklyRevenue.length > 0 ? (I18nManager.isRTL ? [...weeklyRevenue].reverse() : weeklyRevenue).map((item, index) => (
                                    <View key={index} style={styles.barItem}>
                                        <View style={styles.barContainer}>
                                            <LinearGradient
                                                colors={ADMIN_GRADIENTS.primary}
                                                style={[
                                                    styles.bar,
                                                    { height: `${weeklyRevenue.length > 0 ? (item.value / (Math.max(...weeklyRevenue.map(d => d.value)) || 1)) * 100 : 0}%` }
                                                ]}
                                            />
                                        </View>
                                        <Text style={[styles.barLabel, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600] }]}>{item.day}</Text>
                                    </View>
                                )) : (
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 150 }}>
                                        <Text style={{ color: isDark ? ADMIN_COLORS.neutral[500] : ADMIN_COLORS.neutral[400] }}>{t('loadingData')}...</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Orders & Customers Summary */}
                        <View style={styles.summaryRow}>
                            {/* Orders Card */}
                            <TouchableOpacity
                                style={[styles.summaryCard, { backgroundColor: theme.backgroundCard }]}
                                onPress={() => router.push('/admin/orders')}
                            >
                                <View style={[styles.summaryIcon, { backgroundColor: '#EEF2FF' }]}>
                                    <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                                </View>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.orders.value}</Text>
                                <Text style={[styles.summaryLabel, { color: theme.text }]}>{t('order')}</Text>
                                <View style={[styles.statusCardChange, { backgroundColor: stats.orders.isPositive ? ADMIN_COLORS.success.main + '20' : ADMIN_COLORS.error.main + '20', alignSelf: 'center', marginTop: 8 }]}>
                                    <Ionicons name={stats.orders.isPositive ? "trending-up" : "trending-down"} size={10} color={stats.orders.isPositive ? ADMIN_COLORS.success.main : ADMIN_COLORS.error.main} />
                                    <Text style={[styles.statusCardChangeText, { color: stats.orders.isPositive ? ADMIN_COLORS.success.main : ADMIN_COLORS.error.main }]}>{stats.orders.change}</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Customers Card */}
                            <TouchableOpacity
                                style={[styles.summaryCard, { backgroundColor: theme.backgroundCard }]}
                                onPress={() => router.push('/admin/customers')}
                            >
                                <View style={[styles.summaryIcon, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="people" size={24} color="#F59E0B" />
                                </View>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.customers.value}</Text>
                                <Text style={[styles.summaryLabel, { color: theme.text }]}>{t('customer')}</Text>
                                <Text style={[styles.summarySubtext, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[500], textAlign: 'center' }]}>
                                    {newCustomersToday} {newCustomersToday === 1 ? t('newCustomer') : t('newCustomers')} {t('today')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Order Status Donut Chart */}
                        <View style={[styles.chartCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                            <View style={styles.chartHeader}>
                                <View>
                                    <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <View style={[styles.iconBadgeAccent, { backgroundColor: ADMIN_COLORS.info.bg, [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 10, width: 32, height: 32 }]}>
                                            <Ionicons name="stats-chart" size={16} color={ADMIN_COLORS.info.main} />
                                        </View>
                                        <Text style={[styles.chartTitle, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('orderStatus')}</Text>
                                    </View>
                                    <Text style={[styles.chartSubtitle, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('orderTrends')}</Text>
                                </View>
                            </View>

                            <View style={styles.donutChartContainer}>
                                {/* Donut Chart Segments */}
                                <View style={styles.donutChart}>
                                    {/* Center Circle */}
                                    <View style={[styles.donutCenter, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                                        <Text style={[styles.donutCenterValue, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900] }]}>
                                            {orderStats.pending + orderStats.confirmed + orderStats.shipped + orderStats.delivered}
                                        </Text>
                                        <Text style={[styles.donutCenterLabel, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600] }]}>{t('order')}</Text>
                                    </View>
                                    {/* Visual representation - simple colored segments */}
                                    <View style={[styles.donutSegment, { backgroundColor: ADMIN_COLORS.warning.main, width: 80, height: 80, top: 0, left: 0, borderRadius: 80 }]} />
                                    <View style={[styles.donutSegment, { backgroundColor: ADMIN_COLORS.info.main, width: 70, height: 70, top: 5, right: 0, borderRadius: 70 }]} />
                                    <View style={[styles.donutSegment, { backgroundColor: ADMIN_COLORS.accent.main, width: 60, height: 60, bottom: 0, left: 10, borderRadius: 60 }]} />
                                    <View style={[styles.donutSegment, { backgroundColor: ADMIN_COLORS.success.main, width: 65, height: 65, bottom: 5, right: 5, borderRadius: 65 }]} />
                                </View>

                                {/* Legend with percentages */}
                                <View style={styles.donutLegend}>
                                    {[
                                        { label: t('pending'), value: orderStats.pending, color: ADMIN_COLORS.warning.main, icon: 'time' },
                                        { label: t('confirmed'), value: orderStats.confirmed, color: ADMIN_COLORS.info.main, icon: 'checkmark-circle' },
                                        { label: t('shipped'), value: orderStats.shipped, color: ADMIN_COLORS.accent.main, icon: 'airplane' },
                                        { label: t('delivered'), value: orderStats.delivered, color: ADMIN_COLORS.success.main, icon: 'checkmark-done-circle' },
                                    ].map((item, index) => {
                                        const total = orderStats.pending + orderStats.confirmed + orderStats.shipped + orderStats.delivered || 1;
                                        const percentage = ((item.value / total) * 100).toFixed(0);
                                        return (
                                            <View key={index} style={[styles.donutLegendItem, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                                                <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', flex: 1 }}>
                                                    <View style={[styles.legendDot, { backgroundColor: item.color, width: 12, height: 12 }]} />
                                                    <Ionicons name={item.icon} size={14} color={item.color} style={{ [I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 6 }} />
                                                    <Text style={[styles.legendText, { color: isDark ? ADMIN_COLORS.neutral[300] : ADMIN_COLORS.neutral[700], [I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 6, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{item.label}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Text style={[styles.legendValue, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900] }]}>{item.value}</Text>
                                                    <Text style={[styles.legendPercentage, { color: item.color }]}>{percentage}%</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        {/* Category Sales - Horizontal Bars */}
                        <View style={[styles.chartCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                            <View style={styles.chartHeader}>
                                <View>
                                    <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <View style={[styles.iconBadgeAccent, { backgroundColor: ADMIN_COLORS.accent.light + '20', [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 10, width: 32, height: 32 }]}>
                                            <Ionicons name="grid" size={16} color={ADMIN_COLORS.accent.main} />
                                        </View>
                                        <Text style={[styles.chartTitle, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('salesByCategory')}</Text>
                                    </View>
                                    <Text style={[styles.chartSubtitle, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('topCategories')}</Text>
                                </View>
                            </View>

                            <View style={{ marginTop: 12 }}>
                                {categorySales.length > 0 ? categorySales.map((cat, index) => {
                                    const maxValue = Math.max(...categorySales.map(c => c.value)) || 1;
                                    const percentage = ((cat.value / maxValue) * 100).toFixed(0);
                                    const barColors = [ADMIN_COLORS.primary.main, ADMIN_COLORS.secondary.main, ADMIN_COLORS.accent.main, ADMIN_COLORS.success.main, ADMIN_COLORS.warning.main];
                                    const barColor = barColors[index % barColors.length];

                                    return (
                                        <View key={index} style={styles.horizontalBarItem}>
                                            <View style={[styles.horizontalBarHeader, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
                                                <Text style={[styles.horizontalBarLabel, { color: isDark ? ADMIN_COLORS.neutral[300] : ADMIN_COLORS.neutral[700], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{cat.name}</Text>
                                                <Text style={[styles.horizontalBarValue, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900] }]}>{currencyService.formatAdminPrice(cat.value)}</Text>
                                            </View>
                                            <View style={[styles.horizontalBarContainer, { backgroundColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[200] }]}>
                                                <LinearGradient
                                                    colors={[barColor, barColor + 'CC']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={[styles.horizontalBar, { width: `${percentage}%` }]}
                                                />
                                            </View>
                                        </View>
                                    );
                                }) : (
                                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                        <Text style={{ color: isDark ? ADMIN_COLORS.neutral[500] : ADMIN_COLORS.neutral[400] }}>{t('noSalesData')}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Order Status Cards */}
                        <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 16, marginTop: 8, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                            {t('orderStatus')}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusCardsScroll}>
                            <LinearGradient colors={ADMIN_GRADIENTS.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusCard}>
                                <View style={styles.statusCardIconWrap}>
                                    <Ionicons name="bag-add" size={18} color="#fff" />
                                </View>
                                <Text style={styles.statusCardValue}>{orderTrends?.newOrders?.count || orderStats.pending + orderStats.confirmed}</Text>
                                <Text style={styles.statusCardLabel}>{t('newOrders')}</Text>
                                <View style={styles.statusCardChange}>
                                    <Ionicons name={orderTrends?.newOrders?.change >= 0 ? "trending-up" : "trending-down"} size={10} color="#fff" />
                                    <Text style={styles.statusCardChangeText}>{orderTrends?.newOrders?.change >= 0 ? '+' : ''}{orderTrends?.newOrders?.change || 0}%</Text>
                                </View>
                            </LinearGradient>
                            <LinearGradient colors={ADMIN_GRADIENTS.warning} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusCard}>
                                <View style={styles.statusCardIconWrap}>
                                    <Ionicons name="time" size={18} color="#fff" />
                                </View>
                                <Text style={styles.statusCardValue}>{orderTrends?.pending?.count || orderStats.pending}</Text>
                                <Text style={styles.statusCardLabel}>{t('awaitingConfirmation')}</Text>
                                <View style={styles.statusCardChange}>
                                    <Ionicons name={orderTrends?.pending?.change >= 0 ? "trending-up" : "trending-down"} size={10} color="#fff" />
                                    <Text style={styles.statusCardChangeText}>{orderTrends?.pending?.change >= 0 ? '+' : ''}{orderTrends?.pending?.change || 0}%</Text>
                                </View>
                            </LinearGradient>
                            <LinearGradient colors={ADMIN_GRADIENTS.data} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusCard}>
                                <View style={styles.statusCardIconWrap}>
                                    <Ionicons name="airplane" size={18} color="#fff" />
                                </View>
                                <Text style={styles.statusCardValue}>{orderTrends?.shipped?.count || orderStats.shipped}</Text>
                                <Text style={styles.statusCardLabel}>{t('onTheWay')}</Text>
                                <View style={styles.statusCardChange}>
                                    <Ionicons name={orderTrends?.shipped?.change >= 0 ? "trending-up" : "trending-down"} size={10} color="#fff" />
                                    <Text style={styles.statusCardChangeText}>{orderTrends?.shipped?.change >= 0 ? '+' : ''}{orderTrends?.shipped?.change || 0}%</Text>
                                </View>
                            </LinearGradient>
                            <LinearGradient colors={ADMIN_GRADIENTS.revenue} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusCard}>
                                <View style={styles.statusCardIconWrap}>
                                    <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
                                </View>
                                <Text style={styles.statusCardValue}>{orderTrends?.delivered?.count || orderStats.delivered}</Text>
                                <Text style={styles.statusCardLabel}>{t('delivered')}</Text>
                                <View style={styles.statusCardChange}>
                                    <Ionicons name={orderTrends?.delivered?.change >= 0 ? "trending-up" : "trending-down"} size={10} color="#fff" />
                                    <Text style={styles.statusCardChangeText}>{orderTrends?.delivered?.change >= 0 ? '+' : ''}{orderTrends?.delivered?.change || 0}%</Text>
                                </View>
                            </LinearGradient>
                        </ScrollView>

                        {/* Quick Actions Grid */}
                        <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 16, marginTop: 8, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                            {t('storeManagement')}
                        </Text>
                        <View style={styles.quickGrid}>
                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#EEF2FF' }]}
                                onPress={() => router.push('/admin/orders')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.primary.main }]}>
                                    <Ionicons name="receipt" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#1E1B4B' }]}>{t('orders')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#F0FDF4' }]}
                                onPress={() => router.push('/admin/products')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.success.main }]}>
                                    <Ionicons name="cube" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#064E3B' }]}>{t('products')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFF7ED' }]}
                                onPress={() => router.push('/admin/revenue')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.warning.main }]}>
                                    <Ionicons name="bar-chart" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#7C2D12' }]}>{t('profits')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#F0F9FF' }]}
                                onPress={() => router.push('/admin/customers')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.info.main }]}>
                                    <Ionicons name="people" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#0C4A6E' }]}>{t('customers')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FAF5FF' }]}
                                onPress={() => router.push('/admin/reviews')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.accent.main }]}>
                                    <Ionicons name="star" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#4C1D95' }]}>{t('reviews')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#F8FAFC' }]}
                                onPress={() => router.push('/admin/settings')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.neutral[500] }]}>
                                    <Ionicons name="settings" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#0F172A' }]}>{t('settings')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#F0FDFA' }]}
                                onPress={() => router.push('/admin/shipping')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.secondary.dark }]}>
                                    <Ionicons name="map" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#134E4A' }]}>{t('shipping')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#F0FDFA' }]}
                                onPress={() => router.push('/admin/notifications')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.secondary.main }]}>
                                    <Ionicons name="notifications" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#134E4A' }]}>{t('notifications')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridItem, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFBEB' }]}
                                onPress={() => router.push('/admin/discounts')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: ADMIN_COLORS.warning.dark }]}>
                                    <Ionicons name="pricetag" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.gridLabel, { color: isDark ? ADMIN_COLORS.neutral[200] : '#92400E' }]}>{t('coupons')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Recent Orders List */}
                        <View style={[styles.ordersSection, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                            <View style={styles.ordersSectionHeader}>
                                <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                                    <View style={[styles.iconBadgeAccent, { backgroundColor: ADMIN_COLORS.primary.light + '20', [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 10, width: 32, height: 32 }]}>
                                        <Ionicons name="receipt" size={16} color={ADMIN_COLORS.primary.main} />
                                    </View>
                                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{t('recentOrders')}</Text>
                                </View>
                                <TouchableOpacity
                                    style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: ADMIN_COLORS.primary.main + '15' }}
                                    onPress={() => router.push('/admin/orders')}
                                >
                                    <Text style={[styles.seeAllText, { color: ADMIN_COLORS.primary.main }]}>{t('seeAll')}</Text>
                                </TouchableOpacity>
                            </View>

                            {recentOrders?.slice(0, 5).map((order, index) => (
                                <TouchableOpacity
                                    key={order.id}
                                    style={[
                                        styles.orderRow,
                                        { backgroundColor: isDark ? ADMIN_COLORS.neutral[900] + '60' : ADMIN_COLORS.neutral[50], flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' },
                                        index < Math.min(recentOrders.length, 5) - 1 && { marginBottom: 8 }
                                    ]}
                                    onPress={() => router.push('/admin/orders')}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.orderIconWrap, { backgroundColor: getStatusColor(order.status) + '20', [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 12 }]}>
                                        <Ionicons name="bag-handle" size={18} color={getStatusColor(order.status)} />
                                    </View>
                                    <View style={[styles.orderInfo, { alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }]}>
                                        <Text style={[styles.orderId, { color: ADMIN_COLORS.primary.main }]}>#{order.id?.slice(-6) || '000000'}</Text>
                                        <Text style={[styles.orderCustomer, { color: isDark ? ADMIN_COLORS.neutral[300] : ADMIN_COLORS.neutral[600] }]}>{order.customer}</Text>
                                    </View>
                                    <View style={styles.orderMeta}>
                                        <Text style={[styles.orderAmount, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900], textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                                            {currencyService.formatAdminPrice(order.total || parseFloat(order.amount))}
                                        </Text>
                                        <View style={[
                                            styles.orderStatusBadge,
                                            { backgroundColor: getStatusColor(order.status) + '20' }
                                        ]}>
                                            <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                                                {t(order.status) || order.status}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {recentOrders.length === 0 && (
                                <View style={styles.emptyOrders}>
                                    <Ionicons name="receipt-outline" size={40} color={theme.textMuted} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('noRecentOrders')}</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ height: 100 }} />
                    </>
                )}
            </ScrollView>
        </View>
    );
}

// Helper functions
const getStatusColor = (status) => {
    switch (status) {
        case 'delivered': return '#10B981';
        case 'shipped':
        case 'out_for_delivery': return '#3B82F6';
        case 'processing':
        case 'confirmed': return '#8B5CF6';
        case 'pending': return '#F59E0B';
        case 'cancelled': return '#EF4444';
        default: return '#6B7280';
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

// getStyles logic moved to match new signature
const getStyles = (theme, isDark, isRTL) => {
    const { width } = Dimensions.get('window');
    return StyleSheet.create({
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
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            position: 'relative',
        },
        badge: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#EF4444',
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 2,
        },
        badgeText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
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

        // KPI Cards
        kpiRow: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            gap: 12,
            marginBottom: 12,
        },
        kpiCardLarge: {
            flex: 1.5,
            padding: 16,
            borderRadius: 20,
        },
        kpiCardSmall: {
            flex: 1,
            padding: 16,
            borderRadius: 20,
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

        // Gradient Cards (New Premium Design)
        gradientCard: {
            flex: 1.5,
            padding: 20,
            borderRadius: 20,
            minHeight: 140,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 15,
            elevation: 8,
        },
        gradientCardSmall: {
            flex: 1,
            padding: 16,
            borderRadius: 16,
            minHeight: 140,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
        },
        iconBadge: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        iconBadgeSmall: {
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        iconBadgeAccent: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        kpiLabelWhite: {
            fontSize: 12,
            fontWeight: '600',
            color: 'rgba(255,255,255,0.9)',
            marginTop: 12,
        },
        kpiSubtextWhite: {
            fontSize: 10,
            color: 'rgba(255,255,255,0.8)',
        },
        changeBadgeWhite: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
            gap: 4,
        },
        changeTextWhite: {
            fontSize: 11,
            fontWeight: '700',
            color: '#FFF',
        },
        changeTextSmallWhite: {
            fontSize: 10,
            fontWeight: '700',
            color: '#FFF',
        },

        // Charts
        chartCard: {
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 20,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
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
        summaryCard: {
            flex: 1,
            padding: 20,
            borderRadius: 20,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
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

        // Donut Chart (New)
        donutChartContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
        },
        donutChart: {
            width: 140,
            height: 140,
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
        },
        donutCenter: {
            width: 80,
            height: 80,
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
        },
        donutCenterValue: {
            fontSize: 24,
            fontWeight: '700',
        },
        donutCenterLabel: {
            fontSize: 10,
            marginTop: 2,
        },
        donutSegment: {
            position: 'absolute',
            opacity: 0.15,
        },
        donutLegend: {
            flex: 1,
            marginLeft: 20,
        },
        donutLegendItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0,0,0,0.05)',
        },
        legendValue: {
            fontSize: 16,
            fontWeight: '700',
        },
        legendPercentage: {
            fontSize: 12,
            fontWeight: '600',
        },

        // Horizontal Bars (New)
        horizontalBarItem: {
            marginBottom: 16,
        },
        horizontalBarHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        horizontalBarLabel: {
            fontSize: 12,
            fontWeight: '500',
        },
        horizontalBarValue: {
            fontSize: 12,
            fontWeight: '700',
        },
        horizontalBarContainer: {
            height: 10,
            borderRadius: 8,
            overflow: 'hidden',
        },
        horizontalBar: {
            height: '100%',
            borderRadius: 8,
        },

        // Status Cards
        sectionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 12,
        },
        statusCardsScroll: {
            paddingHorizontal: 16,
            marginBottom: 16,
        },
        statusCard: {
            width: 130,
            padding: 16,
            borderRadius: 20,
            marginRight: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        statusCardIconWrap: {
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
        },
        statusCardValue: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#fff',
        },
        statusCardLabel: {
            fontSize: 11,
            color: 'rgba(255,255,255,0.9)',
            marginTop: 4,
            fontWeight: '500',
        },
        statusCardChange: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            gap: 4,
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            alignSelf: 'flex-start',
        },
        statusCardChangeText: {
            fontSize: 10,
            color: '#fff',
            fontWeight: '600',
        },

        // Quick Grid
        quickGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 16,
            gap: 12,
            marginBottom: 16,
        },
        gridItem: {
            width: (width - 32 - 24) / 3,
            paddingVertical: 16,
            paddingHorizontal: 8,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
        },
        gridIcon: {
            width: 42,
            height: 42,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
        },
        gridLabel: {
            fontSize: 11,
            fontWeight: '700',
            textAlign: 'center',
        },

        // Orders Section
        ordersSection: {
            marginHorizontal: 16,
            borderRadius: 24,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
        },
        ordersSectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        seeAllText: {
            fontSize: 12,
            fontWeight: '700',
        },
        orderRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 16,
        },
        orderIconWrap: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        orderInfo: {
            flex: 1,
        },
        orderId: {
            fontSize: 13,
            fontWeight: '700',
        },
        orderCustomer: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 2,
        },
        orderMeta: {
            alignItems: 'flex-end',
        },
        orderAmount: {
            fontSize: 15,
            fontWeight: 'bold',
        },
        orderStatusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
            marginTop: 4,
        },
        orderStatusText: {
            fontSize: 10,
            fontWeight: '700',
        },
        emptyOrders: {
            alignItems: 'center',
            paddingVertical: 30,
        },
        emptyText: {
            marginTop: 8,
            fontSize: 13,
        },

        // Loading States
        skeletonCard: {
            backgroundColor: '#E5E7EB',
            borderRadius: 20,
            opacity: 0.3,
        },
        loadingText: {
            fontSize: 14,
            marginTop: 16,
        },
        notificationBadge: {
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
        },
        badgeText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
        },
    });
};
