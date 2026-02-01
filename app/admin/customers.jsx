/**
 * Admin Customers - Kataraa
 * Customer Intelligence Center
 * 🔐 Protected by RequireAdmin
 * Features: Profiles, Segmentation, Scoring, AI Recommendations, Purchase History
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
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import {
    SEGMENT_CONFIG,
    getAllCustomers,
    getCustomerLTV,
    getCustomerStats
} from '../../src/services/adminCustomerService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 12;
const ITEM_WIDTH = (width - 32 - GAP) / COLUMN_COUNT;

// Mock AI recommendations (fallback if no real data)
const AI_RECOMMENDATIONS_FALLBACK = [
    { id: '1', name: 'سيروم ريتينول', price: 280, reason: 'بناءً على مشترياتك السابقة', category: 'skincare' },
    { id: '2', name: 'زيت الأرغان', price: 190, reason: 'الأكثر مبيعاً', category: 'haircare' },
    { id: '3', name: 'ماسك الكولاجين', price: 160, reason: 'منتج جديد', category: 'skincare' },
];

const SEGMENT_FILTERS = [
    { id: 'all', label: 'الكل' },
    { id: 'vip', label: 'VIP' },
    { id: 'returning', label: 'عائد' },
    { id: 'new', label: 'جديد' },
    { id: 'at_risk', label: 'في خطر' },
    { id: 'inactive', label: 'غير نشط' },
];

export default function AdminCustomers() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        vip: 0,
        returning: 0,
        new: 0,
        atRisk: 0,
        avgScore: 0,
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [customersData, statsData] = await Promise.all([
                getAllCustomers({ limitCount: 100 }),
                getCustomerStats(),
            ]);

            // Enrich with LTV if needed
            const enrichedCustomers = customersData.map(c => ({
                ...c,
                ltv: c.ltv || getCustomerLTV(c),
            }));

            setCustomers(enrichedCustomers);
            setStats({
                total: statsData.total || 0,
                vip: statsData.vip || 0,
                returning: statsData.returning || 0,
                new: statsData.new || 0,
                atRisk: statsData.atRisk || 0,
                avgScore: statsData.avgScore || 0,
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            Alert.alert('خطأ', 'فشل تحميل بيانات الزبناء');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    // Filter customers
    const filteredCustomers = customers.filter(c => {
        const matchesSegment = selectedSegment === 'all' || c.segment === selectedSegment;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            (c.name && c.name.toLowerCase().includes(searchLower)) ||
            (c.email && c.email.toLowerCase().includes(searchLower)) ||
            (c.phone && c.phone.includes(searchQuery));
        return matchesSegment && matchesSearch;
    });

    const openProfile = (customer) => {
        // Generate recommendations on the fly if not present
        const customerWithRecs = {
            ...customer,
            recommendations: customer.recommendations || AI_RECOMMENDATIONS_FALLBACK,
            purchaseHistory: customer.purchaseHistory || []
        };
        setSelectedCustomer(customerWithRecs);
        setShowProfile(true);
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getScoreColor = (score) => {
        if (score >= 70) return '#10B981';
        if (score >= 40) return '#F59E0B';
        return '#EF4444';
    };

    const renderCustomerCard = ({ item }) => {
        const segmentConfig = SEGMENT_CONFIG[item.segment] || SEGMENT_CONFIG.new;

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.backgroundCard }]}
                onPress={() => openProfile(item)}
                activeOpacity={0.8}
            >
                {/* Header Badge */}
                <View style={[styles.cardBadge, { backgroundColor: segmentConfig.color + '20' }]}>
                    <Text style={[styles.cardBadgeText, { color: segmentConfig.color }]}>{segmentConfig.label}</Text>
                </View>

                {/* Avatar */}
                <View style={styles.cardAvatarContainer}>
                    {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.cardAvatar} />
                    ) : (
                        <View style={[styles.cardAvatarPlaceholder, { backgroundColor: segmentConfig.color }]}>
                            <Text style={styles.cardAvatarText}>{getInitials(item.name)}</Text>
                        </View>
                    )}
                    {item.segment === 'vip' && (
                        <View style={styles.vipStar}>
                            <Ionicons name="star" size={12} color="#fff" />
                        </View>
                    )}
                </View>

                {/* Info */}
                <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
                    {item.name || 'زبون مجهول'}
                </Text>
                <Text style={[styles.cardCity, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.city || 'غير محدد'}
                </Text>

                {/* Metrics */}
                <View style={styles.cardMetrics}>
                    <View style={styles.metricItem}>
                        <Text style={[styles.metricValue, { color: theme.primary }]}>{item.orderCount || 0}</Text>
                        <Text style={[styles.metricLabel, { color: theme.textMuted }]}>طلبات</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                        <Text style={[styles.metricValue, { color: '#10B981' }]}>
                            {currencyService.formatAdminPrice(item.totalSpent || 0).replace('MAD', '')}
                        </Text>
                        <Text style={[styles.metricLabel, { color: theme.textMuted }]}>LTV</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#25D36620' }]}
                        onPress={() => {
                            const phone = (item.phone || '').replace(/\D/g, '');
                            Linking.openURL(`whatsapp://send?phone=${phone}`);
                        }}
                    >
                        <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.primary + '20' }]}
                        onPress={() => Linking.openURL(`tel:${item.phone}`)}
                    >
                        <Ionicons name="call" size={18} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderProfileModal = () => {
        if (!selectedCustomer) return null;

        const segmentConfig = SEGMENT_CONFIG[selectedCustomer.segment] || SEGMENT_CONFIG.new;
        const ltv = selectedCustomer.ltv || { totalSpent: 0, avgOrderValue: 0, projectedAnnualValue: 0 };

        return (
            <Modal
                visible={showProfile}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowProfile(false)}
            >
                <View style={[styles.profileContainer, { backgroundColor: theme.background }]}>
                    {/* Simplified Profile Header */}
                    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.profileHeader}>
                        <SafeAreaView edges={['top']}>
                            <View style={styles.profileHeaderRow}>
                                <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.profileHeaderTitle}>ملف الزبون</Text>
                                <View style={{ width: 40 }} />
                            </View>

                            <View style={styles.profileHero}>
                                <View style={styles.profileAvatarLarge}>
                                    {selectedCustomer.photoURL ? (
                                        <Image source={{ uri: selectedCustomer.photoURL }} style={styles.profileAvatarImage} />
                                    ) : (
                                        <Text style={styles.profileAvatarTextLarge}>{getInitials(selectedCustomer.name)}</Text>
                                    )}
                                </View>
                                <Text style={styles.profileName}>{selectedCustomer.name}</Text>
                                <View style={[styles.profileTag, { backgroundColor: segmentConfig.color }]}>
                                    <Ionicons name={segmentConfig.icon} size={12} color="#fff" />
                                    <Text style={styles.profileTagText}>{segmentConfig.label}</Text>
                                </View>
                            </View>
                        </SafeAreaView>
                    </LinearGradient>

                    <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
                        {/* 3 Key Stats Grid */}
                        <View style={[styles.statsGrid, { backgroundColor: theme.backgroundCard }]}>
                            <View style={styles.gridStat}>
                                <Text style={[styles.gridValue, { color: theme.primary }]}>{ltv.totalSpent} dh</Text>
                                <Text style={styles.gridLabel}>مجموع الشراء</Text>
                            </View>
                            <View style={[styles.gridSeparator, { backgroundColor: theme.border }]} />
                            <View style={styles.gridStat}>
                                <Text style={[styles.gridValue, { color: '#F59E0B' }]}>{selectedCustomer.orderCount}</Text>
                                <Text style={styles.gridLabel}>عدد الطلبات</Text>
                            </View>
                            <View style={[styles.gridSeparator, { backgroundColor: theme.border }]} />
                            <View style={styles.gridStat}>
                                <Text style={[styles.gridValue, { color: getScoreColor(selectedCustomer.score) }]}>{selectedCustomer.score}</Text>
                                <Text style={styles.gridLabel}>نقاط الجودة</Text>
                            </View>
                        </View>

                        {/* Contact Info */}
                        <View style={[styles.sectionBox, { backgroundColor: theme.backgroundCard }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>معلومات التواصل</Text>
                            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${selectedCustomer.phone}`)}>
                                <View style={[styles.contactIcon, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="call" size={18} color={theme.primary} />
                                </View>
                                <Text style={[styles.contactText, { color: theme.text }]}>{selectedCustomer.phone}</Text>
                            </TouchableOpacity>
                            <View style={styles.contactRow}>
                                <View style={[styles.contactIcon, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="mail" size={18} color={theme.primary} />
                                </View>
                                <Text style={[styles.contactText, { color: theme.text }]}>{selectedCustomer.email}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <View style={[styles.contactIcon, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="location" size={18} color={theme.primary} />
                                </View>
                                <Text style={[styles.contactText, { color: theme.text }]}>{selectedCustomer.city || 'المدينة غير محددة'}</Text>
                            </View>
                        </View>

                        {/* AI Recommendations */}
                        <View style={[styles.sectionBox, { backgroundColor: theme.backgroundCard }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, marginLeft: 8 }]}>يُنصح باقتراحه</Text>
                            </View>
                            {(selectedCustomer.recommendations || AI_RECOMMENDATIONS_FALLBACK).map((rec, idx) => (
                                <View key={idx} style={styles.recItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.recName, { color: theme.text }]}>{rec.name}</Text>
                                        <Text style={[styles.recReason, { color: theme.textMuted }]}>{rec.reason}</Text>
                                    </View>
                                    <Text style={[styles.recPrice, { color: theme.primary }]}>{rec.price} DH</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderHeader = () => (
        <View style={styles.metricsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                <View style={[styles.miniStat, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.miniStatValue, { color: theme.text }]}>{stats.total}</Text>
                    <Text style={styles.miniStatLabel}>إجمالي</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: '#F59E0B15' }]}>
                    <Text style={[styles.miniStatValue, { color: '#F59E0B' }]}>{stats.vip}</Text>
                    <Text style={styles.miniStatLabel}>VIP</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: '#10B98115' }]}>
                    <Text style={[styles.miniStatValue, { color: '#10B981' }]}>{stats.returning}</Text>
                    <Text style={styles.miniStatLabel}>عائد</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: '#3B82F615' }]}>
                    <Text style={[styles.miniStatValue, { color: '#3B82F6' }]}>{stats.new}</Text>
                    <Text style={styles.miniStatLabel}>جديد</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: '#EF444415' }]}>
                    <Text style={[styles.miniStatValue, { color: '#EF4444' }]}>{stats.atRisk}</Text>
                    <Text style={styles.miniStatLabel}>خامل</Text>
                </View>
            </ScrollView>
        </View>
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
                        <Text style={styles.headerTitle}>الزبناء</Text>
                        <TouchableOpacity style={styles.exportBtn}>
                            <Ionicons name="download-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar Embedded in Header */}
                    <View style={styles.searchContainer}>
                        <View style={[styles.osSearch, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <Ionicons name="search" size={20} color="#fff" />
                            <TextInput
                                style={styles.osInput}
                                placeholder="ابحث عن زبون..."
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={{ flex: 1 }}>
                {renderHeader()}

                {/* Segments */}
                <View style={styles.segmentScroll}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {SEGMENT_FILTERS.map((item) => {
                            const isSelected = selectedSegment === item.id;
                            const color = SEGMENT_CONFIG[item.id]?.color || theme.primary;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.segmentChip,
                                        { backgroundColor: isSelected ? color : theme.backgroundCard, borderWidth: isSelected ? 0 : 1, borderColor: theme.border }
                                    ]}
                                    onPress={() => setSelectedSegment(item.id)}
                                >
                                    <Text style={[styles.segmentChipText, { color: isSelected ? '#fff' : theme.text }]}>{item.label}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                {/* Grid List */}
                <FlatList
                    data={filteredCustomers}
                    renderItem={renderCustomerCard}
                    keyExtractor={item => item.id}
                    numColumns={COLUMN_COUNT}
                    columnWrapperStyle={{ gap: GAP, paddingHorizontal: 16 }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                لا يوجد نتائج
                            </Text>
                        </View>
                    }
                />
            </View>

            {renderProfileModal()}
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    exportBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    searchContainer: { paddingHorizontal: 16 },
    osSearch: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 12, paddingHorizontal: 12 },
    osInput: { flex: 1, color: '#fff', marginLeft: 10, textAlign: 'right', fontSize: 14, fontWeight: '500' },

    metricsWrapper: { marginTop: 16, marginBottom: 12 },
    miniStat: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, alignItems: 'center', minWidth: 80 },
    miniStatValue: { fontSize: 16, fontWeight: 'bold' },
    miniStatLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },

    segmentScroll: { marginBottom: 12 },
    segmentChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
    segmentChipText: { fontSize: 13, fontWeight: '600' },

    // Grid Card Styles
    card: { width: ITEM_WIDTH, borderRadius: 16, padding: 12, paddingBottom: 16, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    cardBadgeText: { fontSize: 10, fontWeight: 'bold' },

    cardAvatarContainer: { marginTop: 8, marginBottom: 10, position: 'relative' },
    cardAvatar: { width: 64, height: 64, borderRadius: 32 },
    cardAvatarPlaceholder: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    cardAvatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    vipStar: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#F59E0B', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.backgroundCard },

    cardName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
    cardCity: { fontSize: 11, textAlign: 'center', marginBottom: 12 },

    cardMetrics: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
    metricItem: { alignItems: 'center', flex: 1 },
    metricDivider: { width: 1, backgroundColor: theme.border },
    metricValue: { fontSize: 13, fontWeight: 'bold' },
    metricLabel: { fontSize: 10 },

    cardActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    // Profile Modal
    profileContainer: { flex: 1 },
    profileHeader: { paddingBottom: 24 },
    profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    profileHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },

    profileHero: { alignItems: 'center' },
    profileAvatarLarge: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)' },
    profileAvatarImage: { width: '100%', height: '100%', borderRadius: 50 },
    profileAvatarTextLarge: { color: '#fff', fontSize: 40, fontWeight: 'bold', textAlign: 'center', lineHeight: 90 },
    profileName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    profileTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    profileTagText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    profileContent: { flex: 1, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.background, paddingHorizontal: 16, paddingTop: 24 },

    statsGrid: { flexDirection: 'row', padding: 20, borderRadius: 20, marginBottom: 20, alignItems: 'center' },
    gridStat: { flex: 1, alignItems: 'center' },
    gridSeparator: { width: 1, height: 30 },
    gridValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    gridLabel: { fontSize: 11, color: theme.textSecondary },

    sectionBox: { padding: 16, borderRadius: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    contactIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    contactText: { fontSize: 14 },

    recItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    recName: { fontSize: 14, fontWeight: '600' },
    recReason: { fontSize: 11, marginTop: 2 },
    recPrice: { fontSize: 14, fontWeight: 'bold' },

    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16 },
});
