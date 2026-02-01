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
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import {
    ORDER_STATUS_CONFIG,
    formatOrderId,
    getAllOrders,
    getDailyPerformance,
    getOrdersByCity,
    getWhatsAppLink,
    updateOrderStatus
} from '../../src/services/adminOrderService';
import { getAllProducts } from '../../src/services/adminProductService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

const STATUS_FILTERS = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'في الانتظار' },
    { id: 'confirmed', label: 'مؤكد' },
    { id: 'processing', label: 'قيد التجهيز' },
    { id: 'shipped', label: 'تم الشحن' },
    { id: 'out_for_delivery', label: 'جارٍ التوصيل' },
    { id: 'delivered', label: 'تم التوصيل' },
    { id: 'cancelled', label: 'ملغي' },
];

export default function AdminOrders() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

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

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setDashboardData(prev => ({ ...prev, loading: true }));

            const [ordersData, cityData, performanceData, allProducts] = await Promise.all([
                getAllOrders({ limitCount: 200 }),
                getOrdersByCity(),
                getDailyPerformance(),
                getAllProducts({ limitCount: 500 }),
            ]);

            // Build products map for fast lookup
            const pMap = {};
            allProducts.forEach(p => {
                pMap[p.id] = p;
            });
            setProductsMap(pMap);

            // Calculate quick stats
            const newStats = {
                total: ordersData.length,
                pending: ordersData.filter(o => o.status === 'pending').length,
                processing: ordersData.filter(o => o.status === 'processing').length,
                shipping: ordersData.filter(o => o.status === 'shipped').length,
                completed: ordersData.filter(o => o.status === 'delivered').length,
            };

            setStats(newStats);
            setOrders(ordersData);
            setDashboardData({
                cityDistribution: cityData,
                dailyPerformance: performanceData,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching orders data:', error);
            Alert.alert('خطأ', 'فشل تحميل بيانات الطلبات');
        } finally {
            setRefreshing(false);
            setDashboardData(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => fetchData(true);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            fetchData();
            Alert.alert('نجاح', 'تم تحديث حالة الطلب');
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحديث الحالة');
        }
    };

    const handleWhatsApp = (phone, orderId) => {
        const message = `مرحباً، بخصوص طلبك رقم ${formatOrderId(orderId)} من Kataraa...`;
        const url = getWhatsAppLink(phone, message);
        Linking.openURL(url);
    };

    const handleExportCSV = () => {
        console.log('Exporting orders to CSV...');
        Alert.alert('تصدير البيانات', 'سيتم تنزيل ملف CSV يحتوي على جميع الطلبات قريباً.');
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
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
                        <Text style={[styles.orderId, { color: theme.text }]}>{formatOrderId(item.id)}</Text>
                        <Text style={[styles.orderDate, { color: theme.textMuted }]}>
                            {getTimeAgo(item.createdAt)}
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
                            {item.customerName || 'زبون مجهول'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="call-outline" size={12} color={theme.textSecondary} style={{ marginLeft: 4 }} />
                            <Text style={[styles.customerSub, { color: theme.textSecondary, marginRight: 8 }]}>
                                {item.customerPhone}
                            </Text>
                            {item.shippingCity ? (
                                <>
                                    <View style={{ width: 1, height: 12, backgroundColor: theme.border, marginHorizontal: 8 }} />
                                    <Ionicons name="location-outline" size={12} color={theme.textSecondary} style={{ marginLeft: 4 }} />
                                    <Text style={[styles.customerSub, { color: theme.textSecondary }]}>
                                        {item.shippingCity}
                                    </Text>
                                </>
                            ) : null}
                        </View>
                    </View>
                </View>

                <View style={styles.productsSummary}>
                    {item.items?.slice(0, 2).map((product, idx) => {
                        const productDetails = productsMap[product.id];
                        return (
                            <View key={idx} style={styles.productItemRow}>
                                <View style={[styles.productImageContainer, { backgroundColor: theme.border }]}>
                                    {productDetails?.images?.[0] ? (
                                        <Image source={{ uri: productDetails.images[0] }} style={styles.productThumb} />
                                    ) : (
                                        <Ionicons name="image-outline" size={20} color={theme.textMuted} />
                                    )}
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
                                        {productDetails?.name || product.name || 'منتج'}
                                    </Text>
                                    <Text style={[styles.productPrice, { color: theme.textSecondary }]}>
                                        {product.quantity} × {currencyService.formatAdminPrice(product.price)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                    {item.items?.length > 2 && (
                        <Text style={[styles.moreItemsText, { color: theme.primary }]}>
                            + {item.items.length - 2} منتجات أخرى
                        </Text>
                    )}
                </View>

                <View style={styles.orderFooter}>
                    <View style={styles.orderMeta}>
                        <Text style={[styles.metaText, { color: theme.textMuted }]}>الإجمالي:</Text>
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
                        <View style={[styles.quickStatCard, { backgroundColor: theme.backgroundCard }]}>
                            <Text style={[styles.quickStatValue, { color: theme.text }]}>{stats.total}</Text>
                            <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>إجمالي</Text>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: '#F59E0B20' }]}>
                            <Text style={[styles.quickStatValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
                            <Text style={[styles.quickStatLabel, { color: '#F59E0B' }]}>في الانتظار</Text>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: '#8B5CF620' }]}>
                            <Text style={[styles.quickStatValue, { color: '#8B5CF6' }]}>{stats.processing}</Text>
                            <Text style={[styles.quickStatLabel, { color: '#8B5CF6' }]}>قيد التجهيز</Text>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: '#0EA5E920' }]}>
                            <Text style={[styles.quickStatValue, { color: '#0EA5E9' }]}>{stats.shipping}</Text>
                            <Text style={[styles.quickStatLabel, { color: '#0EA5E9' }]}>في الشحن</Text>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: '#10B98120' }]}>
                            <Text style={[styles.quickStatValue, { color: '#10B981' }]}>{stats.completed}</Text>
                            <Text style={[styles.quickStatLabel, { color: '#10B981' }]}>مكتمل</Text>
                        </View>
                    </View>
                </ScrollView>

                <View collapsable={false} style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.chartHeader}>
                        <Ionicons name="location" size={18} color={theme.primary} />
                        <Text style={[styles.chartTitle, { color: theme.text }]}>توزيع المدن</Text>
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
                        <Text style={[styles.noDataText, { color: theme.textMuted }]}>لا توجد طلبات بعد</Text>
                    )}
                </View>

                <View collapsable={false} style={[styles.chartCard, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.chartHeader}>
                        <Ionicons name="trending-up" size={18} color={theme.primary} />
                        <Text style={[styles.chartTitle, { color: theme.text }]}>الأداء اليومي</Text>
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
                            <Text style={[styles.noDataText, { color: theme.textMuted }]}>لا توجد بيانات</Text>
                        )}
                    </View>
                    <View style={styles.performanceSummary}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: theme.text }]}>
                                {weeklyTotalOrders}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>طلب هذا الأسبوع</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: theme.primary }]}>
                                {currencyService.formatAdminPrice(weeklyTotalRevenue)}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>إيرادات الأسبوع</Text>
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
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>مركز الطلبات</Text>
                        <TouchableOpacity
                            style={styles.statsToggleBtn}
                            onPress={handleExportCSV}
                        >
                            <Ionicons name="download-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.statsToggleBtn}
                            onPress={() => setShowStats(!showStats)}
                        >
                            <Ionicons name={showStats ? "stats-chart" : "stats-chart-outline"} size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, { backgroundColor: theme.backgroundCard }]}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="البحث برقم الطلب أو اسم الزبون..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

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
                ListHeaderComponent={renderStatsHeader}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            لا توجد طلبات
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const getTimeAgo = (dateString) => {
    if (!dateString) return 'منذ وقت طويل';
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
};

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statsToggleBtn: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginLeft: 8,
    },
    searchContainer: {
        padding: 16,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 50,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        textAlign: 'right',
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
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
        borderRadius: 20,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
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
