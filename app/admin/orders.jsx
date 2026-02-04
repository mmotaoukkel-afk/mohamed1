/**
 * Admin Orders - Kataraa
 * Enhanced order management control center
 * 🔐 Protected by RequireAdmin
 * Features: Status Flow, Filters, City Distribution, Daily Performance
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    RefreshControl,
    ScrollView,
    Platform,
    ActivityIndicator,
    Image,
    Linking,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import {
    ORDER_STATUS_CONFIG,
    MOROCCAN_CITIES,
    formatOrderId,
    getStatusFlow,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getOrdersByCity,
    getDailyPerformance,
} from '../../src/services/adminOrderService';
import { getAllProducts } from '../../src/services/adminProductService';
import currencyService from '../../src/services/currencyService';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import Surface from '../../src/components/ui/Surface';

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
    const [cityDistribution, setCityDistribution] = useState([]);
    const [dailyPerformance, setDailyPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showStats, setShowStats] = useState(true);
    const [productsMap, setProductsMap] = useState({});

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersData, cityData, performanceData, allProducts] = await Promise.all([
                getAllOrders({ limitCount: 100 }),
                getOrdersByCity(),
                getDailyPerformance(),
                getAllProducts({ limitCount: 500 }), // Increased limit for lookup
            ]);

            // Create lookup map
            const pMap = {};
            allProducts.forEach(p => {
                pMap[p.id] = p;
            });
            setProductsMap(pMap);
            console.log('📦 Loaded products for lookup:', Object.keys(pMap).length);

            setOrders(ordersData);
            setCityDistribution(cityData);
            setDailyPerformance(performanceData);
        } catch (error) {
            console.error('Error fetching orders data:', error);
            Alert.alert('خطأ', 'فشل تحميل بيانات الطلبات');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    // Filter orders
    const filteredOrders = orders.filter(o => {
        const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            (o.id && o.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (o.email && o.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())); // Note: assuming customerName exists
        return matchesStatus && matchesSearch;
    });

    // Stats calculation
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
        shipping: orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'delivered').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? (o.total || 0) : 0), 0),
    };

    const handleStatusUpdate = (orderId, currentStatus) => {
        const config = ORDER_STATUS_CONFIG[currentStatus];
        if (!config?.nextStatus) {
            Alert.alert('تنبيه', 'هذا الطلب في مرحلته النهائية');
            return;
        }

        const nextConfig = ORDER_STATUS_CONFIG[config.nextStatus];

        Alert.alert(
            'تحديث حالة الطلب',
            `تغيير الحالة إلى "${nextConfig.label}"؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'تأكيد',
                    onPress: async () => {
                        try {
                            await updateOrderStatus(orderId, config.nextStatus);
                            // Optimistic update or refresh
                            setOrders(prev => prev.map(o =>
                                o.id === orderId ? { ...o, status: config.nextStatus } : o
                            ));
                            Alert.alert('تم التحديث', `تم تغيير الحالة إلى "${nextConfig.label}"`);
                        } catch (error) {
                            console.error('Update failed:', error);
                            Alert.alert('خطأ', 'فشل تحديث الحالة');
                        }
                    }
                }
            ]
        );
    };

    const handleCancelOrder = (orderId, customerName) => {
        const order = orders.find(o => o.id === orderId);
        const config = ORDER_STATUS_CONFIG[order?.status];

        if (!config?.canCancel) {
            Alert.alert('تنبيه', 'لا يمكن إلغاء هذا الطلب في حالته الحالية');
            return;
        }

        Alert.alert(
            'إلغاء الطلب',
            `هل أنت متأكد من إلغاء طلب ${customerName}؟`,
            [
                { text: 'لا', style: 'cancel' },
                {
                    text: 'إلغاء الطلب',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelOrder(orderId, 'Deleted by admin');
                            setOrders(prev => prev.map(o =>
                                o.id === orderId ? { ...o, status: 'cancelled' } : o
                            ));
                        } catch (error) {
                            console.error('Cancel failed:', error);
                            Alert.alert('خطأ', 'فشل إلغاء الطلب');
                        }
                    }
                }
            ]
        );
    };

    const getCityName = (cityId) => {
        const city = MOROCCAN_CITIES.find(c => c.id === cityId);
        return city?.name || cityId;
    };

    const renderStatusTimeline = (currentStatus) => {
        const flow = getStatusFlow(currentStatus);
        const visibleSteps = flow.slice(0, 6); // Exclude cancelled/refunded

        return (
            <View style={styles.timeline}>
                {visibleSteps.map((step, index) => (
                    <View key={step.status} style={styles.timelineStep}>
                        <View style={[
                            styles.timelineDot,
                            {
                                backgroundColor: step.isCompleted || step.isCurrent
                                    ? step.color
                                    : theme.border
                            }
                        ]}>
                            {(step.isCompleted || step.isCurrent) && (
                                <Ionicons
                                    name={step.isCompleted ? "checkmark" : step.icon}
                                    size={10}
                                    color="#fff"
                                />
                            )}
                        </View>
                        {index < visibleSteps.length - 1 && (
                            <View style={[
                                styles.timelineLine,
                                { backgroundColor: step.isCompleted ? step.color : theme.border }
                            ]} />
                        )}
                    </View>
                ))}
            </View>
        );
    };

    const renderOrder = ({ item }) => {
        const statusConfig = ORDER_STATUS_CONFIG[item.status];
        const timeAgo = getTimeAgo(item.createdAt);
        const customer = item.customer || {};
        const shipping = item.shipping_info || item.billing || {};

        // Polymorphic field mapping for backward compatibility
        const rawItems = item.line_items || item.items || [];
        const items = rawItems.map(li => {
            const prodId = li.product_id || li.id;
            const lookup = productsMap[prodId] || {};
            return {
                ...li,
                name: li.name || lookup.name || 'منتج غير معروف',
                image: li.image || lookup.images?.[0]?.src || (typeof lookup.images?.[0] === 'string' ? lookup.images[0] : null),
                price: li.price || lookup.sale_price || lookup.price || 0
            };
        });

        return (
            <Animated.View
                entering={FadeInDown.duration(600)}
                layout={Layout.springify()}
            >
                <Surface variant="glass" padding="none" style={styles.orderCardGlass}>
                    {/* Header */}
                    <View style={[styles.orderHeader, { borderBottomWidth: 1, borderBottomColor: theme.border, padding: 12 }]}>
                        <View>
                            <Text style={[styles.orderId, { color: theme.primary }]}>
                                {formatOrderId(item.id)}
                            </Text>
                            <Text style={[styles.orderTime, { color: theme.textMuted }]}>
                                {timeAgo}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                            </Text>
                        </View>
                    </View>

                    {/* Customer Profile Section */}
                    <View style={styles.customerProfileRow}>
                        <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '15' }]}>
                            {customer.photoURL ? (
                                <Image source={{ uri: customer.photoURL }} style={styles.customerAvatar} />
                            ) : (
                                <View style={styles.initialsContainer}>
                                    <Text style={[styles.initialsText, { color: theme.primary }]}>
                                        {(customer.displayName || shipping.first_name || item.customerName || 'Z')?.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.customerFullName, { color: theme.text }]}>{customer.displayName || shipping.first_name || item.customerName || item.customer || 'زبون'}</Text>
                            <Text style={[styles.customerEmail, { color: theme.textMuted }]}>{customer.email || item.email || 'guest@kataraa.com'}</Text>
                            <TouchableOpacity
                                style={styles.phoneLink}
                                onPress={() => Linking.openURL(`tel:${shipping.phone}`)}
                            >
                                <Ionicons name="call" size={14} color={theme.primary} />
                                <Text style={[styles.phoneText, { color: theme.primary }]}>{shipping.phone}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Shipping Location Details */}
                    <View style={[styles.locationCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
                        <View style={styles.locationHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                <Ionicons name="location" size={16} color={theme.primary} />
                                <Text style={[styles.locationTitle, { color: theme.textSecondary }]}>عنوان التوصيل:</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.mapBtn}
                                onPress={() => {
                                    const query = encodeURIComponent(`${shipping.city || ''} ${shipping.street || ''} ${shipping.address_1 || ''}`);
                                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                                }}
                            >
                                <Ionicons name="map-outline" size={16} color={theme.primary} />
                                <Text style={[styles.mapBtnText, { color: theme.primary }]}>الخريطة</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.fullAddress, { color: theme.text }]}>
                            {shipping.city || item.city || 'غ/م'} - {shipping.state || shipping.governorate || 'غ/م'}
                        </Text>
                        <Text style={[styles.addressDetails, { color: theme.textSecondary }]}>
                            القطعة: {shipping.block || 'غ/م'} | الشارع: {shipping.street || shipping.address_1 || 'غ/م'}
                        </Text>
                        {(shipping.building || shipping.floor || shipping.apartment) && (
                            <Text style={[styles.addressDetails, { color: theme.textSecondary }]}>
                                بناية: {shipping.building || '-'} | دور: {shipping.floor || '-'} | شقة: {shipping.apartment || '-'}
                            </Text>
                        )}
                        {shipping.notes && (
                            <View style={styles.notesContainer}>
                                <Text style={[styles.notesLabel, { color: theme.error }]}>ملاحظات:</Text>
                                <Text style={[styles.notesText, { color: theme.text }]}>{shipping.notes}</Text>
                            </View>
                        )}
                    </View>

                    {/* Product List Section */}
                    <View style={styles.productsSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="list" size={16} color={theme.textSecondary} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>المنتجات ({items.length}):</Text>
                        </View>
                        {items.map((prod, idx) => (
                            <View key={idx} style={styles.productItemRow}>
                                <View style={[styles.productImageContainer, { backgroundColor: isDark ? theme.background : '#F1F5F9' }]}>
                                    {prod.image ? (
                                        <Image source={{ uri: prod.image }} style={styles.productThumb} />
                                    ) : (
                                        <Ionicons name="image-outline" size={20} color={theme.textMuted} />
                                    )}
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{prod.name || 'منتج غير معروف'}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={[styles.productPrice, { color: theme.primary }]}>{currencyService.formatAdminPrice(prod.price)}</Text>
                                        <View style={[styles.qtyBadge, { backgroundColor: theme.primary + '15' }]}>
                                            <Text style={[styles.qtyText, { color: theme.primary }]}>x{prod.quantity}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Footer and Actions */}
                    <View style={[styles.orderFooter, { borderTopWidth: 1, borderTopColor: theme.border, padding: 12 }]}>
                        <View style={styles.orderMeta}>
                            <Text style={[styles.metaText, { color: theme.textSecondary }]}>الإجمالي:</Text>
                            <Text style={[styles.orderTotal, { color: theme.text }]}>
                                {currencyService.formatAdminPrice(item.total)}
                            </Text>
                        </View>

                        <View style={styles.orderActions}>
                            {statusConfig.nextStatus && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: statusConfig.color }]}
                                    onPress={() => handleStatusUpdate(item.id, item.status)}
                                >
                                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 6 }}>
                                        {ORDER_STATUS_CONFIG[statusConfig.nextStatus].label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {statusConfig.canCancel && (
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { backgroundColor: '#EF444415' }]}
                                    onPress={() => handleCancelOrder(item.id, customer.displayName || shipping.first_name)}
                                >
                                    <Ionicons name="close" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Surface>
            </Animated.View>
        );
    };

    const renderStatsSection = () => (
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsSection}>
            {/* Quick Stats Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                <View style={styles.quickStats}>
                    <Surface variant="glass" padding="md" style={styles.quickStatCardGlass}>
                        <Text style={[styles.quickStatValue, { color: theme.text }]}>{stats.total}</Text>
                        <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>إجمالي</Text>
                    </Surface>
                    <Surface variant="glass" padding="md" style={[styles.quickStatCardGlass, { minWidth: 100 }]}>
                        <Text style={[styles.quickStatValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
                        <View style={[styles.miniBadge, { backgroundColor: '#F59E0B20' }]}>
                            <Text style={[styles.quickStatLabel, { color: '#F59E0B', fontSize: 10 }]}>في الانتظار</Text>
                        </View>
                    </Surface>
                    <Surface variant="glass" padding="md" style={[styles.quickStatCardGlass, { minWidth: 100 }]}>
                        <Text style={[styles.quickStatValue, { color: '#8B5CF6' }]}>{stats.processing}</Text>
                        <View style={[styles.miniBadge, { backgroundColor: '#8B5CF620' }]}>
                            <Text style={[styles.quickStatLabel, { color: '#8B5CF6', fontSize: 10 }]}>قيد التجهيز</Text>
                        </View>
                    </Surface>
                    <Surface variant="glass" padding="md" style={[styles.quickStatCardGlass, { minWidth: 100 }]}>
                        <Text style={[styles.quickStatValue, { color: '#0EA5E9' }]}>{stats.shipping}</Text>
                        <View style={[styles.miniBadge, { backgroundColor: '#0EA5E920' }]}>
                            <Text style={[styles.quickStatLabel, { color: '#0EA5E9', fontSize: 10 }]}>في الشحن</Text>
                        </View>
                    </Surface>
                    <Surface variant="glass" padding="md" style={[styles.quickStatCardGlass, { minWidth: 100 }]}>
                        <Text style={[styles.quickStatValue, { color: '#10B981' }]}>{stats.completed}</Text>
                        <View style={[styles.miniBadge, { backgroundColor: '#10B98120' }]}>
                            <Text style={[styles.quickStatLabel, { color: '#10B981', fontSize: 10 }]}>مكتمل</Text>
                        </View>
                    </Surface>
                </View>
            </ScrollView>

            {/* City Distribution */}
            <Surface variant="glass" style={styles.chartCardGlass} padding="md">
                <View style={styles.chartHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="location" size={16} color={theme.primary} />
                    </View>
                    <Text style={[styles.chartTitle, { color: theme.text }]}>توزيع المدن</Text>
                </View>
                {cityDistribution.length > 0 ? cityDistribution.map((city, index) => (
                    <View key={city.id || index} style={styles.cityRow}>
                        <Text style={[styles.cityName, { color: theme.text }]}>{city.name}</Text>
                        <View style={[styles.cityBarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                            <LinearGradient
                                colors={[theme.primary, theme.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[
                                    styles.cityBar,
                                    {
                                        width: `${cityDistribution.length > 0 ? (city.count / Math.max(...cityDistribution.map(c => c.count), 1)) * 100 : 0}%`,
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.cityCount, { color: theme.text }]}>{city.count}</Text>
                    </View>
                )) : (
                    <Text style={[styles.noDataText, { color: theme.textMuted }]}>لا توجد طلبات بعد</Text>
                )}
            </Surface>

            {/* Daily Performance */}
            <Surface variant="glass" style={styles.chartCardGlass} padding="md">
                <View style={styles.chartHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                        <Ionicons name="trending-up" size={16} color="#10B981" />
                    </View>
                    <Text style={[styles.chartTitle, { color: theme.text }]}>الأداء اليومي</Text>
                </View>
                <View style={styles.performanceChart}>
                    {dailyPerformance.length > 0 ? dailyPerformance.map((day, index) => (
                        <View key={index} style={styles.performanceBar}>
                            <View style={[styles.barWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                <LinearGradient
                                    colors={['#10B981', '#34D399']}
                                    style={[
                                        styles.bar,
                                        { height: `${dailyPerformance.length > 0 ? (day.orders / Math.max(...dailyPerformance.map(d => d.orders), 1)) * 100 : 0}%` }
                                    ]}
                                />
                            </View>
                            <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{day.day}</Text>
                        </View>
                    )) : (
                        <Text style={[styles.noDataText, { color: theme.textMuted }]}>لا توجد بيانات</Text>
                    )}
                </View>
                <View style={[styles.performanceSummary, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }]}>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: theme.text }]}>
                            {dailyPerformance.reduce((sum, d) => sum + (d.orders || 0), 0)}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>طلب هذا الأسبوع</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: theme.primary }]}>
                            {currencyService.formatAdminPrice(dailyPerformance.reduce((sum, d) => sum + (d.revenue || 0), 0))}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>إيرادات الأسبوع</Text>
                    </View>
                </View>
            </Surface>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>مركز الطلبات</Text>
                        <TouchableOpacity
                            style={styles.statsToggleBtn}
                            onPress={() => setShowStats(!showStats)}
                        >
                            <Ionicons name={showStats ? "stats-chart" : "stats-chart-outline"} size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Search */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.searchContainer}>
                <Surface variant="glass" padding="none" style={styles.searchBoxGlass}>
                    <Ionicons name="search" size={20} color={theme.textMuted} style={{ marginLeft: 16 }} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="البحث برقم الطلب أو اسم الزبون..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 16 }}>
                            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </Surface>
            </Animated.View>

            {/* Status Filters */}
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

            {/* Orders List with Stats Header */}
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrder}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                ListHeaderComponent={showStats ? renderStatsSection : null}
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

// Helper function for time ago
const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        padding: 16,
        paddingBottom: 8,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        textAlign: 'right',
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 10,
        minWidth: 80,
        height: 44,
        justifyContent: 'center',
        gap: 8,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
    },
    filterBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    filterBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingTop: 4,
    },
    statsSection: {
        marginBottom: 16,
    },
    quickStats: {
        flexDirection: 'row',
        gap: 10,
        paddingBottom: 16,
    },
    quickStatCard: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 80,
    },
    quickStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    quickStatLabel: {
        fontSize: 11,
        marginTop: 4,
    },
    chartCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    cityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    cityName: {
        width: 80,
        fontSize: 13,
    },
    cityBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: theme.border,
        borderRadius: 4,
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    cityBar: {
        height: '100%',
        borderRadius: 4,
    },
    cityCount: {
        width: 24,
        fontSize: 12,
        textAlign: 'right',
    },
    performanceChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        marginBottom: 16,
    },
    performanceBar: {
        flex: 1,
        alignItems: 'center',
    },
    barWrapper: {
        width: 20,
        height: 80,
        backgroundColor: theme.border,
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 10,
    },
    barLabel: {
        fontSize: 11,
        marginTop: 6,
    },
    performanceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    summaryLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    noDataText: {
        fontSize: 14,
        textAlign: 'center',
        flex: 1,
        paddingVertical: 30,
    },
    orderCardGlass: {
        marginBottom: 16,
        marginHorizontal: 16,
        borderRadius: 24,
        overflow: 'hidden',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    orderTime: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    timeline: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    timelineDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineLine: {
        flex: 1,
        height: 2,
        marginHorizontal: 2,
    },
    customerProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    initialsContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    customerAvatar: {
        width: '100%',
        height: '100%',
    },
    customerFullName: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    customerEmail: {
        fontSize: 12,
        marginBottom: 4,
    },
    phoneLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneText: {
        fontSize: 13,
        fontWeight: '500',
    },
    locationCard: {
        padding: 12,
        borderRadius: 16,
        marginHorizontal: 12,
        marginBottom: 12,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    locationTitle: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    mapBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    fullAddress: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    addressDetails: {
        fontSize: 12,
    },
    notesContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    notesLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    notesText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    productsSection: {
        gap: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
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
    qtyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    qtyText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderMeta: {
        flex: 1,
    },
    metaText: {
        fontSize: 11,
        fontWeight: '600',
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    orderActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        flexDirection: 'row',
        height: 40,
        paddingHorizontal: 12,
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
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    cancelBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickStatCardGlass: {
        borderRadius: 20,
        marginRight: 12,
        alignItems: 'center',
        minWidth: 90,
    },
    miniBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 6,
    },
    chartCardGlass: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBoxGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 16,
    },
});
