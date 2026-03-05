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
import {
    ADMIN_COLORS,
    ADMIN_GRADIENTS,
    ADMIN_SHADOWS,
    BORDER_RADIUS
} from '../../src/constants/adminDesignTokens';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
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

// Mock AI recommendations moved inside for easier localization if needed
const getAiFallback = (t) => [
    { id: '1', name: t('retinolSerum'), price: 280, reason: t('basedOnPreviousPurchases'), category: 'skincare' },
    { id: '2', name: t('arganOil'), price: 190, reason: t('bestSeller'), category: 'haircare' },
    { id: '3', name: t('collagenMask'), price: 160, reason: t('newProductLabel'), category: 'skincare' },
];

// SEGMENT_FILTERS moved inside component

export default function AdminCustomers() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(theme, isDark);

    const SEGMENT_FILTERS = [
        { id: 'all', label: t('all') },
        { id: 'vip', label: t('vip') },
        { id: 'returning', label: t('returning') },
        { id: 'new', label: t('new') },
        { id: 'at_risk', label: t('atRisk') },
        { id: 'inactive', label: t('inactive') },
    ];

    const AI_RECOMMENDATIONS_FALLBACK = getAiFallback(t);

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
            Alert.alert(t('error'), t('failedToLoadCustomers'));
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
                    {item.name || t('anonymousCustomer')}
                </Text>
                <Text style={[styles.cardCity, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.city || t('notSpecified')}
                </Text>

                {/* Metrics */}
                <View style={styles.cardMetrics}>
                    <View style={styles.metricItem}>
                        <Text style={[styles.metricValue, { color: theme.primary }]}>{item.orderCount || 0}</Text>
                        <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{t('orders')}</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                        <Text style={[styles.metricValue, { color: '#10B981' }]}>
                            {currencyService.formatAdminPrice(item.totalSpent || 0).replace(t('currency'), '')}
                        </Text>
                        <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{t('ltv')}</Text>
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
                    <LinearGradient colors={ADMIN_GRADIENTS.tech} style={styles.profileHeader}>
                        <SafeAreaView edges={['top']}>
                            <View style={styles.profileHeaderRow}>
                                <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.profileHeaderTitle}>{t('customerProfile')}</Text>
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
                                <Text style={[styles.gridValue, { color: theme.primary }]}>{ltv.totalSpent} {t('currency')}</Text>
                                <Text style={styles.gridLabel}>{t('totalSpent')}</Text>
                            </View>
                            <View style={[styles.gridSeparator, { backgroundColor: theme.border }]} />
                            <View style={styles.gridStat}>
                                <Text style={[styles.gridValue, { color: '#F59E0B' }]}>{selectedCustomer.orderCount}</Text>
                                <Text style={styles.gridLabel}>{t('orderCount')}</Text>
                            </View>
                            <View style={[styles.gridSeparator, { backgroundColor: theme.border }]} />
                            <View style={styles.gridStat}>
                                <Text style={[styles.gridValue, { color: getScoreColor(selectedCustomer.score) }]}>{selectedCustomer.score}</Text>
                                <Text style={styles.gridLabel}>{t('qualityPoints')}</Text>
                            </View>
                        </View>

                        {/* Contact Info */}
                        <View style={[styles.sectionBox, { backgroundColor: theme.backgroundCard }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('contactInfo')}</Text>
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
                                <Text style={[styles.contactText, { color: theme.text }]}>{selectedCustomer.city || t('cityNotSpecified')}</Text>
                            </View>
                        </View>

                        {/* AI Recommendations */}
                        <View style={[styles.sectionBox, { backgroundColor: theme.backgroundCard }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, marginLeft: 8 }]}>{t('aiRecommendations')}</Text>
                            </View>
                            {(selectedCustomer.recommendations || AI_RECOMMENDATIONS_FALLBACK).map((rec, idx) => (
                                <View key={idx} style={styles.recItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.recName, { color: theme.text }]}>{rec.name}</Text>
                                        <Text style={[styles.recReason, { color: theme.textMuted }]}>{rec.reason}</Text>
                                    </View>
                                    <Text style={[styles.recPrice, { color: theme.primary }]}>{rec.price} {t('currency')}</Text>
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
                <View style={[styles.miniStat, { backgroundColor: theme.backgroundCard, borderLeftWidth: 3, borderLeftColor: ADMIN_COLORS.primary.main }]}>
                    <View style={[styles.miniStatIcon, { backgroundColor: ADMIN_COLORS.primary.main + '15' }]}>
                        <Ionicons name="people" size={16} color={ADMIN_COLORS.primary.main} />
                    </View>
                    <Text style={[styles.miniStatValue, { color: ADMIN_COLORS.primary.main }]}>{stats.total}</Text>
                    <Text style={styles.miniStatLabel}>{t('total')}</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: theme.backgroundCard, borderLeftWidth: 3, borderLeftColor: ADMIN_COLORS.warning.main }]}>
                    <View style={[styles.miniStatIcon, { backgroundColor: ADMIN_COLORS.warning.main + '15' }]}>
                        <Ionicons name="star" size={16} color={ADMIN_COLORS.warning.main} />
                    </View>
                    <Text style={[styles.miniStatValue, { color: ADMIN_COLORS.warning.main }]}>{stats.vip}</Text>
                    <Text style={styles.miniStatLabel}>{t('vip')}</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: theme.backgroundCard, borderLeftWidth: 3, borderLeftColor: ADMIN_COLORS.success.main }]}>
                    <View style={[styles.miniStatIcon, { backgroundColor: ADMIN_COLORS.success.main + '15' }]}>
                        <Ionicons name="refresh" size={16} color={ADMIN_COLORS.success.main} />
                    </View>
                    <Text style={[styles.miniStatValue, { color: ADMIN_COLORS.success.main }]}>{stats.returning}</Text>
                    <Text style={styles.miniStatLabel}>{t('returning')}</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: theme.backgroundCard, borderLeftWidth: 3, borderLeftColor: ADMIN_COLORS.info.main }]}>
                    <View style={[styles.miniStatIcon, { backgroundColor: ADMIN_COLORS.info.main + '15' }]}>
                        <Ionicons name="person-add" size={16} color={ADMIN_COLORS.info.main} />
                    </View>
                    <Text style={[styles.miniStatValue, { color: ADMIN_COLORS.info.main }]}>{stats.new}</Text>
                    <Text style={styles.miniStatLabel}>{t('new')}</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: theme.backgroundCard, borderLeftWidth: 3, borderLeftColor: ADMIN_COLORS.error.main }]}>
                    <View style={[styles.miniStatIcon, { backgroundColor: ADMIN_COLORS.error.main + '15' }]}>
                        <Ionicons name="alert-circle" size={16} color={ADMIN_COLORS.error.main} />
                    </View>
                    <Text style={[styles.miniStatValue, { color: ADMIN_COLORS.error.main }]}>{stats.atRisk}</Text>
                    <Text style={styles.miniStatLabel}>{t('atRisk')}</Text>
                </View>
            </ScrollView>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient colors={ADMIN_GRADIENTS.tech} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('customers')}</Text>
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
                                placeholder={t('searchCustomerPlaceholder')}
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
                                {t('noResults')}
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
    container: {
        flex: 1,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[900] : ADMIN_COLORS.neutral[50],
    },
    header: {
        paddingBottom: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...ADMIN_SHADOWS.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
        paddingTop: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    exportBtn: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    osSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    osInput: {
        flex: 1,
        color: '#fff',
        marginRight: 10,
        textAlign: 'right',
        fontSize: 15,
    },
    metricsWrapper: {
        marginTop: -20,
        marginBottom: 20,
    },
    miniStat: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        marginRight: 12,
        alignItems: 'center',
        minWidth: 100,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.md,
    },
    miniStatIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    miniStatValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    miniStatLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[500],
        marginTop: 4,
    },
    segmentScroll: {
        marginBottom: 16,
    },
    segmentChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.full,
        marginRight: 10,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    segmentChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        width: ITEM_WIDTH,
        borderRadius: BORDER_RADIUS.xl,
        padding: 16,
        paddingBottom: 20,
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.md,
    },
    cardBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.md,
    },
    cardBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardAvatarContainer: {
        marginTop: 12,
        marginBottom: 12,
        position: 'relative',
    },
    cardAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: isDark ? ADMIN_COLORS.neutral[700] : '#fff',
    },
    cardAvatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: isDark ? ADMIN_COLORS.neutral[700] : '#fff',
    },
    cardAvatarText: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'bold',
    },
    vipStar: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: ADMIN_COLORS.warning.main,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
    },
    cardName: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    cardCity: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
    },
    cardMetrics: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        marginBottom: 16,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[900] : ADMIN_COLORS.neutral[50],
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: 8,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricDivider: {
        width: 1,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[200],
    },
    metricValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    metricLabel: {
        fontSize: 10,
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: {
        flex: 1,
    },
    profileHeader: {
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    profileHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        paddingTop: 10,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeaderTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    profileHero: {
        alignItems: 'center',
    },
    profileAvatarLarge: {
        width: 110,
        height: 110,
        borderRadius: 55,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    profileAvatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 55,
    },
    profileAvatarTextLarge: {
        color: '#fff',
        fontSize: 44,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 100,
    },
    profileName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    profileTag: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileTagText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    profileContent: {
        flex: 1,
        marginTop: -30,
        paddingHorizontal: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        padding: 24,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.md,
    },
    gridStat: {
        flex: 1,
        alignItems: 'center',
    },
    gridSeparator: {
        width: 1,
        height: 40,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[200],
    },
    gridValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    gridLabel: {
        fontSize: 12,
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[500],
    },
    sectionBox: {
        padding: 20,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: 16,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.sm,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    contactIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    contactText: {
        fontSize: 15,
        fontWeight: '500',
    },
    recItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[100],
    },
    recName: {
        fontSize: 15,
        fontWeight: '600',
    },
    recReason: {
        fontSize: 12,
        marginTop: 4,
    },
    recPrice: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
});
