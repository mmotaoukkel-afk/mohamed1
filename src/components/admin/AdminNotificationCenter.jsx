import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Dimensions,
    FlatList,
    I18nManager,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ADMIN_COLORS } from '../../constants/adminDesignTokens';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export const AdminNotificationCenter = ({ visible, onClose }) => {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const { adminNotifications: alerts, markAsRead, adminUnreadCount } = useNotifications();
    const { isAdmin } = useAuth();

    const styles = getStyles(theme, isDark);

    const handleAlertPress = (alert) => {
        markAsRead(alert.id);
        onClose();
        const type = alert.params?.type || alert.type;
        const id = alert.params?.id;

        if (type === 'order') {
            router.push(`/admin/order/${id}`);
        } else if (type === 'review') {
            router.push('/admin/reviews');
        } else if (type === 'stock') {
            router.push(`/admin/products?search=${alert.params?.name}`);
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'order': return { name: 'bag-handle', color: ADMIN_COLORS.success.main, label: 'طلب جديد' };
            case 'review': return { name: 'star', color: ADMIN_COLORS.warning.main, label: 'تقييم جديد' };
            case 'stock': return { name: 'warning', color: ADMIN_COLORS.error.main, label: 'تنبيه مخزون' };
            case 'test': return { name: 'flask', color: ADMIN_COLORS.primary.main, label: 'تجربة إشعار' };
            default: return { name: 'notifications', color: ADMIN_COLORS.info.main, label: 'تنبيه إداري' };
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={[styles.title, { color: theme.text }]}>مركز التنبيهات الإدارية</Text>
                            <View style={styles.adminBadge}>
                                <Text style={styles.adminBadgeText}>إدارة</Text>
                            </View>
                        </View>
                    </View>

                    {alerts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + '10' }]}>
                                <Ionicons name="notifications-off-outline" size={60} color={theme.textMuted} />
                            </View>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>لا توجد تنبيهات جديدة للمسؤولين</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={alerts}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => {
                                const icon = getAlertIcon(item.type);
                                const isUnread = !item.read;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.alertItem,
                                            {
                                                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                                backgroundColor: isUnread ? (isDark ? 'rgba(79, 70, 229, 0.1)' : '#F5F7FF') : 'transparent'
                                            }
                                        ]}
                                        onPress={() => handleAlertPress(item)}
                                    >
                                        <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                                            <Ionicons name={icon.name} size={22} color={icon.color} />
                                        </View>

                                        <View style={styles.alertBody}>
                                            <View style={styles.itemHeader}>
                                                <Text style={[styles.alertTime, { color: theme.textMuted }]}>
                                                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                                <View style={[styles.typeBadge, { backgroundColor: icon.color + '10' }]}>
                                                    <Text style={[styles.typeBadgeText, { color: icon.color }]}>{icon.label}</Text>
                                                </View>
                                            </View>

                                            <Text style={[styles.alertTitle, { color: theme.text, fontWeight: isUnread ? '800' : '600' }]}>{item.title}</Text>
                                            <Text style={[styles.alertText, { color: theme.textSecondary }]} numberOfLines={2}>
                                                {item.message}
                                            </Text>

                                            {isUnread && <View style={[styles.unreadDot, { backgroundColor: ADMIN_COLORS.primary.main }]} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            contentContainerStyle={styles.listContainer}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const getStyles = (theme, isDark) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: height * 0.75,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    adminBadge: {
        backgroundColor: ADMIN_COLORS.primary.main,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    adminBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(150,150,150,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 40,
    },
    alertItem: {
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        padding: 20,
        borderBottomWidth: 1,
        position: 'relative',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: I18nManager.isRTL ? 0 : 16,
        marginLeft: I18nManager.isRTL ? 16 : 0,
    },
    alertBody: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    alertTitle: {
        fontSize: 16,
        marginBottom: 6,
        textAlign: I18nManager.isRTL ? 'right' : 'left',
    },
    alertText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: I18nManager.isRTL ? 'right' : 'left',
    },
    alertTime: {
        fontSize: 11,
        fontWeight: '600',
    },
    unreadDot: {
        position: 'absolute',
        top: 2,
        right: I18nManager.isRTL ? -24 : 'auto',
        left: I18nManager.isRTL ? 'auto' : -24,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 80,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 40,
        opacity: 0.8,
    }
});
