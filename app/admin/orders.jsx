/**
 * Admin Orders - Kataraa
 * Enhanced order management control center
 * 🔐 Protected by RequireAdmin
 * Features: Status Flow, Filters, City Distribution, Daily Performance
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AdminPageHeader, { PAGE_GRADIENTS } from '../../src/components/admin/AdminPageHeader';
import AdminSearchBar from '../../src/components/admin/AdminSearchBar';
import {
    ADMIN_COLORS,
    ADMIN_SHADOWS,
    BORDER_RADIUS,
    TYPOGRAPHY
} from '../../src/constants/adminDesignTokens';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
    ORDER_STATUS_CONFIG,
    formatOrderId,
    getAllOrders,
    getDailyPerformance,
    getOrdersByCity,
    getWhatsAppLink,
    updateOrderStatus,
    subscribeToOrders,
    getOrderStats
} from '../../src/services/adminOrderService';
import { getAllProducts } from '../../src/services/adminProductService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

// STATUS_FILTERS moved inside component for localization

export default function AdminOrders() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(theme, isDark);

    const STATUS_FILTERS = [
        { id: 'all', label: t('all') },
        { id: 'pending', label: t('pending') },
        { id: 'confirmed', label: t('confirmed') },
        { id: 'processing', label: t('processing') },
        { id: 'shipped', label: t('shipped') },
        { id: 'out_for_delivery', label: t('out_for_delivery') },
        { id: 'delivered', label: t('delivered') },
        { id: 'cancelled', label: t('cancelled') },
    ];

    const [orders, setOrders] = useState([]);
    const [dashboardData, setDashboardData] = useState({
        cityDistribution: [],
        dailyPerformance: [],
        loading: true
    });
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        shipping: 0,
        completed: 0,
    });
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showStats, setShowStats] = useState(true);
    const [productsMap, setProductsMap] = useState({});
    const [limitCount, setLimitCount] = useState(50);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setDashboardData(prev => ({ ...prev, loading: true }));

            const [cityData, performanceData, allProducts, summaryStats] = await Promise.all([
                getOrdersByCity(),
                getDailyPerformance(),
                getAllProducts({ limitCount: 100 }),
                getOrderStats(),
            ]);

            // Build products map for fast lookup
            const pMap = {};
            allProducts.forEach(p => {
                pMap[p.id] = p;
            });
            setProductsMap(pMap);
            setStats(summaryStats);

            setDashboardData({
                cityDistribution: cityData,
                dailyPerformance: performanceData,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Alert.alert(t('error'), t('failedToLoadData'));
        } finally {
            setRefreshing(false);
            setDashboardData(prev => ({ ...prev, loading: false }));
        }
    }, [t]);

    useEffect(() => {
        fetchData();
        
        // Setup real-time subscription for orders
        const unsubscribe = subscribeToOrders({ limitCount }, (data) => {
            setOrders(data.orders || []);
            setIsLoadingMore(false);
            setRefreshing(false);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fetchData, limitCount]);

    const handleLoadMore = () => {
        if (!isLoadingMore && orders.length >= limitCount) {
            setIsLoadingMore(true);
            setLimitCount(prev => prev + 50);
        }
    };

    const onRefresh = () => fetchData(true);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            fetchData();
            Alert.alert(t('success'), t('orderStatusUpdated'));
        } catch (error) {
            Alert.alert(t('error'), t('failedToUpdateStatus'));
        }
    };

    const handleWhatsApp = (phone, orderId) => {
        const message = t('whatsappOrderMsg', { id: formatOrderId(orderId) });
        const url = getWhatsAppLink(phone, message);
        Linking.openURL(url);
    };



    const filteredOrders = orders.filter(order => {
        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            (order.orderNumber?.toLowerCase() || '').includes(searchLower) ||
            order.id.toLowerCase().includes(searchLower) ||
            order.customerName?.toLowerCase().includes(searchLower) ||
            order.customerPhone?.includes(searchLower);
        return matchesStatus && matchesSearch;
    });

    const renderOrder = ({ item }) => {
        const statusConfig = ORDER_STATUS_CONFIG[item.status] || ORDER_STATUS_CONFIG.pending;

        return (
            <TouchableOpacity
                style={[styles.orderCard, { backgroundColor: theme.backgroundCard }]}
                onPress={() => router.push(`/admin/order/${item.id}`)}
            >
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={[styles.orderId, { color: theme.text }]}>
                            {item.orderNumber || formatOrderId(item.id)}
                        </Text>
                        <Text style={[styles.orderDate, { color: theme.textMuted }]}>
                            {getTimeAgo(item.createdAt, t)}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                        <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.customerInfo}>
                    {item.customerImage ? (
                        <Image source={{ uri: item.customerImage }} style={styles.customerAvatar} />
                    ) : (
                        <View style={styles.customerAvatarPlaceholder}>
                            <Ionicons name="person" size={20} color={theme.primary} />
                        </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.customerName, { color: theme.text }]}>
                            {item.customerName || t('anonymousCustomer')}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="call-outline" size={12} color={theme.textSecondary} style={{ marginLeft: 4 }} />
                            <Text style={[styles.customerSub, { color: theme.textSecondary, marginRight: 8 }]}>
                                {item.customerPhone}
                            </Text>
                            {item.shippingCity ? (
                                <>
                                    <Ionicons name="location-outline" size={12} color={theme.textSecondary} style={{ marginLeft: 4 }} />
                                    <Text style={[styles.customerSub, { color: theme.textSecondary }]}>
                                        {item.shippingCity}
                                    </Text>
                                </>
                            ) : null}
                        </View>
                    </View>
                </View>

                <View style={styles.productPreview}>
                    {item.items?.slice(0, 2).map((prod, idx) => (
                        <View key={idx} style={styles.productThumbRow}>
                            <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
                                {prod.name || t('item')}
                            </Text>
                            <Text style={[styles.productPrice, { color: theme.textSecondary }]}>
                                x{prod.quantity}
                            </Text>
                        </View>
                    ))}
                    {item.items?.length > 2 && (
                        <Text style={[styles.moreItemsText, { color: theme.primary }]}>
                            {t('moreProducts', { count: item.items.length - 2 })}
                        </Text>
                    )}
                </View>

                <View style={styles.orderFooter}>
                    <View style={styles.orderMeta}>
                        <Text style={[styles.metaText, { color: theme.textMuted }]}>{t('total')}:</Text>
                        <Text style={[styles.orderTotal, { color: theme.primary }]}>
                            {currencyService.formatAdminPrice(item.total)}
                        </Text>
                    </View>
                    <View style={styles.orderActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#25D36620' }]}
                            onPress={() => handleWhatsApp(item.customerPhone, item.id)}
                        >
                            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderStatsSection = () => {
        const { cityDistribution, dailyPerformance } = dashboardData;
        const maxCityCount = Math.max(...cityDistribution.map(c => c.count), 1);
        const maxDailyOrders = Math.max(...dailyPerformance.map(d => d.orders), 1);
        const weeklyTotalOrders = dailyPerformance.reduce((sum, d) => sum + (d.orders || 0), 0);
        const weeklyTotalRevenue = dailyPerformance.reduce((sum, d) => sum + (d.revenue || 0), 0);

        return (
            <View collapsable={false} style={styles.statsSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.quickStats}>
                        <View style={[styles.quickStatCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                            <Text style={[styles.quickStatValue, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900] }]}>{stats.total}</Text>
                            <Text style={[styles.quickStatLabel, { color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600] }]}>{t('total')}</Text>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: ADMIN_COLORS.warning.light + '20' }]}>
                            <Ionicons name="time" size={20} color={ADMIN_COLORS.warning.main} style={{ marginBottom: 6 }} />
                            <Text style={[styles.quickStatValue, { color: ADMIN_COLORS.warning.main }]}>{stats.pending}</Text>
                            <Text style={[styles.quickStatLabel, { color: ADMIN_COLORS.warning.dark }]}>{t('pending')}</Text>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: ADMIN_COLORS.info.light + '20' }]}>
                            <Ionicons name="construct" size={20} color={ADMIN_COLORS.info.main} style={{ marginBottom: 6 }} />
                            <Text style={[styles.quickStatValue, { color: ADMIN_COLORS.info.main }]}>{stats.processing}</Text>
                            <Text style={[styles.quickStatLabel, { color: ADMIN_COLORS.info.dark }]}>{t('processing')}</Text>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: ADMIN_COLORS.accent.light + '20' }]}>
                            <Ionicons name="airplane" size={20} color={ADMIN_COLORS.accent.main} style={{ marginBottom: 6 }} />
                            <Text style={[styles.quickStatValue, { color: ADMIN_COLORS.accent.main }]}>{stats.shipping}</Text>
                            <Text style={[styles.quickStatLabel, { color: ADMIN_COLORS.accent.dark }]}>{t('shipped')}</Text>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: ADMIN_COLORS.success.light + '20' }]}>
                            <Ionicons name="checkmark-done-circle" size={20} color={ADMIN_COLORS.success.main} style={{ marginBottom: 6 }} />
                            <Text style={[styles.quickStatValue, { color: ADMIN_COLORS.success.main }]}>{stats.completed}</Text>
                            <Text style={[styles.quickStatLabel, { color: ADMIN_COLORS.success.dark }]}>{t('delivered')}</Text>
                        </View>
                    </View>
                </ScrollView>

                <View collapsable={false} style={[styles.chartCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                    <View style={styles.chartHeader}>
                        <View style={[styles.iconBadge, { backgroundColor: ADMIN_COLORS.secondary.light + '20' }]}>
                            <Ionicons name="location" size={18} color={ADMIN_COLORS.secondary.main} />
                        </View>
                        <Text style={[styles.chartTitle, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900], marginLeft: 8 }]}>{t('cityDistribution')}</Text>
                    </View>
                    {cityDistribution.length > 0 ? cityDistribution.map((city, index) => (
                        <View key={city.id || index} style={styles.cityRow}>
                            <Text style={[styles.cityName, { color: theme.text }]}>{city.name}</Text>
                            <View style={styles.cityBarContainer}>
                                <View
                                    style={[
                                        styles.cityBar,
                                        {
                                            width: `${(city.count / maxCityCount) * 100}%`,
                                            backgroundColor: theme.primary,
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[styles.cityCount, { color: theme.textSecondary }]}>{city.count}</Text>
                        </View>
                    )) : (
                        <Text style={[styles.noDataText, { color: theme.textMuted }]}>{t('noOrdersYet')}</Text>
                    )}
                </View>

                <View collapsable={false} style={[styles.chartCard, { backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#FFFFFF' }]}>
                    <View style={styles.chartHeader}>
                        <View style={[styles.iconBadge, { backgroundColor: ADMIN_COLORS.primary.light + '20' }]}>
                            <Ionicons name="trending-up" size={18} color={ADMIN_COLORS.primary.main} />
                        </View>
                        <Text style={[styles.chartTitle, { color: isDark ? '#FFF' : ADMIN_COLORS.neutral[900], marginLeft: 8 }]}>{t('dailyPerformance')}</Text>
                    </View>
                    <View style={styles.performanceChart}>
                        {dailyPerformance.length > 0 ? dailyPerformance.map((day, index) => (
                            <View key={index} style={styles.performanceBar}>
                                <View style={styles.barWrapper}>
                                    <LinearGradient
                                        colors={[theme.primary, theme.primaryDark]}
                                        style={[
                                            styles.bar,
                                            { height: `${(day.orders / maxDailyOrders) * 100}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{day.day}</Text>
                            </View>
                        )) : (
                            <Text style={[styles.noDataText, { color: theme.textMuted }]}>{t('noData')}</Text>
                        )}
                    </View>
                    <View style={styles.performanceSummary}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: theme.text }]}>
                                {weeklyTotalOrders}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t('ordersThisWeek')}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: theme.primary }]}>
                                {currencyService.formatAdminPrice(weeklyTotalRevenue)}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t('weeklyRevenue')}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderStatsHeader = () => {
        return (
            <View collapsable={false}>
                {showStats ? renderStatsSection() : null}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <AdminPageHeader
                title={t('orderCenter')}
                gradient={PAGE_GRADIENTS.orders}
                onBack={() => router.back()}
                rightIcon={showStats ? 'stats-chart' : 'stats-chart-outline'}
                onRightPress={() => setShowStats(!showStats)}
            />

            <AdminSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('searchOrdersPlaceholder')}
            />

            <View style={{ height: 50 }}>
                <FlatList
                    horizontal
                    data={STATUS_FILTERS}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                    renderItem={({ item }) => {
                        const count = item.id === 'all'
                            ? orders.length
                            : orders.filter(o => o.status === item.id).length;
                        const statusColor = ORDER_STATUS_CONFIG[item.id]?.color || theme.primary;

                        return (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedStatus === item.id
                                            ? (item.id === 'all' ? theme.primary : statusColor)
                                            : theme.backgroundCard,
                                    }
                                ]}
                                onPress={() => setSelectedStatus(item.id)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: selectedStatus === item.id ? '#fff' : theme.text }
                                ]}>
                                    {item.label}
                                </Text>
                                {count > 0 && (
                                    <View style={[
                                        styles.filterBadge,
                                        { backgroundColor: selectedStatus === item.id ? 'rgba(255,255,255,0.3)' : theme.border }
                                    ]}>
                                        <Text style={[
                                            styles.filterBadgeText,
                                            { color: selectedStatus === item.id ? '#fff' : theme.textSecondary }
                                        ]}>
                                            {count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrder}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: theme.textSecondary }}>{t('loadingData')}...</Text>
                        </View>
                    ) : null
                }
                ListHeaderComponent={renderStatsHeader}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            {t('noResults')}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const getTimeAgo = (dateString, t) => {
    if (!dateString) return t('longTimeAgo');
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('now');
    if (diffMins < 60) return t('minsAgo', { count: diffMins });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    return t('daysAgo', { count: diffDays });
};

const getStyles = (theme, isDark) => StyleSheet.create({
    filtersContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        ...ADMIN_SHADOWS.sm,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    filterBadge: {
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statsSection: {
        padding: 16,
    },
    quickStats: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    quickStatCard: {
        width: 100,
        padding: 12,
        borderRadius: 16,
        marginRight: 12,
        alignItems: 'center',
    },
    quickStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    quickStatLabel: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartCard: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    cityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cityName: {
        width: 80,
        fontSize: 12,
    },
    cityBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    cityBar: {
        height: '100%',
        borderRadius: 4,
    },
    cityCount: {
        width: 30,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    performanceChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 150,
        paddingTop: 20,
        marginBottom: 16,
    },
    performanceBar: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        height: 100,
        width: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        borderRadius: 6,
    },
    barLabel: {
        fontSize: 10,
        marginTop: 8,
    },
    performanceSummary: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 16,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    summaryLabel: {
        fontSize: 10,
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    orderCard: {
        padding: 16,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: 12,
        ...ADMIN_SHADOWS.md,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderId: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    orderDate: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.md,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
        fontFamily: TYPOGRAPHY.fontFamily,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    customerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    customerAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerName: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    customerSub: {
        fontSize: 12,
        textAlign: 'left',
    },
    customerPhone: {
        display: 'none', // Deprecated in favor of detailed view
    },
    productsSummary: {
        marginBottom: 16,
    },
    productItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    productImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    productThumb: {
        width: '100%',
        height: '100%',
    },
    productName: {
        fontSize: 13,
        fontWeight: '500',
    },
    productPrice: {
        fontSize: 11,
    },
    moreItemsText: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    orderMeta: {
        flex: 1,
    },
    metaText: {
        fontSize: 11,
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    },
    orderActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
    noDataText: {
        textAlign: 'center',
        paddingVertical: 20,
        fontSize: 13,
    },
});
