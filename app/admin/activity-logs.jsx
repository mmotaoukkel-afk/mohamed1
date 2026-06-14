/**
 * Activity Logs - Kataraa Admin
 * 📋 View all admin operations audit trail
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AdminPageHeader from '../../src/components/admin/AdminPageHeader';
import {
    ADMIN_COLORS,
    ADMIN_SHADOWS,
    BORDER_RADIUS
} from '../../src/constants/adminDesignTokens';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
    getActivityLogs,
    LOG_ACTION_ICONS,
    LOG_ACTION_LABELS,
    LOG_ACTIONS
} from '../../src/services/activityLogService';

// Filter categories
const FILTER_OPTIONS = [
    { id: 'all', label: 'الكل', icon: 'list' },
    { id: 'products', label: 'المنتجات', icon: 'cube' },
    { id: 'orders', label: 'الطلبات', icon: 'receipt' },
    { id: 'coupons', label: 'الكوبونات', icon: 'pricetag' },
    { id: 'shipping', label: 'الشحن', icon: 'airplane' },
];

// Map filter to action prefixes
const FILTER_MAP = {
    products: ['product_'],
    orders: ['order_'],
    coupons: ['coupon_'],
    shipping: ['shipping_'],
};

export default function ActivityLogsScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(theme, isDark);

    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    const loadLogs = useCallback(async () => {
        try {
            const data = await getActivityLogs({ limitCount: 100 });
            setLogs(data);
            applyFilter(activeFilter, data);
        } catch (error) {
            console.error('Error loading activity logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const applyFilter = (filterId, data = logs) => {
        setActiveFilter(filterId);
        if (filterId === 'all') {
            setFilteredLogs(data);
            return;
        }
        const prefixes = FILTER_MAP[filterId] || [];
        setFilteredLogs(data.filter(log =>
            prefixes.some(prefix => log.action?.startsWith(prefix))
        ));
    };

    const formatTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        return date.toLocaleDateString('ar');
    };

    const getDetailText = (log) => {
        const d = log.details || {};
        if (d.productName) return d.productName;
        if (d.couponCode) return d.couponCode;
        if (d.zoneName) return d.zoneName;
        if (d.orderId) return `طلب #${String(d.orderId).substring(0, 8)}`;
        if (d.newStatus) return d.newStatus;
        return '';
    };

    const renderLog = ({ item }) => {
        const iconConfig = LOG_ACTION_ICONS[item.action] || { icon: 'ellipse', color: '#94A3B8' };
        const label = LOG_ACTION_LABELS[item.action] || item.action;
        const detail = getDetailText(item);

        return (
            <View style={styles.card}>
                {/* Icon */}
                <View style={[styles.iconCircle, { backgroundColor: iconConfig.color + '18' }]}>
                    <Ionicons name={iconConfig.icon} size={20} color={iconConfig.color} />
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    <Text style={styles.actionLabel}>{label}</Text>
                    {detail ? (
                        <Text style={styles.detailText} numberOfLines={1}>{detail}</Text>
                    ) : null}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                            {item.displayName || item.email?.split('@')[0] || 'Admin'}
                        </Text>
                        <View style={styles.dot} />
                        <Text style={styles.metaText}>{formatTime(item.timestamp)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <AdminPageHeader
                title="سجل العمليات"
                gradient={['#64748B', '#475569']}
                onBack={() => router.back()}
                rightIcon="refresh"
                onRightPress={() => { setRefreshing(true); loadLogs(); }}
            />

            {/* Filter Chips */}
            <View style={styles.filterRow}>
                {FILTER_OPTIONS.map(filter => (
                    <TouchableOpacity
                        key={filter.id}
                        style={[
                            styles.filterChip,
                            activeFilter === filter.id && styles.filterChipActive,
                        ]}
                        onPress={() => applyFilter(filter.id)}
                    >
                        <Ionicons
                            name={filter.icon}
                            size={14}
                            color={activeFilter === filter.id ? '#fff' : (isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600])}
                        />
                        <Text style={[
                            styles.filterText,
                            activeFilter === filter.id && styles.filterTextActive,
                        ]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logs List */}
            <FlatList
                data={filteredLogs}
                keyExtractor={item => item.id}
                renderItem={renderLog}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadLogs(); }}
                        tintColor={theme.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons
                            name="document-text-outline"
                            size={48}
                            color={isDark ? ADMIN_COLORS.neutral[600] : ADMIN_COLORS.neutral[300]}
                        />
                        <Text style={styles.emptyText}>
                            {loading ? 'جاري التحميل...' : 'لا توجد عمليات مسجلة بعد'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            ستظهر هنا جميع العمليات التي يقوم بها الأدمن
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[900] : ADMIN_COLORS.neutral[50],
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        borderWidth: 1,
        borderColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[200],
    },
    filterChipActive: {
        backgroundColor: ADMIN_COLORS.primary.main,
        borderColor: ADMIN_COLORS.primary.main,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600],
    },
    filterTextActive: {
        color: '#fff',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: 10,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.sm,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    cardContent: {
        flex: 1,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: isDark ? '#fff' : ADMIN_COLORS.neutral[900],
        textAlign: 'right',
        marginBottom: 2,
    },
    detailText: {
        fontSize: 13,
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600],
        textAlign: 'right',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 11,
        color: isDark ? ADMIN_COLORS.neutral[500] : ADMIN_COLORS.neutral[400],
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[600] : ADMIN_COLORS.neutral[300],
    },
    empty: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[500],
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 13,
        color: isDark ? ADMIN_COLORS.neutral[600] : ADMIN_COLORS.neutral[400],
        marginTop: 6,
        textAlign: 'center',
    },
});
