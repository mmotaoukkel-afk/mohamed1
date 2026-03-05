/**
 * Admin Discounts - Kataraa
 * Manage Coupons & Offers
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ADMIN_COLORS,
    ADMIN_SHADOWS,
    BORDER_RADIUS
} from '../../src/constants/adminDesignTokens';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { createCoupon, deleteCoupon, getCoupons, toggleCouponStatus } from '../../src/services/adminDiscountService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

export default function AdminDiscounts() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(theme, isDark);

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage', // percentage | fixed
        value: '',
        minOrderAmount: '',
        usageLimit: '',
        expiresInDays: '30'
    });

    const loadData = useCallback(async () => {
        try {
            const data = await getCoupons();
            setCoupons(data);
        } catch (error) {
            console.error('Failed to load coupons:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateWrapper = async () => {
        if (!newCoupon.code || !newCoupon.value) {
            Alert.alert(t('error'), t('pleaseEnterCodeAndValue'));
            return;
        }

        setSaving(true);

        // Calculate Expiry Date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(newCoupon.expiresInDays || 30));

        const couponData = {
            code: newCoupon.code,
            discountType: newCoupon.discountType,
            value: parseFloat(newCoupon.value),
            minOrderAmount: parseFloat(newCoupon.minOrderAmount) || 0,
            usageLimit: parseInt(newCoupon.usageLimit) || 1000,
            expiresAt: expiresAt
        };

        const result = await createCoupon(couponData);

        if (result.success) {
            Alert.alert(t('success'), t('couponCreated'));
            setModalVisible(false);
            setNewCoupon({ code: '', discountType: 'percentage', value: '', minOrderAmount: '', usageLimit: '', expiresInDays: '30' });
            loadData();
        } else {
            Alert.alert(t('error'), result.message);
        }
        setSaving(false);
    };

    const handleDelete = (id) => {
        Alert.alert(
            t('deleteCouponTitle'),
            t('deleteCouponConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        await deleteCoupon(id);
                        loadData();
                    }
                }
            ]
        );
    };

    const handleToggle = async (id, currentStatus) => {
        // Optimistic update
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
        await toggleCouponStatus(id, currentStatus);
    };

    const renderCouponItem = ({ item }) => {
        const isExpired = item.expiresAt && item.expiresAt < new Date();
        const usagePercent = item.usageLimit ? (item.usedCount / item.usageLimit) * 100 : 0;

        return (
            <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={[styles.codeText, { color: theme.primary }]}>{item.code}</Text>
                        <Text style={[styles.typeText, { color: theme.textSecondary }]}>
                            {item.discountType === 'percentage'
                                ? t('percentageDiscount', { value: item.value })
                                : t('discountAmountPrefix', { value: currencyService.formatAdminPrice(item.value) })}
                        </Text>
                    </View>
                    <Switch
                        value={item.isActive}
                        onValueChange={() => handleToggle(item.id, item.isActive)}
                        trackColor={{ false: theme.border, true: theme.primary }}
                    />
                </View>

                {/* Usage Bar */}
                <View style={styles.usageContainer}>
                    <View style={styles.usageRow}>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{t('usedLabel', { used: item.usedCount, limit: item.usageLimit })}</Text>
                        <Text style={{ fontSize: 12, color: isExpired ? '#EF4444' : theme.textSecondary }}>
                            {isExpired ? t('expired') : t('expiresLabel', { date: item.expiresAt?.toLocaleDateString() })}
                        </Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(usagePercent, 100)}%`, backgroundColor: isExpired ? theme.textMuted : theme.primary }]} />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F8FAFC' }]}>
            <LinearGradient
                colors={[theme?.primary || '#D4AF76', theme?.primaryDark || '#B8924F']}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('manageCoupons')}</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                data={coupons}
                renderItem={renderCouponItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.primary} />}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyState}>
                            <Ionicons name="pricetag-outline" size={64} color={theme.textMuted} />
                            <Text style={{ color: theme.textSecondary, marginTop: 16 }}>{t('noActiveCoupons')}</Text>
                        </View>
                    )
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Create Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundCard }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('addNewCoupon')}</Text>

                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text, textTransform: 'uppercase' }]}
                            placeholder={t('couponCodePlaceholder')}
                            placeholderTextColor={theme.textMuted}
                            value={newCoupon.code}
                            onChangeText={t => setNewCoupon({ ...newCoupon, code: t.toUpperCase() })}
                            maxLength={15}
                        />

                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                            <TouchableOpacity
                                style={[styles.typeBtn, newCoupon.discountType === 'percentage' && { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                                onPress={() => setNewCoupon({ ...newCoupon, discountType: 'percentage' })}
                            >
                                <Text style={{ color: newCoupon.discountType === 'percentage' ? theme.primary : theme.textSecondary }}>{t('percentageType')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, newCoupon.discountType === 'fixed' && { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                                onPress={() => setNewCoupon({ ...newCoupon, discountType: 'fixed' })}
                            >
                                <Text style={{ color: newCoupon.discountType === 'fixed' ? theme.primary : theme.textSecondary }}>{t('fixedAmountType')}</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                            placeholder={newCoupon.discountType === 'percentage' ? t('valuePercentagePlaceholder') : t('valueFixedPlaceholder')}
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={newCoupon.value}
                            onChangeText={t => setNewCoupon({ ...newCoupon, value: t })}
                        />

                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                            placeholder={t('minOrderAmountOptional')}
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={newCoupon.minOrderAmount}
                            onChangeText={t => setNewCoupon({ ...newCoupon, minOrderAmount: t })}
                        />

                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                            placeholder={t('validityDaysPlaceholder')}
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={newCoupon.expiresInDays}
                            onChangeText={t => setNewCoupon({ ...newCoupon, expiresInDays: t })}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: theme.text }}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                                onPress={handleCreateWrapper}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('create')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    card: {
        marginHorizontal: 8,
        padding: 20,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: 16,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.md,
        position: 'relative',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    codeText: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: isDark ? '#fff' : ADMIN_COLORS.primary.main,
    },
    typeText: {
        fontSize: 13,
        marginTop: 6,
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[500],
    },
    usageContainer: {
        marginTop: 12,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[900] : ADMIN_COLORS.neutral[100],
        padding: 12,
        borderRadius: BORDER_RADIUS.lg,
    },
    usageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
        backgroundColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[200],
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    deleteBtn: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 8,
        backgroundColor: isDark ? ADMIN_COLORS.error.bgDark : ADMIN_COLORS.error.bg,
        borderRadius: BORDER_RADIUS.md,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...ADMIN_SHADOWS.lg,
        backgroundColor: ADMIN_COLORS.primary.main,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: BORDER_RADIUS.xl,
        padding: 24,
        ...ADMIN_SHADOWS.lg,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: isDark ? '#fff' : ADMIN_COLORS.neutral[900],
    },
    input: {
        borderWidth: 1,
        borderColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[300],
        borderRadius: BORDER_RADIUS.lg,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
        color: isDark ? '#fff' : ADMIN_COLORS.neutral[900],
        backgroundColor: isDark ? ADMIN_COLORS.neutral[900] : '#fff',
    },
    typeBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[300],
        borderRadius: BORDER_RADIUS.lg,
        padding: 14,
        alignItems: 'center',
        marginBottom: 8,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    modalBtn: {
        flex: 1,
        padding: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
