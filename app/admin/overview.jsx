/**
 * Admin Overview - Kataraa
 * Professional Dashboard with Charts & Modern Design
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTheme } from '../../src/context/ThemeContext';
import { getCategorySales, getDashboardStats, getRecentOrders, getWeeklyRevenue } from '../../src/services/adminAnalytics';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

// Helper to get formatted date
const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date().toLocaleDateString('ar-MA', options);
};

export default function AdminOverview() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const { adminUnreadCount } = useNotifications();
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [kpiData, ordersData, revenueData, catSalesData] = await Promise.all([
                getDashboardStats(),
                getRecentOrders(),
                getWeeklyRevenue(),
                getCategorySales()
            ]);

            if (kpiData) setStats(kpiData);
            if (ordersData) setRecentOrders(ordersData);
            if (revenueData) setWeeklyRevenue(revenueData);
            if (catSalesData) setCategorySales(catSalesData);
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
                        <Text style={[styles.dateText, { color: theme.primary }]}>{getFormattedDate()}</Text>
                        <Text style={[styles.greeting, { color: theme.text }]}>
                            مرحباً، {user?.displayName || 'المشرف'}! 👋
                        </Text>
                        <Text style={[styles.subGreeting, { color: theme.textSecondary }]}>
                            هذا ما يحدث في متجرك هذا الشهر
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
                            {adminUnreadCount > 0 && <View style={styles.notificationDot} />}
                        </TouchableOpacity>
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarText}>
                                    {user?.displayName?.charAt(0) || 'م'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {/* KPI Cards Row 1 */}
                <View style={styles.kpiRow}>
                    {/* Total Revenue - Featured */}
                    <TouchableOpacity
                        style={[styles.kpiCardLarge, { backgroundColor: '#EEF2FF' }]}
                        onPress={() => router.push('/admin/revenue')}
                        activeOpacity={0.9}
                    >
                        <View style={styles.kpiHeader}>
                            <Text style={[styles.kpiLabel, { color: '#6366F1' }]}>إجمالي الإيرادات</Text>
                            <Ionicons name="open-outline" size={16} color="#6366F1" />
                        </View>
                        <Text style={[styles.kpiValueLarge, { color: '#1E1B4B' }]}>{stats.revenue.value}</Text>
                        <View style={styles.kpiFooter}>
                            <Text style={[styles.kpiSubtext, { color: '#6366F1' }]}>هذا الشهر مقابل الماضي</Text>
                            <View style={[styles.changeBadge, { backgroundColor: stats.revenue.isPositive ? '#D1FAE5' : '#FEE2E2' }]}>
                                <Ionicons
                                    name={stats.revenue.isPositive ? "trending-up" : "trending-down"}
                                    size={12}
                                    color={stats.revenue.isPositive ? '#059669' : '#DC2626'}
                                />
                                <Text style={[styles.changeText, { color: stats.revenue.isPositive ? '#059669' : '#DC2626' }]}>
                                    {stats.revenue.change}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Total Orders */}
                    <TouchableOpacity
                        style={[styles.kpiCardSmall, { backgroundColor: '#FAF5FF' }]}
                        onPress={() => router.push('/admin/orders')}
                        activeOpacity={0.9}
                    >
                        <View style={styles.kpiHeader}>
                            <Text style={[styles.kpiLabel, { color: '#7C3AED' }]}>إجمالي الطلبات</Text>
                            <Ionicons name="open-outline" size={14} color="#7C3AED" />
                        </View>
                        <Text style={[styles.kpiValue, { color: '#1E1B4B' }]}>{stats.orders.value}</Text>
                        <View style={[styles.changeBadge, { backgroundColor: stats.orders.isPositive ? '#D1FAE5' : '#FEE2E2', marginTop: 8 }]}>
                            <Ionicons
                                name={stats.orders.isPositive ? "trending-up" : "trending-down"}
                                size={10}
                                color={stats.orders.isPositive ? '#059669' : '#DC2626'}
                            />
                            <Text style={[styles.changeTextSmall, { color: stats.orders.isPositive ? '#059669' : '#DC2626' }]}>
                                {stats.orders.change}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* KPI Cards Row 2 */}
                <View style={styles.kpiRow}>
                    {/* Customers */}
                    <TouchableOpacity
                        style={[styles.kpiCardHalf, { backgroundColor: theme.backgroundCard }]}
                        onPress={() => router.push('/admin/customers')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.kpiHeader}>
                            <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>إجمالي الزبناء</Text>
                            <Ionicons name="open-outline" size={14} color={theme.textSecondary} />
                        </View>
                        <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.customers.value}</Text>
                        <View style={[styles.changeBadge, { backgroundColor: '#FEE2E2', marginTop: 8 }]}>
                            <Ionicons name="trending-down" size={10} color="#DC2626" />
                            <Text style={[styles.changeTextSmall, { color: '#DC2626' }]}>-2.1%</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Products */}
                    <TouchableOpacity
                        style={[styles.kpiCardHalf, { backgroundColor: theme.backgroundCard }]}
                        onPress={() => router.push('/admin/products')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.kpiHeader}>
                            <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>إجمالي المنتجات</Text>
                            <Ionicons name="open-outline" size={14} color={theme.textSecondary} />
                        </View>
                        <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.products.value}</Text>
                        <View style={[styles.changeBadge, { backgroundColor: '#D1FAE5', marginTop: 8 }]}>
                            <Ionicons name="trending-up" size={10} color="#059669" />
                            <Text style={[styles.changeTextSmall, { color: '#059669' }]}>+5.4%</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Revenue Chart */}
                <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={[styles.chartTitle, { color: theme.text }]}>الإيرادات</Text>
                            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>هذا الشهر مقابل الماضي</Text>
                        </View>
                        <TouchableOpacity>
                            <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Bar Chart */}
                    <View style={styles.barChart}>
                        {weeklyRevenue.length > 0 ? weeklyRevenue.map((item, index) => (
                            <View key={index} style={styles.barItem}>
                                <View style={styles.barContainer}>
                                    <LinearGradient
                                        colors={['#6366F1', '#818CF8']}
                                        style={[
                                            styles.bar,
                                            { height: `${weeklyRevenue.length > 0 ? (item.value / (Math.max(...weeklyRevenue.map(d => d.value)) || 1)) * 100 : 0}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.day}</Text>
                            </View>
                        )) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 150 }}>
                                <Text style={{ color: theme.textSecondary }}>جاري تحميل البيانات...</Text>
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
                        <Text style={[styles.summaryLabel, { color: theme.text }]}>طلب</Text>
                        <Text style={[styles.summarySubtext, { color: '#F59E0B' }]}>
                            {stats.orders.change}
                        </Text>
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
                        <Text style={[styles.summaryLabel, { color: theme.text }]}>زبون</Text>
                        <Text style={[styles.summarySubtext, { color: '#10B981' }]}>
                            5 زبائن جدد اليوم
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Category Pie Chart */}
                <View style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={[styles.chartTitle, { color: theme.text }]}>المبيعات حسب الفئة</Text>
                            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>هذا الشهر مقابل الماضي</Text>
                        </View>
                        <TouchableOpacity>
                            <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
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
                                            width: 40 + ((cat.value / (Math.max(...categorySales.map(c => c.value)) || 1)) * 40), // Scale relative to max
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
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>NO DATA</Text>
                                </View>
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
                </View>

                {/* Order Status Cards */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 16, marginTop: 8 }]}>
                    حالة الطلبات
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusCardsScroll}>
                    <View style={[styles.statusCard, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.statusCardValue}>{orderStats.pending + orderStats.confirmed}</Text>
                        <Text style={styles.statusCardLabel}>طلبات جديدة</Text>
                        <View style={styles.statusCardChange}>
                            <Ionicons name="trending-up" size={10} color="#fff" />
                            <Text style={styles.statusCardChangeText}>+3.2%</Text>
                        </View>
                    </View>
                    <View style={[styles.statusCard, { backgroundColor: '#F59E0B' }]}>
                        <Text style={styles.statusCardValue}>{orderStats.pending}</Text>
                        <Text style={styles.statusCardLabel}>بانتظار التأكيد</Text>
                        <View style={styles.statusCardChange}>
                            <Ionicons name="trending-up" size={10} color="#fff" />
                            <Text style={styles.statusCardChangeText}>+2.4%</Text>
                        </View>
                    </View>
                    <View style={[styles.statusCard, { backgroundColor: '#3B82F6' }]}>
                        <Text style={styles.statusCardValue}>{orderStats.shipped}</Text>
                        <Text style={styles.statusCardLabel}>في الطريق</Text>
                        <View style={styles.statusCardChange}>
                            <Ionicons name="trending-down" size={10} color="#fff" />
                            <Text style={styles.statusCardChangeText}>-0.5%</Text>
                        </View>
                    </View>
                    <View style={[styles.statusCard, { backgroundColor: '#8B5CF6' }]}>
                        <Text style={styles.statusCardValue}>{orderStats.delivered}</Text>
                        <Text style={styles.statusCardLabel}>تم التوصيل</Text>
                        <View style={styles.statusCardChange}>
                            <Ionicons name="trending-up" size={10} color="#fff" />
                            <Text style={styles.statusCardChangeText}>+2.8%</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Quick Actions Grid */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 16, marginTop: 8 }]}>
                    إدارة المتجر
                </Text>
                <View style={styles.quickGrid}>
                    <TouchableOpacity
                        style={[styles.gridItem, { backgroundColor: '#EEF2FF' }]}
                        onPress={() => router.push('/admin/orders')}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: '#6366F1' }]}>
                            <Ionicons name="receipt" size={20} color="#fff" />
                        </View>
                        <Text style={[styles.gridLabel, { color: '#1E1B4B' }]}>الطلبات</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.gridItem, { backgroundColor: '#F0FDF4' }]}
                        onPress={() => router.push('/admin/products')}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: '#22C55E' }]}>
                            <Ionicons name="cube" size={20} color="#fff" />
                        </View>
                        <Text style={[styles.gridLabel, { color: '#064E3B' }]}>المنتجات</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.gridItem, { backgroundColor: '#FFF7ED' }]}
                        onPress={() => router.push('/admin/revenue')}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: '#F97316' }]}>
                            <Ionicons name="bar-chart" size={20} color="#fff" />
                        </View>
                        <Text style={[styles.gridLabel, { color: '#7C2D12' }]}>الأرباح</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.gridItem, { backgroundColor: '#F0F9FF' }]}
                        onPress={() => router.push('/admin/customers')}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: '#0EA5E9' }]}>
                            <Ionicons name="people" size={20} color="#fff" />
                        </View>
                        <Text style={[styles.gridLabel, { color: '#0C4A6E' }]}>الزبناء</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.gridItem, { backgroundColor: '#FAF5FF' }]}
                        onPress={() => router.push('/admin/reviews')}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: '#A855F7' }]}>
                            <Ionicons name="star" size={20} color="#fff" />
                        </View>
                        <Text style={[styles.gridLabel, { color: '#4C1D95' }]}>المراجعات</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.gridItem, { backgroundColor: '#F8FAFC' }]}
                        onPress={() => router.push('/admin/settings')}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: '#64748B' }]}>
                            <Ionicons name="settings" size={20} color="#fff" />
                        </View>
                        <Text style={[styles.gridLabel, { color: '#0F172A' }]}>الإعدادات</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Orders List */}
                <View style={[styles.ordersSection, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.ordersSectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>آخر الطلبات</Text>
                        <TouchableOpacity onPress={() => router.push('/admin/orders')}>
                            <Text style={[styles.seeAllText, { color: theme.primary }]}>عرض الكل</Text>
                        </TouchableOpacity>
                    </View>

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
                                <Text style={[styles.orderId, { color: theme.primary }]}>#{order.id?.slice(-6) || '000000'}</Text>
                                <Text style={[styles.orderCustomer, { color: theme.text }]}>{order.customer}</Text>
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

                    {recentOrders.length === 0 && (
                        <View style={styles.emptyOrders}>
                            <Ionicons name="receipt-outline" size={40} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>لا توجد طلبات حديثة</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
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
        width: 120,
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
    },
    statusCardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statusCardLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    statusCardChange: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 4,
    },
    statusCardChangeText: {
        fontSize: 10,
        color: '#fff',
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
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    // Orders Section
    ordersSection: {
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    ordersSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
});
