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
    TouchableOpacity,
    Image,
    Modal,
    ScrollView,
    TextInput,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    FlatList,
    RefreshControl,
    Linking,
    Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInRight, FadeInDown, Layout } from 'react-native-reanimated';
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
    updateCustomerNotes,
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
    const [customerNotes, setCustomerNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

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
        const customerWithRecs = {
            ...customer,
            recommendations: customer.recommendations || AI_RECOMMENDATIONS_FALLBACK,
            purchaseHistory: customer.purchaseHistory || []
        };
        setSelectedCustomer(customerWithRecs);
        setCustomerNotes(customer.notes || '');
        setShowProfile(true);
    };

    const handleSaveNotes = async () => {
        if (!selectedCustomer) return;
        try {
            setSavingNotes(true);
            await updateCustomerNotes(selectedCustomer.id, customerNotes);

            // Update local state
            setCustomers(prev => prev.map(c =>
                c.id === selectedCustomer.id ? { ...c, notes: customerNotes } : c
            ));

            Alert.alert('تم', 'تم حفظ الملاحظات بنجاح');
        } catch (error) {
            Alert.alert('خطأ', 'فشل حفظ الملاحظات');
        } finally {
            setSavingNotes(false);
        }
    };

    const handleWhatsApp = (phone) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const url = `whatsapp://send?phone=${cleanPhone}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('خطأ', 'الواتساب غير مثبّت');
            }
        });
    };

    const handleCall = (phone) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`);
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

    const renderCustomer = ({ item, index }) => {
        const segmentConfig = SEGMENT_CONFIG[item.segment];

        return (
            <Animated.View
                entering={FadeInRight.delay(index * 100).springify()}
                layout={Layout.springify()}
            >
                <TouchableOpacity
                    style={[styles.customerCard, { backgroundColor: theme.backgroundCard }]}
                    onPress={() => openProfile(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.cardHeader}>
                        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.segment) }]}>
                            {item.photoURL ? (
                                <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                            )}
                        </View>

                        <View style={styles.customerInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.customerName, { color: theme.text }]}>
                                    {item.name || 'زبون مجهول'}
                                </Text>
                                {item.segment === 'vip' && (
                                    <View style={styles.vipBadge}>
                                        <Ionicons name="star" size={10} color="#F59E0B" />
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.customerEmail, { color: theme.textMuted }]} numberOfLines={1}>
                                {item.email || 'لا يوجد بريد'}
                            </Text>
                        </View>

                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#25D36620' }]}
                                onPress={() => handleWhatsApp(item.phone)}
                            >
                                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: theme.primary + '20' }]}
                                onPress={() => handleCall(item.phone)}
                            >
                                <Ionicons name="call" size={18} color={theme.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.cardMeta}>
                        <View style={[styles.segmentBadge, { backgroundColor: segmentConfig.color + '20' }]}>
                            <Ionicons name={segmentConfig.icon} size={10} color={segmentConfig.color} />
                            <Text style={[styles.segmentText, { color: segmentConfig.color }]}>
                                {segmentConfig.label}
                            </Text>
                        </View>
                        <Text style={[styles.cityText, { color: theme.textSecondary }]}>
                            📍 {item.city || 'غير محدد'}
                        </Text>
                        <View style={styles.flex} />
                        <View style={styles.cardStats}>
                            <View style={styles.miniStat}>
                                <Text style={[styles.miniStatValue, { color: theme.text }]}>{item.orderCount}</Text>
                                <Text style={[styles.miniStatLabel, { color: theme.textMuted }]}>طلب</Text>
                            </View>
                            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) + '20' }]}>
                                <Text style={[styles.scoreBadgeText, { color: getScoreColor(item.score) }]}>
                                    {item.score}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
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
                            {selectedCustomer.purchaseHistory && selectedCustomer.purchaseHistory.length > 0 ? (
                                selectedCustomer.purchaseHistory.map((item, index) => (
                                    <View key={index} style={styles.purchaseRow}>
                                        <View style={[styles.purchaseIcon, { backgroundColor: theme.primary + '10' }]}>
                                            <Ionicons name="basket-outline" size={18} color={theme.primary} />
                                        </View>
                                        <View style={styles.purchaseInfo}>
                                            <Text style={[styles.purchaseName, { color: theme.text }]}>طلب #{item.id}</Text>
                                            <Text style={[styles.purchaseDate, { color: theme.textMuted }]}>{item.date}</Text>
                                        </View>
                                        <Text style={[styles.purchaseAmount, { color: theme.primary }]}>{item.total} MAD</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={[styles.emptyText, { color: theme.textMuted }]}>لا توجد مشتريات سابقة</Text>
                            )}
                        </View>

                        {/* AI Recommendations */}
                        <View style={[styles.profileSection, { backgroundColor: theme.backgroundCard }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sparkles" size={18} color="#F59E0B" />
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>توصيات AI</Text>
                            </View>
                            {selectedCustomer.recommendations.map((item, index) => (
                                <View key={item.id} style={styles.recommendationRow}>
                                    <View style={[styles.recIcon, { backgroundColor: '#F59E0B10' }]}>
                                        <Ionicons name="gift-outline" size={18} color="#F59E0B" />
                                    </View>
                                    <View style={styles.recInfo}>
                                        <Text style={[styles.recName, { color: theme.text }]}>{item.name}</Text>
                                        <Text style={[styles.recReason, { color: theme.textMuted }]}>{item.reason}</Text>
                                    </View>
                                    <Text style={[styles.recPrice, { color: theme.textSecondary }]}>{item.price} MAD</Text>
                                </View>
                            ))}
                        </View>

                        {/* Notes Section */}
                        <View style={[styles.profileSection, { backgroundColor: theme.backgroundCard }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>ملاحظات الإدارة</Text>
                            </View>
                            <TextInput
                                style={[styles.notesInput, { color: theme.text, borderColor: theme.border }]}
                                multiline
                                placeholder="أضف ملاحظات حول هذا الزبون..."
                                placeholderTextColor={theme.textMuted}
                                value={customerNotes}
                                onChangeText={setCustomerNotes}
                            />
                            <TouchableOpacity
                                style={[styles.saveNotesBtn, { backgroundColor: theme.primary }]}
                                onPress={handleSaveNotes}
                                disabled={savingNotes}
                            >
                                {savingNotes ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveNotesText}>حفظ الملاحظات</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.bottomPadding} />
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderStatsHeader = () => (
        <View style={styles.statsHeader}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                <View style={[styles.statCard, { backgroundColor: theme.backgroundCard }]}>
                    <BlurView intensity={isDark ? 20 : 40} style={StyleSheet.absoluteFill} />
                    <View style={[styles.statIcon, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="people" size={20} color={theme.primary} />
                    </View>
                    <Text style={[styles.statCardValue, { color: theme.text }]}>{stats.total}</Text>
                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>إجمالي الزبناء</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#F59E0B15' }]}>
                    <BlurView intensity={isDark ? 20 : 40} style={StyleSheet.absoluteFill} />
                    <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
                        <Ionicons name="star" size={20} color="#F59E0B" />
                    </View>
                    <Text style={[styles.statCardValue, { color: '#F59E0B' }]}>{stats.vip}</Text>
                    <Text style={[styles.statCardLabel, { color: '#F59E0B' }]}>زبناء VIP</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#10B98115' }]}>
                    <BlurView intensity={isDark ? 20 : 40} style={StyleSheet.absoluteFill} />
                    <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
                        <Ionicons name="refresh" size={20} color="#10B981" />
                    </View>
                    <Text style={[styles.statCardValue, { color: '#10B981' }]}>{stats.returning}</Text>
                    <Text style={[styles.statCardLabel, { color: '#10B981' }]}>زبناء عائدون</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#EF444415' }]}>
                    <BlurView intensity={isDark ? 20 : 40} style={StyleSheet.absoluteFill} />
                    <View style={[styles.statIcon, { backgroundColor: '#EF444420' }]}>
                        <Ionicons name="warning" size={20} color="#EF4444" />
                    </View>
                    <Text style={[styles.statCardValue, { color: '#EF4444' }]}>{stats.atRisk}</Text>
                    <Text style={[styles.statCardLabel, { color: '#EF4444' }]}>في خطر</Text>
                </View>
            </ScrollView>

            <View style={[styles.avgScoreCard, { backgroundColor: theme.backgroundCard }]}>
                <View style={styles.scoreHeader}>
                    <Text style={[styles.avgScoreLabel, { color: theme.textSecondary }]}>متوسط رضاء الزبناء</Text>
                    <Text style={[styles.avgScoreValue, { color: getScoreColor(stats.avgScore) }]}>
                        {stats.avgScore}%
                    </Text>
                </View>
                <View style={styles.avgScoreBar}>
                    <LinearGradient
                        colors={[getScoreColor(stats.avgScore), getScoreColor(stats.avgScore) + '80']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.avgScoreFill, { width: `${stats.avgScore}%` }]}
                    />
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
            <View style={styles.searchFloatingContainer}>
                <BlurView intensity={80} style={styles.searchBlur}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color={theme.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="البحث بالاسم أو البريد أو الهاتف..."
                            placeholderTextColor={theme.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </BlurView>
            </View>

            {/* Segment Filters */}
            <View style={styles.filtersWrapper}>
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
                                        borderColor: selectedSegment === item.id ? 'transparent' : theme.border,
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
            </View>

            {/* Customers List */}
            <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={renderCustomer}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                ListHeaderComponent={
                    <>
                        <View style={styles.headerSpacer} />
                        {renderStatsHeader()}
                    </>
                }
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
        paddingBottom: 60,
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
        fontSize: 20,
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
    headerSpacer: {
        height: 20,
    },
    searchFloatingContainer: {
        marginTop: -30,
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    searchBlur: {
        padding: 4,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        textAlign: 'right',
        height: 40,
    },
    filtersWrapper: {
        paddingBottom: 12,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 22,
        borderWidth: 1,
        height: 42,
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
        marginLeft: 6,
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
        marginBottom: 20,
    },
    statsScroll: {
        paddingHorizontal: 0,
        gap: 12,
        paddingBottom: 8,
    },
    statCard: {
        width: width * 0.42,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statCardValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    statCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    avgScoreCard: {
        padding: 24,
        borderRadius: 24,
        marginTop: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    scoreHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    avgScoreLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    avgScoreValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    avgScoreBar: {
        height: 12,
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    avgScoreFill: {
        height: '100%',
        borderRadius: 6,
    },
    customerCard: {
        padding: 18,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        gap: 12,
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
        alignItems: 'flex-end',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    customerName: {
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'right',
    },
    vipBadge: {
        backgroundColor: '#F59E0B20',
        padding: 4,
        borderRadius: 8,
    },
    customerEmail: {
        fontSize: 13,
        marginTop: 3,
        textAlign: 'right',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        gap: 12,
    },
    segmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    segmentText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cityText: {
        fontSize: 12,
    },
    cardStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    miniStat: {
        alignItems: 'flex-end',
    },
    miniStatValue: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    miniStatLabel: {
        fontSize: 10,
    },
    scoreBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    scoreBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    flex: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80,
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
        paddingBottom: 40,
    },
    profileHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    profileHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 20,
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileAvatarImage: {
        width: '100%',
        height: '100%',
    },
    profileAvatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    profileName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'extrabold',
        marginTop: 12,
    },
    profileSegment: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
        gap: 6,
    },
    profileSegmentText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    scoreRing: {
        position: 'absolute',
        right: 20,
        bottom: -30,
    },
    scoreRingInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    scoreRingValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    scoreRingLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
    },
    profileContent: {
        flex: 1,
        marginTop: -20,
    },
    profileSection: {
        margin: 16,
        marginBottom: 8,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
    },
    contactText: {
        fontSize: 15,
    },
    ltvGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    ltvItem: {
        flex: 1,
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
    notesInput: {
        minHeight: 100,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        fontSize: 14,
        textAlign: 'right',
        backgroundColor: 'rgba(0,0,0,0.02)',
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    saveNotesBtn: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveNotesText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    purchaseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    purchaseIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    purchaseInfo: {
        flex: 1,
        marginLeft: 12,
    },
    purchaseName: {
        fontSize: 14,
        fontWeight: '600',
    },
    purchaseDate: {
        fontSize: 12,
        marginTop: 2,
    },
    purchaseAmount: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    recommendationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    recIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recInfo: {
        flex: 1,
        marginLeft: 12,
    },
    recName: {
        fontSize: 14,
        fontWeight: '600',
    },
    recReason: {
        fontSize: 11,
        marginTop: 2,
    },
    recPrice: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    bottomPadding: {
        height: 60,
    },
});
