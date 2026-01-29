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
import { getDashboardStats, getRecentOrders, getWeeklyRevenue, getCategorySales } from '../../src/services/adminAnalytics';
import { getAllCustomers } from '../../src/services/adminCustomerService';
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
                            <View style={styles.notificationDot} />
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

                {/* System Connection Diagnostic */}
                <View style={[styles.statusBanner, { backgroundColor: expoPushToken ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Ionicons
                        name={expoPushToken ? "wifi" : "alert-circle-outline"}
                        size={14}
                        color={expoPushToken ? '#059669' : '#DC2626'}
                    />
                    <Text style={[styles.statusText, { color: expoPushToken ? '#059669' : '#DC2626' }]}>
                        {expoPushToken
                            ? 'الجهاز مسجل في نظام الإشعارات'
                            : (registrationError || 'الجهاز غير متصل بنظام الإشعارات')}
                    </Text>
                    {expoPushToken && (
                        <View style={[styles.roleBadge, { backgroundColor: '#6366F1' }]}>
                            <Text style={styles.roleText}>{role}</Text>
                        </View>
                    )}
                </View>
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
                        <Surface variant="glass" padding="none" style={styles.kpiCardLargeGlass}>
                            <LinearGradient
                                colors={isDark ? ['rgba(99, 102, 241, 0.15)', 'rgba(129, 140, 248, 0.05)'] : ['#EEF2FF', '#F5F7FF']}
                                style={{ padding: 16, flex: 1 }}
                            >
                                <View style={styles.kpiHeader}>
                                    <View style={[styles.iconBox, { backgroundColor: '#6366F1' }]}>
                                        <Ionicons name="stats-chart" size={16} color="#FFF" />
                                    </View>
                                    <Text style={[styles.kpiLabel, { color: isDark ? theme.textSecondary : '#6366F1' }]}>إجمالي الإيرادات</Text>
                                    <TouchableOpacity onPress={() => router.push('/admin/analytics')}>
                                        <Ionicons name="chevron-forward" size={16} color={isDark ? theme.textMuted : "#6366F1"} />
                                    </TouchableOpacity>
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
                    </Animated.View>

                    {/* Total Orders */}
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(600)}
                        style={{ flex: 1 }}
                    >
                        <Surface variant="glass" padding="none" style={styles.kpiCardSmallGlass}>
                            <LinearGradient
                                colors={isDark ? ['rgba(124, 58, 237, 0.15)', 'rgba(139, 92, 246, 0.05)'] : ['#FAF5FF', '#FDFBFF']}
                                style={{ padding: 16, flex: 1 }}
                            >
                                <View style={styles.kpiHeader}>
                                    <View style={[styles.iconBox, { backgroundColor: '#7C3AED' }]}>
                                        <Ionicons name="receipt" size={14} color="#FFF" />
                                    </View>
                                    <Text style={[styles.kpiLabel, { color: isDark ? theme.textSecondary : '#7C3AED' }]}>الطلبات</Text>
                                </View>
                                <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.orders.value}</Text>
                                <View style={[styles.changeBadge, { backgroundColor: stats.orders.isPositive ? '#D1FAE530' : '#FEE2E230', marginTop: 8 }]}>
                                    <Text style={[styles.changeTextSmall, { color: stats.orders.isPositive ? '#10B981' : '#EF4444' }]}>
                                        {stats.orders.change}
                                    </Text>
                                </View>
                            </LinearGradient>
                        </Surface>
                    </Animated.View>
                </View>

                {/* KPI Cards Row 2 */}
                <View style={styles.kpiRow}>
                    {/* Customers */}
                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600)}
                        style={{ flex: 1 }}
                    >
                        <Surface variant="glass" padding="md" style={styles.kpiCardHalf}>
                            <View style={styles.kpiHeader}>
                                <View style={[styles.iconBoxSmall, { backgroundColor: '#F59E0B' }]}>
                                    <Ionicons name="people" size={14} color="#FFF" />
                                </View>
                                <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>الزبناء</Text>
                                <TouchableOpacity onPress={() => router.push('/admin/customers')}>
                                    <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.customers.value}</Text>
                        </Surface>
                    </Animated.View>

                    {/* Products */}
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(600)}
                        style={{ flex: 1 }}
                    >
                        <Surface variant="glass" padding="md" style={styles.kpiCardHalf}>
                            <View style={styles.kpiHeader}>
                                <View style={[styles.iconBoxSmall, { backgroundColor: '#10B981' }]}>
                                    <Ionicons name="cube" size={14} color="#FFF" />
                                </View>
                                <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>المنتجات</Text>
                            </View>
                            <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.products.value}</Text>
                        </Surface>
                    </Animated.View>
                </View>

                {/* Revenue Chart */}
                <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                    <Surface variant="glass" style={styles.chartCardGlass} padding="none">
                        <View style={{ padding: 20 }}>
                            <View style={styles.chartHeader}>
                                <View>
                                    <Text style={[styles.chartTitle, { color: theme.text }]}>الإيرادات</Text>
                                    <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>تحليل الأداء الأسبوعي</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.iconBoxSmall, { backgroundColor: '#6366F1' }]}
                                    onPress={() => router.push('/admin/analytics')}
                                >
                                    <Ionicons name="bar-chart" size={14} color="#FFF" />
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
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 120 }}>
                                        <ActivityIndicator color={theme.primary} />
                                    </View>
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
                            <View style={[styles.summaryIcon, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                            </View>
                            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.orders.value}</Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>طلب</Text>
                            <View style={[styles.pillBadge, { backgroundColor: '#F59E0B20' }]}>
                                <Text style={[styles.summarySubtext, { color: '#F59E0B', fontSize: 10 }]}>
                                    {orderStats.pending} قيد التأكيد
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
                        >
                            <Surface variant="glass" padding="md" style={styles.summaryCardGlass}>
                                <View style={[styles.summaryIcon, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="people" size={24} color="#F59E0B" />
                                </View>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.customers.value}</Text>
                                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>زبون</Text>
                                <View style={[styles.pillBadge, { backgroundColor: '#10B98120' }]}>
                                    <Text style={[styles.summarySubtext, { color: '#10B981', fontSize: 10 }]}>
                                        +5 جدد اليوم
                                    </Text>
                                </View>
                            </Surface>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Category Pie Chart */}
                <Animated.View entering={FadeInDown.delay(800).duration(600)}>
                    <Surface variant="glass" padding="md" style={styles.chartCardGlass}>
                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={[styles.chartTitle, { color: theme.text }]}>المبيعات حسب الفئة</Text>
                            </View>
                            <View style={[styles.iconBoxSmall, { backgroundColor: '#EC4899' }]}>
                                <Ionicons name="pie-chart" size={14} color="#FFF" />
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
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        <ActivityIndicator color={theme.primary} />
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
                    </Surface>
                </Animated.View>

                {/* Order Status Cards */}
                <Animated.View entering={FadeInUp.delay(900).duration(600)}>
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
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View
                    entering={FadeInDown.delay(1000).duration(600)}
                    style={styles.quickActions}
                >
                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/admin/orders')}
                    >
                        <Ionicons name="receipt" size={20} color="#fff" />
                        <Text style={styles.quickActionText}>إدارة الطلبات</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => router.push('/admin/products')}
                    >
                        <Ionicons name="cube" size={20} color="#fff" />
                        <Text style={styles.quickActionText}>إدارة المنتجات</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#F59E0B' }]}
                        onPress={() => router.push('/admin/coupons')}
                    >
                        <Ionicons name="gift" size={20} color="#fff" />
                        <Text style={styles.quickActionText}>الكوبونات</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#6366F1' }]}
                        onPress={() => router.push('/admin/broadcast')}
                    >
                        <Ionicons name="megaphone" size={20} color="#fff" />
                        <Text style={styles.quickActionText}>إعلان عام</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#EC4899' }]}
                        onPress={() => router.push('/admin/banners')}
                    >
                        <Ionicons name="images" size={20} color="#fff" />
                        <Text style={styles.quickActionText}>تسيير الواجهة</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Recent Orders List */}
                <Animated.View entering={FadeInUp.delay(1100).duration(600)}>
                    <Surface variant="glass" padding="none" style={styles.ordersSectionGlass}>
                        <View style={styles.ordersSectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>آخر الطلبات</Text>
                            <TouchableOpacity onPress={() => router.push('/admin/orders')}>
                                <Text style={[styles.seeAllText, { color: theme.primary }]}>عرض الكل</Text>
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
        </View >
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
    kpiCardLargeGlass: {
        flex: 1.5,
        borderRadius: 24,
        overflow: 'hidden',
    },
    kpiCardSmallGlass: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
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

    // Quick Actions
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    quickActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        gap: 8,
    },
    quickActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
});
