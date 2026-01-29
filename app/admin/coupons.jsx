/**
 * Admin Coupons - Kataraa
 * Management control center for discount codes
 * 🔐 Protected by RequireAdmin
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { getAllCoupons, deleteCoupon } from '../../src/services/adminCouponService';
import AddCouponModal from '../../src/components/admin/AddCouponModal';
import currencyService from '../../src/services/currencyService';

export default function AdminCoupons() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllCoupons();
            setCoupons(data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            Alert.alert('خطأ', 'فشل تحميل الكوبونات');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleDelete = (id, code) => {
        Alert.alert(
            'حذف الكوبون',
            `هل أنت متأكد من حذف الكود "${code}"؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCoupon(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('خطأ', 'فشل الحذف');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setShowAddModal(true);
    };

    const renderCoupon = ({ item }) => (
        <View style={[styles.couponCard, { backgroundColor: theme.backgroundCard }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.codeBadge, { backgroundColor: item.isActive ? theme.primary + '15' : theme.textMuted + '15' }]}>
                    <Text style={[styles.codeText, { color: item.isActive ? theme.primary : theme.textMuted }]}>
                        {item.code}
                    </Text>
                </View>
                {!item.isActive && (
                    <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveText}>غير نشط</Text>
                    </View>
                )}
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>الخصم</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {item.type === 'percentage' ? `${item.value}%` : `${item.value} درهم`}
                    </Text>
                </View>
                <View style={[styles.detailItem, { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>الاستخدام</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {item.usageCount} / {item.usageLimit || '∞'}
                    </Text>
                </View>
                <View style={[styles.detailItem, { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>أدنى طلب</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {item.minOrder ? `${item.minOrder} د.م` : 'بدون'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.border, borderWidth: 1 }]}
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="create-outline" size={18} color={theme.textSecondary} />
                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>تعديل</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#EF444415' }]}
                    onPress={() => handleDelete(item.id, item.code)}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>حذف</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>إدارة الكوبونات</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                data={coupons}
                keyExtractor={item => item.id}
                renderItem={renderCoupon}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.empty}>
                            <Ionicons name="gift-outline" size={64} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>لا توجد كوبونات حالياً</Text>
                        </View>
                    )
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => {
                    setEditingCoupon(null);
                    setShowAddModal(true);
                }}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <AddCouponModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchData}
                editCoupon={editingCoupon}
            />
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 16 },
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
    list: { padding: 16, paddingBottom: 100 },
    couponCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    codeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    codeText: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    inactiveBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    inactiveText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    detailItem: {
        flex: 1,
        alignItems: 'center',
    },
    detailLabel: { fontSize: 11, marginBottom: 4 },
    detailValue: { fontSize: 15, fontWeight: 'bold' },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    actionText: { fontSize: 13, fontWeight: '600' },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    empty: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: { marginTop: 16, fontSize: 16 },
});
