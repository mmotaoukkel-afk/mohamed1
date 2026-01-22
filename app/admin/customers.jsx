/**
 * Admin Customers - Kataraa
 * Customer Intelligence Center
 * 🔐 Protected by RequireAdmin
 * Features: Profiles, Segmentation, Scoring, AI Recommendations, Purchase History
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ScrollView,
    Modal,
    Dimensions,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import {
    SEGMENT_CONFIG,
    calculateSegment,
    calculateCustomerScore,
    getCustomerLTV,
    formatJoinDate,
    getAllCustomers,
    getCustomerStats,
    getAIRecommendations,
} from '../../src/services/adminCustomerService';

const { width } = Dimensions.get('window');

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

    const fetchData = async () => {
        try {
            setLoading(true);
            const [customersData, statsData] = await Promise.all([
                getAllCustomers({ limitCount: 100 }),
                getCustomerStats(),
            ]);

            // Enrich with LTV if needed (already done in service partially, making sure)
            const enrichedCustomers = customersData.map(c => ({
                ...c,
                ltv: getCustomerLTV(c),
            }));

            setCustomers(enrichedCustomers);
            setStats(prev => ({
                ...prev,
                total: statsData.total,
                vip: statsData.vip,
                returning: statsData.returning,
                new: statsData.new,
                atRisk: statsData.atRisk,
                avgScore: statsData.avgScore,
            }));
        } catch (error) {
            console.error('Error fetching customers:', error);
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

    const getAvatarColor = (segment) => {
        return SEGMENT_CONFIG[segment]?.color || theme.primary;
    };

    const getScoreColor = (score) => {
        if (score >= 70) return '#10B981';
        if (score >= 40) return '#F59E0B';
        return '#EF4444';
    };

    const renderCustomer = ({ item }) => {
        const segmentConfig = SEGMENT_CONFIG[item.segment];

        return (
            <TouchableOpacity
                style={[styles.customerCard, { backgroundColor: theme.backgroundCard }]}
                onPress={() => openProfile(item)}
                activeOpacity={0.7}
            >
                {/* Avatar & Info */}
                <View style={styles.customerMain}>
                    <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.segment) }]}>
                        {item.photoURL ? (
                            <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                        )}
                    </View>

                    <View style={styles.customerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
                            {item.segment === 'vip' && (
                                <View style={styles.vipBadge}>
                                    <Ionicons name="star" size={10} color="#F59E0B" />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.customerEmail, { color: theme.textMuted }]}>{item.email}</Text>
                        <View style={styles.customerMeta}>
                            <View style={[styles.segmentBadge, { backgroundColor: segmentConfig.color + '20' }]}>
                                <Ionicons name={segmentConfig.icon} size={10} color={segmentConfig.color} />
                                <Text style={[styles.segmentText, { color: segmentConfig.color }]}>
                                    {segmentConfig.label}
                                </Text>
                            </View>
                            <Text style={[styles.cityText, { color: theme.textSecondary }]}>
                                📍 {item.city}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.customerStats}>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: theme.text }]}>{item.orderCount}</Text>
                        <Text style={[styles.statLabel, { color: theme.textMuted }]}>طلبات</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: theme.primary }]}>{item.totalSpent}</Text>
                        <Text style={[styles.statLabel, { color: theme.textMuted }]}>MAD</Text>
                    </View>
                    <View style={styles.scoreBox}>
                        <View style={[styles.scoreCircle, { borderColor: getScoreColor(item.score) }]}>
                            <Text style={[styles.scoreValue, { color: getScoreColor(item.score) }]}>
                                {item.score}
                            </Text>
                        </View>
                        <Text style={[styles.statLabel, { color: theme.textMuted }]}>نقاط</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderProfileModal = () => {
        if (!selectedCustomer) return null;

        const segmentConfig = SEGMENT_CONFIG[selectedCustomer.segment];

        return (
            <Modal
                visible={showProfile}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowProfile(false)}
            >
                <View style={[styles.profileContainer, { backgroundColor: theme.background }]}>
                    {/* Profile Header */}
                    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.profileHeader}>
                        <SafeAreaView edges={['top']}>
                            <View style={styles.profileHeaderRow}>
                                <TouchableOpacity onPress={() => setShowProfile(false)}>
                                    <Ionicons name="close" size={28} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.profileHeaderTitle}>ملف الزبون</Text>
                                <TouchableOpacity>
                                    <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* Profile Info */}
                            <View style={styles.profileInfo}>
                                <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    {selectedCustomer.photoURL ? (
                                        <Image source={{ uri: selectedCustomer.photoURL }} style={styles.profileAvatarImage} />
                                    ) : (
                                        <Text style={styles.profileAvatarText}>
                                            {getInitials(selectedCustomer.name)}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.profileName}>{selectedCustomer.name}</Text>
                                <View style={[styles.profileSegment, { backgroundColor: segmentConfig.color }]}>
                                    <Ionicons name={segmentConfig.icon} size={12} color="#fff" />
                                    <Text style={styles.profileSegmentText}>{segmentConfig.label}</Text>
                                </View>
                            </View>

                            {/* Score Ring */}
                            <View style={styles.scoreRing}>
                                <View style={[styles.scoreRingInner, { borderColor: getScoreColor(selectedCustomer.score) }]}>
                                    <Text style={[styles.scoreRingValue, { color: '#fff' }]}>
                                        {selectedCustomer.score}
                                    </Text>
                                    <Text style={styles.scoreRingLabel}>نقاط</Text>
                                </View>
                            </View>
                        </SafeAreaView>
                    </LinearGradient>

                    <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
                        {/* Contact Info */}
                        <View style={[styles.profileSection, { backgroundColor: theme.backgroundCard }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>معلومات الاتصال</Text>
                            <View style={styles.contactRow}>
                                <Ionicons name="mail-outline" size={18} color={theme.textSecondary} />
                                <Text style={[styles.contactText, { color: theme.text }]}>{selectedCustomer.email}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Ionicons name="call-outline" size={18} color={theme.textSecondary} />
                                <Text style={[styles.contactText, { color: theme.text }]}>{selectedCustomer.phone}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
                                <Text style={[styles.contactText, { color: theme.text }]}>{selectedCustomer.city}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                                <Text style={[styles.contactText, { color: theme.text }]}>
                                    انضم في {formatJoinDate(selectedCustomer.createdAt)}
                                </Text>
                            </View>
                        </View>

                        {/* LTV Stats */}
                        <View style={[styles.profileSection, { backgroundColor: theme.backgroundCard }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>القيمة الدائمة (LTV)</Text>
                            <View style={styles.ltvGrid}>
                                <View style={styles.ltvItem}>
                                    <Text style={[styles.ltvValue, { color: theme.primary }]}>
                                        {selectedCustomer.ltv.totalSpent} MAD
                                    </Text>
                                    <Text style={[styles.ltvLabel, { color: theme.textSecondary }]}>إجمالي الإنفاق</Text>
                                </View>
                                <View style={styles.ltvItem}>
                                    <Text style={[styles.ltvValue, { color: theme.text }]}>
                                        {selectedCustomer.ltv.avgOrderValue} MAD
                                    </Text>
                                    <Text style={[styles.ltvLabel, { color: theme.textSecondary }]}>متوسط الطلب</Text>
                                </View>
                                <View style={styles.ltvItem}>
                                    <Text style={[styles.ltvValue, { color: '#10B981' }]}>
                                        {selectedCustomer.ltv.projectedAnnualValue} MAD
                                    </Text>
                                    <Text style={[styles.ltvLabel, { color: theme.textSecondary }]}>القيمة السنوية</Text>
                                </View>
                            </View>
                        </View>

                        {/* Purchase History */}
                        <View style={[styles.profileSection, { backgroundColor: theme.backgroundCard }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>سجل المشتريات</Text>
                            {selectedCustomer.purchaseHistory?.length > 0 ? (
                                selectedCustomer.purchaseHistory.map((purchase, index) => (
                                    <View key={index} style={styles.purchaseRow}>
                                        <View style={[styles.purchaseIcon, { backgroundColor: theme.primary + '20' }]}>
                                            <Ionicons name="bag-outline" size={16} color={theme.primary} />
                                        </View>
                                        <View style={styles.purchaseInfo}>
                                            <Text style={[styles.purchaseName, { color: theme.text }]}>
                                                {purchase.name}
                                            </Text>
                                            <Text style={[styles.purchaseDate, { color: theme.textMuted }]}>
                                                {new Date(purchase.date).toLocaleDateString('ar-MA')}
                                            </Text>
                                        </View>
                                        <Text style={[styles.purchaseAmount, { color: theme.primary }]}>
                                            {purchase.amount} MAD
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={[styles.emptyHistory, { color: theme.textMuted }]}>
                                    لا توجد مشتريات حتى الآن
                                </Text>
                            )}
                        </View>

                        {/* AI Recommendations */}
                        <View style={[styles.profileSection, { backgroundColor: theme.backgroundCard }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                                    توصيات ذكية
                                </Text>
                            </View>
                            {(selectedCustomer.recommendations || AI_RECOMMENDATIONS_FALLBACK).map((rec, index) => (
                                <View key={index} style={styles.recommendationRow}>
                                    <View style={[styles.recIcon, { backgroundColor: '#8B5CF620' }]}>
                                        <Ionicons name="gift-outline" size={16} color="#8B5CF6" />
                                    </View>
                                    <View style={styles.recInfo}>
                                        <Text style={[styles.recName, { color: theme.text }]}>{rec.name}</Text>
                                        <Text style={[styles.recReason, { color: theme.textMuted }]}>{rec.reason}</Text>
                                    </View>
                                    <Text style={[styles.recPrice, { color: theme.primary }]}>{rec.price} MAD</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.bottomPadding} />
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderStatsHeader = () => (
        <View style={styles.statsHeader}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: theme.backgroundCard }]}>
                        <Ionicons name="people" size={20} color={theme.primary} />
                        <Text style={[styles.statCardValue, { color: theme.text }]}>{stats.total}</Text>
                        <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>إجمالي</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#F59E0B20' }]}>
                        <Ionicons name="star" size={20} color="#F59E0B" />
                        <Text style={[styles.statCardValue, { color: '#F59E0B' }]}>{stats.vip}</Text>
                        <Text style={[styles.statCardLabel, { color: '#F59E0B' }]}>VIP</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#10B98120' }]}>
                        <Ionicons name="refresh" size={20} color="#10B981" />
                        <Text style={[styles.statCardValue, { color: '#10B981' }]}>{stats.returning}</Text>
                        <Text style={[styles.statCardLabel, { color: '#10B981' }]}>عائد</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#3B82F620' }]}>
                        <Ionicons name="person-add" size={20} color="#3B82F6" />
                        <Text style={[styles.statCardValue, { color: '#3B82F6' }]}>{stats.new}</Text>
                        <Text style={[styles.statCardLabel, { color: '#3B82F6' }]}>جديد</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#EF444420' }]}>
                        <Ionicons name="warning" size={20} color="#EF4444" />
                        <Text style={[styles.statCardValue, { color: '#EF4444' }]}>{stats.atRisk}</Text>
                        <Text style={[styles.statCardLabel, { color: '#EF4444' }]}>في خطر</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Avg Score */}
            <View style={[styles.avgScoreCard, { backgroundColor: theme.backgroundCard }]}>
                <Text style={[styles.avgScoreLabel, { color: theme.textSecondary }]}>متوسط النقاط</Text>
                <View style={styles.avgScoreRow}>
                    <View style={[styles.avgScoreBar, { backgroundColor: theme.border }]}>
                        <View
                            style={[
                                styles.avgScoreFill,
                                { width: `${stats.avgScore}%`, backgroundColor: getScoreColor(stats.avgScore) }
                            ]}
                        />
                    </View>
                    <Text style={[styles.avgScoreValue, { color: getScoreColor(stats.avgScore) }]}>
                        {stats.avgScore}
                    </Text>
                </View>
            </View>
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
                        <Text style={styles.headerTitle}>ذكاء الزبناء</Text>
                        <TouchableOpacity style={styles.exportBtn}>
                            <Ionicons name="download-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, { backgroundColor: theme.backgroundCard }]}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="البحث بالاسم أو البريد أو الهاتف..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Segment Filters */}
            <FlatList
                horizontal
                data={SEGMENT_FILTERS}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
                renderItem={({ item }) => {
                    const count = item.id === 'all'
                        ? customers.length
                        : customers.filter(c => c.segment === item.id).length;
                    const segmentColor = SEGMENT_CONFIG[item.id]?.color || theme.primary;

                    return (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: selectedSegment === item.id
                                        ? (item.id === 'all' ? theme.primary : segmentColor)
                                        : theme.backgroundCard,
                                }
                            ]}
                            onPress={() => setSelectedSegment(item.id)}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: selectedSegment === item.id ? '#fff' : theme.text }
                            ]}>
                                {item.label}
                            </Text>
                            {count > 0 && (
                                <View style={[
                                    styles.filterBadge,
                                    { backgroundColor: selectedSegment === item.id ? 'rgba(255,255,255,0.3)' : theme.border }
                                ]}>
                                    <Text style={[
                                        styles.filterBadgeText,
                                        { color: selectedSegment === item.id ? '#fff' : theme.textSecondary }
                                    ]}>
                                        {count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Customers List */}
            <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={renderCustomer}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                ListHeaderComponent={renderStatsHeader}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            لا يوجد زبناء
                        </Text>
                    </View>
                }
            />

            {/* Profile Modal */}
            {renderProfileModal()}
        </View>
    );
}

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
    exportBtn: {
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
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: theme.backgroundCard,
        borderWidth: 1,
        borderColor: theme.border,
        height: 38,
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
        paddingTop: 0,
    },
    statsHeader: {
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statCardLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    avgScoreCard: {
        padding: 16,
        borderRadius: 12,
    },
    avgScoreLabel: {
        fontSize: 13,
        marginBottom: 8,
    },
    avgScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avgScoreBar: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    avgScoreFill: {
        height: '100%',
        borderRadius: 4,
    },
    avgScoreValue: {
        fontSize: 18,
        fontWeight: 'bold',
        minWidth: 30,
    },
    customerCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    customerMain: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    customerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
    },
    vipBadge: {
        backgroundColor: '#F59E0B20',
        padding: 4,
        borderRadius: 10,
    },
    customerEmail: {
        fontSize: 13,
        marginTop: 2,
    },
    customerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 10,
    },
    segmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    segmentText: {
        fontSize: 10,
        fontWeight: '600',
    },
    cityText: {
        fontSize: 11,
    },
    customerStats: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingTop: 12,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    scoreBox: {
        flex: 1,
        alignItems: 'center',
    },
    scoreCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
    // Profile Modal Styles
    profileContainer: {
        flex: 1,
    },
    profileHeader: {
        paddingBottom: 30,
    },
    profileHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    profileHeaderTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 20,
    },
    profileAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileAvatarImage: {
        width: '100%',
        height: '100%',
    },
    profileAvatarText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    profileName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 12,
    },
    profileSegment: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 8,
        gap: 4,
    },
    profileSegmentText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    scoreRing: {
        alignItems: 'center',
        marginTop: 16,
    },
    scoreRingInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    scoreRingValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scoreRingLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
    },
    profileContent: {
        flex: 1,
        marginTop: -15,
    },
    profileSection: {
        margin: 16,
        marginBottom: 0,
        padding: 16,
        borderRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    contactText: {
        fontSize: 14,
    },
    ltvGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    ltvItem: {
        alignItems: 'center',
    },
    ltvValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    ltvLabel: {
        fontSize: 11,
        marginTop: 4,
    },
    purchaseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    purchaseIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    purchaseInfo: {
        flex: 1,
        marginLeft: 12,
    },
    purchaseName: {
        fontSize: 14,
        fontWeight: '500',
    },
    purchaseDate: {
        fontSize: 12,
        marginTop: 2,
    },
    purchaseAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyHistory: {
        textAlign: 'center',
        paddingVertical: 20,
    },
    recommendationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    recIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recInfo: {
        flex: 1,
        marginLeft: 12,
    },
    recName: {
        fontSize: 14,
        fontWeight: '500',
    },
    recReason: {
        fontSize: 11,
        marginTop: 2,
    },
    recPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    bottomPadding: {
        height: 40,
    },
});
