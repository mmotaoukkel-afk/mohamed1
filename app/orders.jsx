import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Image,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useCheckout } from '../src/context/CheckoutContext';
import { useTranslation } from '../src/hooks/useTranslation';
import OrderTimeline from '../src/components/OrderTimeline';
import { EmptyState } from '../src/components/ui';

const { width, height } = Dimensions.get('window');

export default function OrdersScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { orders } = useCheckout();
    const { t } = useTranslation();

    const renderOrderItem = ({ item, index }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.orderCardContainer}
        >
            <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={[styles.orderId, { color: theme.text }]}>Order #{item.id?.toString().slice(-6) || 'N/A'}</Text>
                        <Text style={[styles.orderDate, { color: theme.textMuted }]}>{new Date(item.date || Date.now()).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: (item.payment_status === 'Paid' || item.payment_status === 'success') ? '#4CAF5020' : theme.primary + '20' }]}>
                        <Text style={[styles.statusText, { color: (item.payment_status === 'Paid' || item.payment_status === 'success') ? '#4CAF50' : theme.primary }]}>
                            {item.payment_status === 'Paid' || item.payment_status === 'success' ? t('paid') || 'Paid' : t('processing') || 'Processing'}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.orderBody}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
                        {item.items?.map((product, idx) => (
                            <View key={idx} style={styles.itemThumbContainer}>
                                <Image source={{ uri: product.image }} style={styles.itemThumb} />
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.orderTotalRow}>
                        <Text style={[styles.itemCount, { color: theme.textSecondary }]}>
                            {item.items?.length} {t('items') || 'items'}
                        </Text>
                        <Text style={[styles.totalPrice, { color: theme.primary }]}>
                            {item.total} {t('currency')}
                        </Text>
                    </View>

                    {/* Order Timeline */}
                    <OrderTimeline status={item.payment_status} style={styles.timeline} />
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.detailsBtn, { backgroundColor: theme.primary + '15' }]}
                        onPress={() => router.push(`/orders/${item.id}`)}
                    >
                        <Text style={[styles.detailsText, { color: theme.primary }]}>{t('viewDetails')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.supportBtn, { borderColor: theme.border }]}
                        onPress={() => {
                            const message = `${t('supportMessage')} #${item.id?.toString().slice(-6)}`;
                            const whatsappUrl = `https://wa.me/9659910326?text=${encodeURIComponent(message)}`;
                            Linking.openURL(whatsappUrl);
                        }}
                    >
                        <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F0F1A' : '#FAFAFF' }]}>
            {/* Background Decor */}
            <View style={[styles.bgCircle, { top: -50, right: -50, backgroundColor: theme.primary + '15' }]} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.backBtnBlur}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{t('ordersTitle')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                {orders.length === 0 ? (
                    <EmptyState
                        title={t('noOrders')}
                        description={t('browseProducts')}
                        icon="receipt-outline"
                        actionLabel={t('shopNow')}
                        onAction={() => router.push('/products')}
                    />
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
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
    headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    listContent: { padding: 20, paddingBottom: 100 },
    orderCardContainer: { marginBottom: 20, borderRadius: 24, overflow: 'hidden' },
    orderCard: { padding: 20 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    orderId: { fontSize: 16, fontWeight: '800' },
    orderDate: { fontSize: 12, marginTop: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '700' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
    orderBody: { marginBottom: 15 },
    itemsScroll: { flexDirection: 'row', marginBottom: 12 },
    itemThumbContainer: { width: 60, height: 60, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 10, overflow: 'hidden' },
    itemThumb: { width: '100%', height: '100%' },
    orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemCount: { fontSize: 13, fontWeight: '600' },
    totalPrice: { fontSize: 18, fontWeight: '900' },
    actionRow: { flexDirection: 'row', gap: 10 },
    detailsBtn: { flex: 1, padding: 12, borderRadius: 15, alignItems: 'center' },
    detailsText: { fontSize: 14, fontWeight: '700' },
    supportBtn: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIconContainer: { marginBottom: 30 },
    emptyIconGradient: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
    emptySubtitle: { fontSize: 16, textAlign: 'center', opacity: 0.7, marginBottom: 30 },
    shopBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20 },
    shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    timeline: {
        marginTop: 8,
        paddingHorizontal: 4,
    }
});
