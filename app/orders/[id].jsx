import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import { useCheckout } from '../../src/context/CheckoutContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { Text, Surface, IconButton, Button } from '../../src/components/ui';

const { width } = Dimensions.get('window');

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { orders } = useCheckout();
    const { t } = useTranslation();

    const order = orders.find(o => o.id?.toString() === id);

    if (!order) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <SafeAreaView style={styles.safeArea}>
                    <IconButton icon="arrow-back" onPress={() => router.back()} />
                    <View style={styles.center}>
                        <Ionicons name="alert-circle-outline" size={64} color={theme.textMuted} />
                        <Text variant="title" style={{ marginTop: 20 }}>{t('orderNotFound')}</Text>
                        <Button title={t('back')} onPress={() => router.back()} style={{ marginTop: 20 }} />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const handleSupport = () => {
        const message = `${t('supportMessage')} #${order.id?.toString().slice(-6)}`;
        const whatsappUrl = `https://wa.me/9659910326?text=${encodeURIComponent(message)}`;
        Linking.openURL(whatsappUrl);
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F0F1A' : '#FAFAFF' }]}>
            <View style={[styles.bgCircle, { top: -50, right: -100, backgroundColor: theme.primary + '10' }]} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.backBtnBlur}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{t('orderDetails')}</Text>
                    <TouchableOpacity style={styles.supportHeaderBtn} onPress={handleSupport}>
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Receipt Card */}
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.receiptContainer}>
                        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.receiptBlur}>
                            {/* Top Section */}
                            <View style={styles.receiptTop}>
                                <View style={styles.receiptDecorator} />
                                <Text style={[styles.orderNumber, { color: theme.textSecondary }]}>#{order.id?.toString().slice(-8).toUpperCase()}</Text>
                                <Text style={[styles.orderDate, { color: theme.textMuted }]}>{new Date(order.date).toLocaleString()}</Text>

                                <View style={[styles.statusBadge, { backgroundColor: theme.primary + '15' }]}>
                                    <Text style={[styles.statusText, { color: theme.primary }]}>
                                        {order.status || t('processing')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.receiptDivider} />

                            {/* Items List */}
                            <View style={styles.itemsSection}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('items')}</Text>
                                {order.items?.map((item, index) => (
                                    <View key={index} style={styles.itemRow}>
                                        <Image source={{ uri: item.image }} style={styles.itemImage} />
                                        <View style={styles.itemInfo}>
                                            <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                                            <Text style={[styles.itemQty, { color: theme.textMuted }]}>x{item.quantity || 1}</Text>
                                        </View>
                                        <Text style={[styles.itemPrice, { color: theme.text }]}>{item.price} {t('currency')}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.receiptDivider} />

                            {/* Total Summary */}
                            <View style={styles.summarySection}>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t('subtotal')}</Text>
                                    <Text style={[styles.summaryValue, { color: theme.text }]}>{order.subtotal || order.total} {t('currency')}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t('shipping')}</Text>
                                    <Text style={[styles.summaryValue, { color: theme.text }]}>{order.shippingFee || 0} {t('currency')}</Text>
                                </View>
                                <LinearGradient
                                    colors={[theme.primary + '00', theme.primary + '10', theme.primary + '00']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.totalGradient}
                                >
                                    <View style={styles.totalRow}>
                                        <Text style={[styles.totalLabel, { color: theme.text }]}>{t('total')}</Text>
                                        <Text style={[styles.totalValue, { color: theme.primary }]}>{order.total} {t('currency')}</Text>
                                    </View>
                                </LinearGradient>
                            </View>

                            {/* Footer Decor */}
                            <View style={styles.receiptFooter}>
                                <Text style={[styles.footerText, { color: theme.textMuted }]}>{t('thankYouShopping')}</Text>
                            </View>
                        </BlurView>
                    </Animated.View>

                    {/* Shipping Address Section */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                            <Ionicons name="location-outline" size={20} color={theme.primary} />
                            <Text style={[styles.infoCardTitle, { color: theme.text }]}>{t('shippingAddress')}</Text>
                        </View>
                        <Text style={[styles.addressText, { color: theme.textSecondary }]}>
                            {order.shippingInfo?.street && `${order.shippingInfo.street}, `}
                            {order.shippingInfo?.city && `${order.shippingInfo.city}, `}
                            {order.shippingInfo?.country}
                        </Text>
                        {order.shippingInfo?.phone && (
                            <Text style={[styles.addressPhone, { color: theme.textMuted }]}>{order.shippingInfo.phone}</Text>
                        )}
                    </Animated.View>

                    {/* Payment Method Section */}
                    <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                            <Ionicons name="card-outline" size={20} color={theme.primary} />
                            <Text style={[styles.infoCardTitle, { color: theme.text }]}>{t('paymentMethod')}</Text>
                        </View>
                        <Text style={[styles.paymentText, { color: theme.textSecondary }]}>
                            {order.paymentMethod === 'cod' ? t('cod') : (t('onlinePayment') || 'دفع إلكتروني')}
                        </Text>
                    </Animated.View>

                    {/* Actions */}
                    <View style={styles.actionContainer}>
                        <Button
                            title={t('trackOrder')}
                            onPress={() => { }}
                            variant="primary"
                            style={styles.actionBtn}
                        />
                        <Button
                            title={t('contactSupport')}
                            onPress={handleSupport}
                            variant="outline"
                            style={styles.actionBtn}
                            icon="logo-whatsapp"
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgCircle: { position: 'absolute', width: 400, height: 400, borderRadius: 200 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    backBtnBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900' },
    supportHeaderBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    scrollContent: { padding: 20, paddingBottom: 60 },
    receiptContainer: {
        marginBottom: 24,
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    receiptBlur: { padding: 24 },
    receiptTop: { alignItems: 'center', marginBottom: 20 },
    receiptDecorator: {
        width: 60,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginBottom: 20,
    },
    orderNumber: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    orderDate: { fontSize: 12, marginBottom: 16 },
    statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    statusText: { fontSize: 13, fontWeight: '700' },
    receiptDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderRadius: 1,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
    itemsSection: { marginBottom: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    itemImage: { width: 50, height: 50, borderRadius: 12, marginRight: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    itemQty: { fontSize: 12 },
    itemPrice: { fontSize: 15, fontWeight: '700' },
    summarySection: { gap: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 14 },
    summaryValue: { fontSize: 14, fontWeight: '600' },
    totalGradient: { marginVertical: 8, borderRadius: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
    totalLabel: { fontSize: 18, fontWeight: '800' },
    totalValue: { fontSize: 22, fontWeight: '900' },
    receiptFooter: { alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 12, fontStyle: 'italic' },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    infoCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    infoCardTitle: { fontSize: 16, fontWeight: '700' },
    addressText: { fontSize: 14, lineHeight: 22 },
    addressPhone: { fontSize: 13, marginTop: 4 },
    paymentText: { fontSize: 14, fontWeight: '600' },
    actionContainer: { marginTop: 20, gap: 12 },
    actionBtn: { borderRadius: 16 }
});
