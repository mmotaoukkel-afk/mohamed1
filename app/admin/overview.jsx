/**
 * Admin Overview - Kataraa
 * Premium Professional Dashboard
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminNotificationCenter } from '../../src/components/admin/AdminNotificationCenter';
import { useAuth } from '../../src/context/AuthContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
    getCategorySales,
    getDashboardStats,
    getNewCustomersToday,
    getOrderStatusTrends,
    getWeeklyRevenue
} from '../../src/services/adminAnalyticsService';
    
import { subscribeToOrders } from '../../src/services/adminOrderService';
import { notifyAdmins } from '../../src/services/adminNotificationService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

const getFormattedDate = (locale = 'ar-MA') => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    try {
        return new Date().toLocaleDateString(locale, options);
    } catch (e) {
        return new Date().toLocaleDateString('en-US', options);
    }
};

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

export default function AdminOverview() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const { adminUnreadCount, addNotification } = useNotifications();

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

    const loadData = useCallback(async () => {
        try {
            const [kpiData, revenueData, catSalesData, newCustomers, trends] = await Promise.all([
                getDashboardStats(),
                getWeeklyRevenue(),
                getCategorySales(),
                getNewCustomersToday(),
                getOrderStatusTrends()
            ]);
            if (kpiData) setStats(kpiData);
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

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const unsubscribe = subscribeToOrders({ limitCount: 5 }, (data) => {
            setRecentOrders(data.orders || []);
        });
        return () => {
            if (unsubscribe) unsubscribe();
        }
    }, []);

    useEffect(() => {
        if (adminUnreadCount > 0) loadData();
    }, [adminUnreadCount, loadData]);

    const onRefresh = () => { setRefreshing(true); loadData(); };

    const orderStats = {
        pending: recentOrders.filter(o => o.status === 'pending').length,
        confirmed: recentOrders.filter(o => o.status === 'confirmed' || o.status === 'processing').length,
        shipped: recentOrders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length,
        delivered: recentOrders.filter(o => o.status === 'delivered').length,
    };

    const QUICK_ACTIONS = [
        { key: 'orders', icon: 'receipt', gradient: ['#6366F1', '#4F46E5'], route: '/admin/orders' },
        { key: 'products', icon: 'cube', gradient: ['#10B981', '#059669'], route: '/admin/products' },
        { key: 'profits', icon: 'bar-chart', gradient: ['#F59E0B', '#D97706'], route: '/admin/revenue' },
        { key: 'customers', icon: 'people', gradient: ['#3B82F6', '#2563EB'], route: '/admin/customers' },
        { key: 'reviews', icon: 'star', gradient: ['#8B5CF6', '#7C3AED'], route: '/admin/reviews' },
        { key: 'settings', icon: 'settings', gradient: ['#64748B', '#475569'], route: '/admin/settings' },
        { key: 'shipping', icon: 'map', gradient: ['#06B6D4', '#0891B2'], route: '/admin/shipping' },
        { key: 'notifications', icon: 'notifications', gradient: ['#EC4899', '#DB2777'], route: '/admin/notifications' },
        { key: 'coupons', icon: 'pricetag', gradient: ['#F97316', '#EA580C'], route: '/admin/discounts' },
        { key: 'activityLogs', icon: 'document-text', gradient: ['#64748B', '#334155'], route: '/admin/activity-logs' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
            {/* ═══ PREMIUM HEADER BANNER ═══ */}
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerBanner}
            >
                {/* Decorative circles */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />
                <View style={styles.decorCircle3} />

                <SafeAreaView edges={['top']}>
                    {/* Top row: avatar + date + action buttons */}
                    <View style={styles.headerTopRow}>
                        {/* Avatar */}
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{user?.displayName?.charAt(0)?.toUpperCase() || 'A'}</Text>
                            </View>
                        )}

                        {/* Date pill */}
                        <View style={styles.datePill}>
                            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.datePillText}>{getFormattedDate(locale === 'ar' ? 'ar-SA' : 'en-US')}</Text>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.glassBtn}
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
                                        if (result.success && typeof addNotification === 'function') {
                                            addNotification(t('sentSuccessfully'), t('sentSuccessfullyDesc'), 'success', { scope: 'admin', isLocal: true });
                                        }
                                    } catch (e) { console.log(e); }
                                }}
                                onPress={() => {
                                    if (typeof addNotification === 'function') {
                                        addNotification(t('localNotif'), t('localNotifDesc'), 'success', { scope: 'admin', isLocal: true });
                                    }
                                }}
                            >
                                <Ionicons name="flask-outline" size={18} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.glassBtn} onPress={() => setShowNotifications(true)}>
                                <Ionicons name="notifications-outline" size={20} color="#fff" />
                                {adminUnreadCount > 0 && (
                                    <View style={styles.notifDot}>
                                        <Text style={styles.notifDotText}>{adminUnreadCount > 9 ? '9+' : adminUnreadCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.glassBtn} onPress={() => router.push('/admin/settings')}>
                                <Ionicons name="settings-outline" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Greeting */}
                    <View style={styles.greetingBlock}>
                        <Text style={styles.greeting}>
                            {t('hello')}, {user?.displayName || t('admin')}! 👋
                        </Text>
                        <Text style={styles.subGreeting}>{t('storeActivityMonth')}</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <AdminNotificationCenter
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
                contentContainerStyle={{ paddingBottom: 110 }}
            >
                {loading ? (
                    <View style={{ padding: 20, gap: 12 }}>
                        {[120, 100, 180].map((h, i) => (
                            <View key={i} style={[styles.skeleton, { height: h }]} />
                        ))}
                        <Text style={{ textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B', marginTop: 8 }}>
                            {t('loadingData')}...
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* ═══ KPI ROW 1: Revenue (large) + Orders (small) ═══ */}
                        <View style={styles.kpiRow}>
                            {/* Revenue - Featured card */}
                            <TouchableOpacity
                                style={styles.kpiLargeWrap}
                                onPress={() => router.push('/admin/revenue')}
                                activeOpacity={0.92}
                            >
                                <LinearGradient
                                    colors={['#4F46E5', '#7C3AED']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.kpiLargeCard}
                                >
                                    <View style={styles.kpiCardDecor} />
                                    <View style={styles.kpiCardTop}>
                                        <View style={styles.kpiIconWrap}>
                                            <Ionicons name="trending-up" size={20} color="#fff" />
                                        </View>
                                        <View style={[styles.changePill, { backgroundColor: stats.revenue.isPositive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }]}>
                                            <Ionicons name={stats.revenue.isPositive ? 'arrow-up' : 'arrow-down'} size={10} color="#fff" />
                                            <Text style={styles.changePillText}>{stats.revenue.change}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.kpiWhiteLabel}>{t('totalRevenue')}</Text>
                                    <Text style={styles.kpiLargeValue}>{stats.revenue.value}</Text>
                                    <Text style={styles.kpiWhiteSub}>{t('thisMonth')}</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Orders - Small card */}
                            <TouchableOpacity
                                style={styles.kpiSmallWrap}
                                onPress={() => router.push('/admin/orders')}
                                activeOpacity={0.92}
                            >
                                <LinearGradient
                                    colors={['#06B6D4', '#3B82F6']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.kpiSmallCard}
                                >
                                    <View style={styles.kpiCardDecor} />
                                    <View style={styles.kpiIconWrap}>
                                        <Ionicons name="receipt-outline" size={18} color="#fff" />
                                    </View>
                                    <Text style={[styles.kpiWhiteLabel, { marginTop: 10 }]}>{t('orders')}</Text>
                                    <Text style={styles.kpiMedValue}>{stats.orders.value}</Text>
                                    <View style={[styles.changePill, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 6 }]}>
                                        <Ionicons name={stats.orders.isPositive ? 'arrow-up' : 'arrow-down'} size={9} color="#fff" />
                                        <Text style={styles.changePillText}>{stats.orders.change}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* ═══ KPI ROW 2: Customers + Products ═══ */}
                        <View style={styles.kpiRow}>
                            {/* Customers */}
                            <TouchableOpacity
                                style={[styles.kpiHalfCard, { backgroundColor: isDark ? '#1E293B' : '#fff', shadowColor: '#10B981' }]}
                                onPress={() => router.push('/admin/customers')}
                                activeOpacity={0.9}
                            >
                                <View style={[styles.kpiHalfIcon, { backgroundColor: '#D1FAE5' }]}>
                                    <Ionicons name="people" size={22} color="#10B981" />
                                </View>
                                <Text style={[styles.kpiHalfLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t('customers')}</Text>
                                <Text style={[styles.kpiHalfValue, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{stats.customers.value}</Text>
                                <View style={[styles.changePill, {
                                    backgroundColor: stats.customers.isPositive ? '#D1FAE5' : '#FEE2E2',
                                    marginTop: 6
                                }]}>
                                    <Ionicons name={stats.customers.isPositive ? 'trending-up' : 'trending-down'} size={10} color={stats.customers.isPositive ? '#10B981' : '#EF4444'} />
                                    <Text style={[styles.changePillText, { color: stats.customers.isPositive ? '#10B981' : '#EF4444' }]}>{stats.customers.change}</Text>
                                </View>
                                <Text style={[styles.kpiHalfSub, { color: isDark ? '#475569' : '#94A3B8' }]}>
                                    {newCustomersToday} {t('newCustomers')} {t('today')}
                                </Text>
                            </TouchableOpacity>

                            {/* Products */}
                            <TouchableOpacity
                                style={[styles.kpiHalfCard, { backgroundColor: isDark ? '#1E293B' : '#fff', shadowColor: '#F59E0B' }]}
                                onPress={() => router.push('/admin/products')}
                                activeOpacity={0.9}
                            >
                                <View style={[styles.kpiHalfIcon, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="cube" size={22} color="#F59E0B" />
                                </View>
                                <Text style={[styles.kpiHalfLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t('products')}</Text>
                                <Text style={[styles.kpiHalfValue, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{stats.products.value}</Text>
                                <View style={[styles.changePill, {
                                    backgroundColor: stats.products.isPositive ? '#D1FAE5' : '#FEE2E2',
                                    marginTop: 6
                                }]}>
                                    <Ionicons name={stats.products.isPositive ? 'trending-up' : 'trending-down'} size={10} color={stats.products.isPositive ? '#10B981' : '#EF4444'} />
                                    <Text style={[styles.changePillText, { color: stats.products.isPositive ? '#10B981' : '#EF4444' }]}>{stats.products.change}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* ═══ REVENUE BAR CHART ═══ */}
                        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                            <View style={styles.sectionCardHeader}>
                                <View>
                                    <Text style={[styles.sectionCardTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{t('weeklyRevenue')}</Text>
                                    <Text style={[styles.sectionCardSub, { color: isDark ? '#64748B' : '#94A3B8' }]}>{t('last7Days')}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.seeAllBtn, { backgroundColor: '#4F46E5' + '18' }]}
                                    onPress={() => router.push('/admin/revenue')}
                                >
                                    <Ionicons name="open-outline" size={16} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.barChart}>
                                {weeklyRevenue.length > 0 ? weeklyRevenue.map((item, index) => {
                                    const maxVal = Math.max(...weeklyRevenue.map(d => d.value)) || 1;
                                    const pct = (item.value / maxVal) * 100;
                                    return (
                                        <View key={index} style={styles.barItem}>
                                            <View style={[styles.barBg, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                                                <LinearGradient
                                                    colors={['#4F46E5', '#7C3AED']}
                                                    style={[styles.barFill, { height: `${pct}%` }]}
                                                />
                                            </View>
                                            <Text style={[styles.barLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>{item.day}</Text>
                                        </View>
                                    );
                                }) : (
                                    <Text style={{ color: isDark ? '#475569' : '#94A3B8', textAlign: 'center', flex: 1 }}>{t('loadingData')}...</Text>
                                )}
                            </View>
                        </View>

                        {/* ═══ ORDER STATUS HORIZONTAL CARDS ═══ */}
                        <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{t('orderStatus')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 4 }}>
                            {[
                                { label: t('newOrders'), value: orderTrends?.newOrders?.count ?? (orderStats.pending + orderStats.confirmed), change: orderTrends?.newOrders?.change ?? 0, gradient: ['#10B981', '#059669'], icon: 'bag-add' },
                                { label: t('awaitingConfirmation'), value: orderTrends?.pending?.count ?? orderStats.pending, change: orderTrends?.pending?.change ?? 0, gradient: ['#F59E0B', '#D97706'], icon: 'time' },
                                { label: t('onTheWay'), value: orderTrends?.shipped?.count ?? orderStats.shipped, change: orderTrends?.shipped?.change ?? 0, gradient: ['#3B82F6', '#2563EB'], icon: 'airplane' },
                                { label: t('delivered'), value: orderTrends?.delivered?.count ?? orderStats.delivered, change: orderTrends?.delivered?.change ?? 0, gradient: ['#8B5CF6', '#7C3AED'], icon: 'checkmark-done-circle' },
                            ].map((card, i) => (
                                <LinearGradient key={i} colors={card.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusCard}>
                                    <View style={styles.statusCardIcon}>
                                        <Ionicons name={card.icon} size={20} color="#fff" />
                                    </View>
                                    <Text style={styles.statusCardValue}>{card.value}</Text>
                                    <Text style={styles.statusCardLabel}>{card.label}</Text>
                                    <View style={styles.statusChangePill}>
                                        <Ionicons name={card.change >= 0 ? 'trending-up' : 'trending-down'} size={10} color="#fff" />
                                        <Text style={styles.statusChangeText}>{card.change >= 0 ? '+' : ''}{card.change}%</Text>
                                    </View>
                                </LinearGradient>
                            ))}
                        </ScrollView>

                        {/* ═══ QUICK ACTIONS GRID ═══ */}
                        <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{t('storeManagement')}</Text>
                        <View style={styles.quickGrid}>
                            {QUICK_ACTIONS.map((action) => (
                                <TouchableOpacity
                                    key={action.key}
                                    style={[styles.quickCard, {
                                        backgroundColor: isDark ? '#1E293B' : '#fff',
                                        shadowColor: action.gradient[0],
                                    }]}
                                    onPress={() => router.push(action.route)}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={action.gradient}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        style={styles.quickIconWrap}
                                    >
                                        <Ionicons name={action.icon} size={22} color="#fff" />
                                    </LinearGradient>
                                    <Text style={[styles.quickLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                                        {t(action.key)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* ═══ RECENT ORDERS ═══ */}
                        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                            <View style={styles.sectionCardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={[styles.sectionIconWrap, { backgroundColor: '#4F46E5' + '18' }]}>
                                        <Ionicons name="receipt" size={16} color="#4F46E5" />
                                    </View>
                                    <Text style={[styles.sectionCardTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{t('recentOrders')}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.seeAllBtn, { backgroundColor: '#4F46E5' + '18' }]}
                                    onPress={() => router.push('/admin/orders')}
                                >
                                    <Text style={{ color: '#4F46E5', fontSize: 12, fontWeight: '700' }}>{t('seeAll')}</Text>
                                </TouchableOpacity>
                            </View>

                            {recentOrders.length === 0 ? (
                                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                                    <Ionicons name="receipt-outline" size={40} color={isDark ? '#334155' : '#CBD5E1'} />
                                    <Text style={{ color: isDark ? '#475569' : '#94A3B8', marginTop: 10, fontSize: 13 }}>{t('noRecentOrders')}</Text>
                                </View>
                            ) : (
                                recentOrders.slice(0, 5).map((order, index) => {
                                    const color = getStatusColor(order.status);
                                    return (
                                        <TouchableOpacity
                                            key={order.id}
                                            style={[
                                                styles.orderRow,
                                                {
                                                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                                    borderLeftColor: color,
                                                },
                                                index < 4 && { marginBottom: 8 }
                                            ]}
                                            onPress={() => router.push('/admin/orders')}
                                            activeOpacity={0.8}
                                        >
                                            {/* Colored left border accent */}
                                            <View style={[styles.orderColorBar, { backgroundColor: color }]} />

                                            <View style={[styles.orderIconCircle, { backgroundColor: color + '20' }]}>
                                                <Ionicons name="bag-handle" size={16} color={color} />
                                            </View>

                                            <View style={styles.orderInfo}>
                                                <Text style={[styles.orderId, { color: '#4F46E5' }]}>#{order.id?.slice(-6) || '000000'}</Text>
                                                <Text style={[styles.orderCustomer, { color: isDark ? '#64748B' : '#94A3B8' }]} numberOfLines={1}>
                                                    {typeof order.customer === 'object' ? (order.customer?.displayName || order.customer?.email || t('guest')) : (order.customer || t('guest'))}
                                                </Text>
                                            </View>

                                            <View style={styles.orderMeta}>
                                                <Text style={[styles.orderAmount, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                                                    {currencyService.formatAdminPrice(order.total || parseFloat(order.amount))}
                                                </Text>
                                                <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                                                    <Text style={[styles.statusBadgeText, { color }]}>{t(order.status) || order.status}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>

                        {/* Category Sales mini chart */}
                        {categorySales.length > 0 && (
                            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E293B' : '#fff', marginTop: 0 }]}>
                                <Text style={[styles.sectionCardTitle, { color: isDark ? '#F1F5F9' : '#0F172A', marginBottom: 16 }]}>{t('salesByCategory')}</Text>
                                {categorySales.slice(0, 5).map((cat, index) => {
                                    const maxVal = Math.max(...categorySales.map(c => c.value)) || 1;
                                    const pct = ((cat.value / maxVal) * 100).toFixed(0);
                                    const barColors = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];
                                    return (
                                        <View key={index} style={{ marginBottom: 14 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <Text style={{ color: isDark ? '#CBD5E1' : '#334155', fontSize: 12, fontWeight: '600' }}>{cat.name}</Text>
                                                <Text style={{ color: barColors[index % 5], fontSize: 12, fontWeight: '700' }}>{pct}%</Text>
                                            </View>
                                            <View style={{ height: 8, backgroundColor: isDark ? '#334155' : '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
                                                <View style={{ height: '100%', width: `${pct}%`, backgroundColor: barColors[index % 5], borderRadius: 8 }} />
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    headerBanner: {
        paddingBottom: 28,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute', width: 200, height: 200,
        borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)',
        top: -60, right: -50,
    },
    decorCircle2: {
        position: 'absolute', width: 120, height: 120,
        borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)',
        bottom: -20, left: 30,
    },
    decorCircle3: {
        position: 'absolute', width: 80, height: 80,
        borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)',
        top: 40, left: 140,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        marginBottom: 18,
    },
    avatar: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
    avatarPlaceholder: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    datePill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    datePillText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
    headerActions: { flexDirection: 'row', gap: 8 },
    glassBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        position: 'relative',
    },
    notifDot: {
        position: 'absolute', top: -4, right: -4,
        backgroundColor: '#EF4444', minWidth: 16, height: 16,
        borderRadius: 8, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#fff',
    },
    notifDotText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    greetingBlock: { paddingBottom: 4 },
    greeting: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
    subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

    // KPI Cards
    kpiRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12, marginTop: 16 },
    kpiLargeWrap: { flex: 1.55 },
    kpiSmallWrap: { flex: 1 },
    kpiLargeCard: {
        borderRadius: 22, padding: 20, minHeight: 160,
        overflow: 'hidden',
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
    },
    kpiSmallCard: {
        borderRadius: 22, padding: 16, minHeight: 160,
        overflow: 'hidden',
        shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    kpiCardDecor: {
        position: 'absolute', width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.08)', top: -30, right: -20,
    },
    kpiCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 },
    kpiIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    kpiWhiteLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 14 },
    kpiLargeValue: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 4 },
    kpiMedValue: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 4 },
    kpiWhiteSub: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
    changePill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start',
    },
    changePillText: { fontSize: 10, fontWeight: '700', color: '#fff' },

    kpiHalfCard: {
        flex: 1, borderRadius: 22, padding: 18,
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
    },
    kpiHalfIcon: {
        width: 48, height: 48, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    },
    kpiHalfLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    kpiHalfValue: { fontSize: 28, fontWeight: '800' },
    kpiHalfSub: { fontSize: 10, marginTop: 6 },

    // Bar Chart
    sectionCard: {
        marginHorizontal: 16, marginBottom: 16, borderRadius: 22, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    },
    sectionCardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    sectionCardTitle: { fontSize: 16, fontWeight: '800' },
    sectionCardSub: { fontSize: 11, marginTop: 2 },
    seeAllBtn: { padding: 8, borderRadius: 10 },
    sectionIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    barChart: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-end', height: 110,
    },
    barItem: { flex: 1, alignItems: 'center' },
    barBg: { width: 22, height: 90, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 8 },
    barLabel: { fontSize: 9, marginTop: 6, fontWeight: '600' },

    // Section title
    sectionTitle: {
        fontSize: 15, fontWeight: '800',
        marginHorizontal: 16, marginBottom: 12, marginTop: 4,
    },

    // Status cards
    statusCard: {
        width: 128, borderRadius: 20, padding: 16, marginRight: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
        overflow: 'hidden',
    },
    statusCardIcon: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    statusCardValue: { fontSize: 30, fontWeight: '800', color: '#fff' },
    statusCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '600' },
    statusChangePill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        marginTop: 10, alignSelf: 'flex-start',
    },
    statusChangeText: { fontSize: 9, color: '#fff', fontWeight: '700' },

    // Quick Actions
    quickGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: 16, gap: 10, marginBottom: 16,
    },
    quickCard: {
        width: (width - 32 - 20) / 3,
        paddingVertical: 18, paddingHorizontal: 8,
        borderRadius: 20, alignItems: 'center',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    },
    quickIconWrap: {
        width: 50, height: 50, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
    },
    quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

    // Recent Orders
    orderRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 16, padding: 12,
        borderLeftWidth: 3, overflow: 'hidden',
    },
    orderColorBar: { width: 3, height: '100%', position: 'absolute', left: 0 },
    orderIconCircle: {
        width: 36, height: 36, borderRadius: 11,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    orderInfo: { flex: 1 },
    orderId: { fontSize: 13, fontWeight: '800' },
    orderCustomer: { fontSize: 11, marginTop: 2, fontWeight: '500' },
    orderMeta: { alignItems: 'flex-end' },
    orderAmount: { fontSize: 14, fontWeight: '800' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
    statusBadgeText: { fontSize: 10, fontWeight: '700' },

    // Loading
    skeleton: {
        backgroundColor: '#E2E8F0', borderRadius: 20,
        opacity: 0.5,
    },
});
