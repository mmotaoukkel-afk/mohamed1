import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useTranslation } from '../src/hooks/useTranslation';
import { useNotifications } from '../src/context/NotificationContext';

export default function NotificationsScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t, locale } = useTranslation();
    const { notifications, markAllAsRead, clearNotifications, loading } = useNotifications();
    const styles = getStyles(theme, isDark, locale);

    useEffect(() => {
        // Mark all as read when entering the screen
        markAllAsRead();
    }, []);

    const renderItem = ({ item }) => (
        <View style={[styles.card, !item.read && styles.unreadCard]}>
            <View style={[styles.iconContainer, !item.read && styles.unreadIcon]}>
                <Ionicons
                    name={item.type === 'success' ? 'checkmark-circle' : 'notifications'}
                    size={24}
                    color={item.type === 'success' ? theme.success : (item.read ? theme.textSecondary : theme.primary)}
                />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{t(item.title)}</Text>
                <Text style={styles.message}>{t(item.message, item.params || {})}</Text>
                <Text style={styles.time}>
                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            {!item.read && <View style={styles.dot} />}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                    style={styles.backBtn}
                >
                    <Ionicons name={locale === 'ar' ? "arrow-forward" : "arrow-back"} size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('notifications')}</Text>
                {notifications.length > 0 ? (
                    <TouchableOpacity onPress={clearNotifications}>
                        <Text style={styles.clearBtn}>{t('clearAll')}</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 40 }} />}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={theme.primary} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={80} color={theme.textMuted} />
                    <Text style={styles.emptyTitle}>{t('noNotifications')}</Text>
                    <Text style={styles.emptySubtitle}>
                        {t('notifEmptyMsg')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const getStyles = (theme, isDark, locale) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: theme.background,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: theme.backgroundCard,
    },
    clearBtn: {
        color: theme.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: theme.backgroundCard,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    unreadCard: {
        backgroundColor: isDark ? '#1A1A2E' : '#FFF5F8',
        borderWidth: 1,
        borderColor: theme.primary + '30',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDark ? '#333' : '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: locale === 'ar' ? 0 : 12,
        marginLeft: locale === 'ar' ? 12 : 0,
    },
    unreadIcon: {
        backgroundColor: theme.primary + '15',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
        textAlign: locale === 'ar' ? 'right' : 'left',
    },
    message: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 8,
        lineHeight: 20,
        textAlign: locale === 'ar' ? 'right' : 'left',
    },
    time: {
        fontSize: 12,
        color: theme.textMuted,
        textAlign: locale === 'ar' ? 'right' : 'left',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.primary,
        marginTop: 6,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
});
