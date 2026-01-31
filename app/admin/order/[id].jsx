/**
 * Admin Order Details - Kataraa
 * Comprehensive view of a single order
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/context/ThemeContext';
import {
    ORDER_STATUS_CONFIG,
    formatOrderId,
    getOrderById,
    getStatusLabel,
    getWhatsAppLink,
    updateOrderStatus
} from '../../../src/services/adminOrderService';
import currencyService from '../../../src/services/currencyService';

const { width } = Dimensions.get('window');

export default function AdminOrderDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getOrderById(id);
            if (data) {
                setOrder(data);
            } else {
                Alert.alert('خطأ', 'الطلب غير موجود');
                router.back();
            }
        } catch (error) {
            console.error('Error loading order:', error);
            Alert.alert('خطأ', 'فشل تحميل تفاصيل الطلب');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) loadOrder();
    }, [id, loadOrder]);

    const handleUpdateStatus = async (newStatus) => {
        try {
            setUpdating(true);
            await updateOrderStatus(id, newStatus);
            setOrder(prev => ({ ...prev, status: newStatus }));
            Alert.alert('نجاح', `تم تغيير الحالة إلى ${getStatusLabel(newStatus)}`);
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحديث الحالة');
        } finally {
            setUpdating(false);
        }
    };

    const handleWhatsApp = () => {
        const phone = order?.customerPhone || order?.shippingAddress?.phone || order?.shipping_info?.phone;
        if (phone) {
            const url = getWhatsAppLink(phone, `مرحباً ${order.customerName}، بخصوص طلبك رقم ${formatOrderId(order.id)}...`);
            Linking.openURL(url);
        } else {
            Alert.alert('تنبيه', 'رقم الهاتف غير متوفر');
        }
    };

    const handleCall = () => {
        const phone = order?.customerPhone || order?.shippingAddress?.phone || order?.shipping_info?.phone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const handleOpenMap = () => {
        const addr = order?.shipping_info || order?.shippingAddress || {};
        const query = `${addr.country || 'Kuwait'}, ${addr.governorate || ''}, ${addr.city || ''}, ${addr.street || ''}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        Linking.openURL(url);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!order) return null;

    // Resolve Status Config
    const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;

    // Resolve Customer Image
    const customerImage = order.customer?.photoURL || order.user?.photoURL || order.photoURL || null;

    // Resolve Address Details (Priority to shipping_info from checkout)
    const address = order.shipping_info || order.shippingAddress || {};

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: statusConfig.color + '15' }]}>
                    <View style={[styles.statusIcon, { backgroundColor: statusConfig.color }]}>
                        <Ionicons name={statusConfig.icon} size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>حالة الطلب</Text>
                        <Text style={[styles.statusValue, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                    </View>
                    <Text style={[styles.dateText, { color: theme.textMuted }]}>
                        {new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString('ar-KW')}
                    </Text>
                </View>

                {/* Customer Card */}
                <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>بيانات الزبون</Text>
                    <View style={styles.customerRow}>
                        {customerImage ? (
                            <Image source={{ uri: customerImage }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                                <Ionicons name="person" size={24} color={theme.primary} />
                            </View>
                        )}
                        <View style={{ flex: 1, marginHorizontal: 12 }}>
                            <Text style={[styles.customerName, { color: theme.text }]}>
                                {order.customerName || 'زبون مجهول'}
                            </Text>
                            <Text style={[styles.customerEmail, { color: theme.textSecondary }]}>
                                {order.customerEmail || address.email || 'No Email'}
                            </Text>
                        </View>
                        <View style={styles.contactActions}>
                            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
                                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.primary }]} onPress={handleCall}>
                                <Ionicons name="call" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Shipping Details */}
                <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>عنوان التوصيل</Text>
                        <TouchableOpacity onPress={handleOpenMap}>
                            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: 'bold' }}>فتح الخريطة 🗺️</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>الدولة</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{address.country || 'غير محدد'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>المحافظة</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{address.governorate || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>المدينة/المنطقة</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{address.city || '-'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>القطعة (Block)</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{address.block || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>الشارع</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{address.street || '-'}</Text>
                        </View>
                    </View>

                    {address.notes ? (
                        <View style={[styles.noteBox, { backgroundColor: theme.background }]}>
                            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                                📝 ملاحظات: {address.notes}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Order Items */}
                <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>المنتجات ({order.items?.length || 0})</Text>
                    {order.items?.map((item, index) => (
                        <View key={index} style={styles.productItem}>
                            <View style={[styles.productImage, { backgroundColor: theme.border }]}>
                                {item.image || item.images?.[0] ? (
                                    <Image source={{ uri: item.image || item.images?.[0] }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <Ionicons name="image-outline" size={20} color={theme.textMuted} />
                                )}
                            </View>
                            <View style={{ flex: 1, marginHorizontal: 12 }}>
                                <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                                <Text style={[styles.productMeta, { color: theme.textSecondary }]}>
                                    الكمية: {item.quantity}
                                </Text>
                            </View>
                            <Text style={[styles.productPrice, { color: theme.primary }]}>
                                {currencyService.formatAdminPrice(item.price * item.quantity)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Order Summary */}
                <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>ملخص الدفع</Text>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>طريقة الدفع</Text>
                        <Text style={[styles.summaryValue, { color: theme.text }]}>
                            {order.payment_method_title || order.paymentMethod || 'KNET'}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المجموع الفرعي</Text>
                        <Text style={[styles.summaryValue, { color: theme.text }]}>
                            {currencyService.formatAdminPrice((order.total || 0) - (order.shipping_total || 0))}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>التوصيل</Text>
                        <Text style={[styles.summaryValue, { color: theme.text }]}>
                            {currencyService.formatAdminPrice(order.shipping_total || 0)}
                        </Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 10 }]}>
                        <Text style={[styles.totalLabel, { color: theme.text }]}>الإجمالي الكلي</Text>
                        <Text style={[styles.totalValue, { color: theme.primary }]}>
                            {currencyService.formatAdminPrice(order.total || 0)}
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={[styles.footer, { backgroundColor: theme.backgroundCard, borderTopColor: theme.border }]}>
                {statusConfig.nextStatus && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                        onPress={() => handleUpdateStatus(statusConfig.nextStatus)}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.actionBtnText}>تغيير الحالة إلى: {getStatusLabel(statusConfig.nextStatus)}</Text>
                        )}
                    </TouchableOpacity>
                )}
                {!statusConfig.nextStatus && (
                    <View style={[styles.completedBadge, { backgroundColor: '#10B98110' }]}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={{ marginLeft: 8, color: '#10B981', fontWeight: 'bold' }}>الطلب مكتمل</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

    statusBanner: { margin: 16, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
    statusIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    statusLabel: { fontSize: 12, marginBottom: 4 },
    statusValue: { fontSize: 18, fontWeight: 'bold' },
    dateText: { fontSize: 12 },

    card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },

    customerRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    customerName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, textAlign: 'left' },
    customerEmail: { fontSize: 12, textAlign: 'left' },
    contactActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    detailRow: { flexDirection: 'row', marginBottom: 12 },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 11, marginBottom: 4, textAlign: 'left' },
    detailValue: { fontSize: 14, fontWeight: '600', textAlign: 'left' },
    noteBox: { padding: 12, borderRadius: 12, marginTop: 8 },
    noteText: { fontSize: 12, fontStyle: 'italic' },

    productItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    productImage: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    productName: { fontSize: 14, fontWeight: '600', textAlign: 'left' },
    productMeta: { fontSize: 12, marginTop: 4, textAlign: 'left' },
    productPrice: { fontSize: 14, fontWeight: 'bold' },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 13 },
    summaryValue: { fontSize: 14, fontWeight: '600' },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 8 },
    totalLabel: { fontSize: 16, fontWeight: 'bold' },
    totalValue: { fontSize: 20, fontWeight: 'bold' },

    footer: { padding: 16, borderTopWidth: 1 },
    actionButton: { height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    completedBadge: { height: 50, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }
});
