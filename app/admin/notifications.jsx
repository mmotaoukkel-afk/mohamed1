/**
 * Admin Notifications - Kataraa
 * Business operations alerts and updates
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function AdminNotifications() {
    const { theme, isDark } = useTheme();
    const { adminNotifications, markAsRead, markAllAsRead, clearNotifications, loading } = useNotifications();
    const router = useRouter();
    const styles = getStyles(theme, isDark);

    const onRefresh = () => {
        // Handled by context automatically usually, but could trigger a reload if needed
    };

    const renderNotification = ({ item }) => {
        const isUnread = !item.read;
        const config = getNotificationConfig(item.type, theme);

        return (
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    { backgroundColor: theme.backgroundCard },
                    isUnread && styles.unreadCard
                ]}
                onPress={() => {
                    markAsRead(item.id);
                    if (item.params?.orderId) router.push(`/admin/order/${item.params.orderId}`);
                    if (item.params?.customerId) router.push(`/admin/customers`); // Profile modal would be better but this works
                }}
            >
                <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon} size={22} color={config.color} />
                </View>
                <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: theme.text }]}>{item.title}</Text>
                        <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
                            {formatTime(item.time)}
                        </Text>
                    </View>
                    <Text style={[styles.notifMessage, { color: theme.textSecondary }]} numberOfLines={2}>
                        {item.message}
                    </Text>
                    {isUnread && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>تنبيهات العمليات</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.headerBtn} onPress={markAllAsRead}>
                                <Ionicons name="checkmark-done" size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerBtn} onPress={clearNotifications}>
                                <Ionicons name="trash-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                data={adminNotifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundCard }]}>
                            <Ionicons name="notifications-off-outline" size={64} color={theme.textMuted} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>لا توجد تنبيهات</Text>
                        <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                            ستظهر هنا التنبيهات المتعلقة بالطلبات والزبائن والمخزون.
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            />
        </View>
    );
}

const getNotificationConfig = (type, theme) => {
    switch (type) {
        case 'order':
            return { icon: 'cart', color: '#6366F1' };
        case 'customer':
            return { icon: 'person-add', color: '#F59E0B' };
        case 'stock':
            return { icon: 'warning', color: '#EF4444' };
        case 'review':
            return { icon: 'star', color: '#10B981' };
        default:
            return { icon: 'notifications', color: theme.primary };
    }
};

const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دق`;
    if (hours < 24) return `منذ ${hours} سا`;
    return `منذ ${days} يو`;
};

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
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerBtn: {
        padding: 8,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#6366F1', // Indigo for admin unread
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifContent: {
        flex: 1,
        marginLeft: 16,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    notifTime: {
        fontSize: 11,
    },
    notifMessage: {
        fontSize: 13,
        lineHeight: 18,
    },
    unreadDot: {
        position: 'absolute',
        right: -8,
        top: '50%',
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: -4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
