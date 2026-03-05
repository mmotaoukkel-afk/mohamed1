/**
 * Admin Shipping - Kataraa
 * Manage Shipping Zones & Rates
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
import {
    addShippingZone,
    deleteShippingZone,
    getShippingZones,
    toggleZoneStatus,
    updateShippingZone
} from '../../src/services/adminShippingService';
import currencyService from '../../src/services/currencyService';

const { width } = Dimensions.get('window');

const COUNTRIES = [
    { code: 'KW', name: 'الكويت', flag: '🇰🇼' },
    { code: 'SA', name: 'السعودية', flag: '🇸🇦' },
    { code: 'AE', name: 'الإمارات', flag: '🇦🇪' },
    { code: 'QA', name: 'قطر', flag: '🇶🇦' },
    { code: 'BH', name: 'البحرين', flag: '🇧🇭' },
    { code: 'OM', name: 'عمان', flag: '🇴🇲' },
    { code: 'IQ', name: 'العراق', flag: '🇮🇶' },
];

export default function AdminShipping() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [zones, setZones] = useState([]);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameEn: '',
        country: 'KW',
        fee: '',
    });
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const data = await getShippingZones();
            setZones(data);
        } catch (error) {
            console.error('Failed to load shipping zones:', error);
            Alert.alert('خطأ', 'فشل تحميل بيانات الشحن');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleOpenModal = (zone = null) => {
        if (zone) {
            setEditingZone(zone);
            setFormData({
                name: zone.name,
                nameEn: zone.nameEn,
                country: zone.country,
                fee: zone.fee.toString(),
            });
        } else {
            setEditingZone(null);
            setFormData({
                name: '',
                nameEn: '',
                country: 'KW',
                fee: '',
            });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.fee) {
            Alert.alert('تنبيه', 'الاسم والسعر مطلوبان');
            return;
        }

        setSaving(true);
        try {
            const zoneData = {
                ...formData,
                fee: parseFloat(formData.fee),
            };

            if (editingZone) {
                await updateShippingZone(editingZone.id, zoneData);
            } else {
                await addShippingZone(zoneData);
            }

            setModalVisible(false);
            onRefresh();
        } catch (error) {
            Alert.alert('خطأ', 'فشل حفظ البيانات');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'تأكيد الحذف',
            'هل أنت متأكد من حذف هذه المنطقة؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteShippingZone(id);
                            onRefresh();
                        } catch (error) {
                            Alert.alert('خطأ', 'فشل الحذف');
                        }
                    }
                }
            ]
        );
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            // Optimistic update
            setZones(prev => prev.map(z => z.id === id ? { ...z, active: !currentStatus } : z));
            await toggleZoneStatus(id, currentStatus);
        } catch (error) {
            // Revert on error
            onRefresh();
        }
    };

    const getCountryInfo = (code) => COUNTRIES.find(c => c.code === code) || { name: code, flag: '🌍' };

    const renderItem = ({ item }) => {
        const country = getCountryInfo(item.country);

        return (
            <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                        <Text style={{ fontSize: 24 }}>{country.flag}</Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{item.nameEn}</Text>
                    </View>
                    <Switch
                        trackColor={{ true: theme.primary }}
                        thumbColor={item.active ? '#fff' : '#f4f3f4'}
                        value={item.active}
                        onValueChange={() => handleToggle(item.id, item.active)}
                    />
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.priceContainer}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>سعر التوصيل:</Text>
                        <Text style={[styles.price, { color: theme.primary }]}>
                            {currencyService.formatKWD(item.fee)}
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#EEF2FF' }]}
                            onPress={() => handleOpenModal(item)}
                        >
                            <Ionicons name="create-outline" size={18} color="#6366F1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
                            onPress={() => handleDelete(item.id)}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
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
                        <Text style={styles.headerTitle}>إدارة الشحن</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={zones}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="map-outline" size={48} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>لا توجد مناطق شحن</Text>
                            <TouchableOpacity onPress={() => handleOpenModal()}>
                                <Text style={{ color: theme.primary, marginTop: 8 }}>+ أضف منطقة جديدة</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundCard }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {editingZone ? 'تعديل المنطقة' : 'منطقة جديدة'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>الدولة</Text>
                        <View style={styles.chipContainer}>
                            {COUNTRIES.map(c => (
                                <TouchableOpacity
                                    key={c.code}
                                    style={[
                                        styles.chip,
                                        formData.country === c.code && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                                    ]}
                                    onPress={() => setFormData({ ...formData, country: c.code })}
                                >
                                    <Text>{c.flag}</Text>
                                    <Text style={{ marginLeft: 4, color: theme.text, fontSize: 12 }}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>اسم المنطقة (العربية)</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                            placeholder="مثال: الرياض"
                            placeholderTextColor={theme.textMuted}
                            value={formData.name}
                            onChangeText={t => setFormData({ ...formData, name: t })}
                            textAlign="right"
                        />

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>اسم المنطقة (English)</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                            placeholder="Example: Riyadh"
                            placeholderTextColor={theme.textMuted}
                            value={formData.nameEn}
                            onChangeText={t => setFormData({ ...formData, nameEn: t })}
                            textAlign="left"
                        />

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>سعر التوصيل (د.ك)</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                            placeholder="0.00"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={formData.fee}
                            onChangeText={t => setFormData({ ...formData, fee: t })}
                            textAlign="right"
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>حفظ</Text>
                            )}
                        </TouchableOpacity>
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
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    card: {
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: 16,
        padding: 20,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.md,
    },
    cardHeader: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        marginBottom: 16,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16, // RTL
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? '#fff' : ADMIN_COLORS.neutral[900],
        textAlign: 'right', // RTL
    },
    cardSubtitle: {
        fontSize: 12,
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[500],
        textAlign: 'right', // RTL
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: 'row-reverse', // RTL
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[200],
    },
    priceContainer: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 12,
        color: isDark ? ADMIN_COLORS.neutral[400] : ADMIN_COLORS.neutral[600],
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: ADMIN_COLORS.primary.main,
    },
    actions: {
        flexDirection: 'row-reverse', // RTL
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDark ? ADMIN_COLORS.neutral[700] : '#F3F4F6',
    },
    emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { marginTop: 16, fontSize: 16, color: ADMIN_COLORS.neutral[500] },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.lg,
    },
    modalHeader: {
        flexDirection: 'row-reverse', // RTL
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: isDark ? '#fff' : ADMIN_COLORS.neutral[900],
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
        marginTop: 16,
        fontWeight: '600',
        textAlign: 'right', // RTL
        color: isDark ? ADMIN_COLORS.neutral[300] : ADMIN_COLORS.neutral[700],
    },
    input: {
        borderWidth: 1,
        borderColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[300],
        borderRadius: BORDER_RADIUS.lg,
        padding: 14,
        fontSize: 16,
        textAlign: 'right', // RTL
        color: isDark ? '#fff' : ADMIN_COLORS.neutral[900],
        backgroundColor: isDark ? ADMIN_COLORS.neutral[900] : '#fff',
    },
    saveBtn: {
        padding: 16,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
        marginTop: 30,
        backgroundColor: ADMIN_COLORS.primary.main,
        ...ADMIN_SHADOWS.md,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    chipContainer: {
        flexDirection: 'row-reverse', // RTL
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[700] : '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
});
