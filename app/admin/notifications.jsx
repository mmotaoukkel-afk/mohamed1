/**
 * Admin Notifications - Kataraa
 * Exclusive alerts for administrators (New Orders, New Users)
 * 🔐 Protected by RequireAdmin
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { getAdminAlerts, sendBroadcast, triggerAdminAlert } from '../../src/services/adminNotificationService';
import { Text as UIText, Surface, Button } from '../../src/components/ui';
import { useNotifications } from '../../src/context/NotificationContext';

export default function AdminNotifications() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const { expoPushToken } = useNotifications();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAdminAlerts();
            setAlerts(data);
        } catch (error) {
            console.error('Error loading admin alerts:', error);
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

    const getAlertStyle = (type) => {
        switch (type) {
            case 'order': return { icon: 'cart', color: '#10B981', bg: '#D1FAE5' };
            case 'user': return { icon: 'person-add', color: '#6366F1', bg: '#E0E7FF' };
            default: return { icon: 'notifications', color: theme.primary, bg: theme.backgroundCard };
        }
    };

    const renderAlert = ({ item }) => {
        const style = getAlertStyle(item.type);
        const time = item.createdAt?.toDate?.() || new Date();

        return (
            <Surface variant="glass" radius="lg" padding="md" style={styles.alertCard}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? theme.backgroundCard : style.bg }]}>
                    <Ionicons name={style.icon} size={24} color={style.color} />
                </View>
                <View style={styles.alertBody}>
                    <View style={styles.alertHeader}>
                        <UIText weight="bold" style={styles.alertTitle}>{item.title}</UIText>
                        <UIText variant="caption" style={{ color: theme.textMuted }}>
                            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </UIText>
                    </View>
                    <UIText variant="body" style={{ color: theme.textSecondary, marginTop: 4 }}>{item.body}</UIText>

                    {item.type === 'order' && (
                        <TouchableOpacity
                            style={styles.actionLink}
                            onPress={() => router.push('/admin/orders')}
                        >
                            <UIText variant="label" weight="bold" style={{ color: theme.primary }}>مشاهدة الطلب ←</UIText>
                        </TouchableOpacity>
                    )}
                </View>
            </Surface>
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
                        <Text style={styles.headerTitle}>إشعارات الإدارة</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.testBar}>
                <Button
                    title="إرسال إشعارات تجريبية"
                    onPress={async () => {
                        try {
                            setTestLoading(true);
                            // Trigger both
                            await sendBroadcast({
                                title: 'تخفيضات تجريبية! ✨',
                                body: 'إذا كنت ترى هذا، فنظام الإعلانات العامة يعمل.',
                            });
                            await triggerAdminAlert({
                                type: 'system',
                                title: 'اختبار النظام',
                                body: 'نظام إشعارات الإدارة يعمل بشكل صحيح.',
                            });
                            fetchData();
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setTestLoading(false);
                        }
                    }}
                    loading={testLoading}
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    icon={<Ionicons name="flask-outline" size={16} color={theme.primary} />}
                />
            </View>

            <FlatList
                data={alerts}
                keyExtractor={item => item.id}
                renderItem={renderAlert}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                ListHeaderComponent={
                    <UIText variant="caption" style={[styles.sectionHint, { color: theme.textSecondary }]}>
                        هذه القائمة خاصة بك كمشرف فقط، وتتضمن تنبيهات بخصوص نشاط المتجر.
                    </UIText>
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.empty}>
                            <Ionicons name="notifications-off-outline" size={64} color={theme.textMuted} />
                            <UIText style={{ color: theme.textSecondary, marginTop: 16 }}>لا توجد تنبيهات إدارية جديدة</UIText>
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
    list: { padding: 16 },
    sectionHint: {
        textAlign: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: 10,
        borderRadius: 8,
    },
    alertCard: {
        flexDirection: 'row-reverse',
        marginBottom: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    alertBody: { flex: 1 },
    alertHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    alertTitle: { fontSize: 15 },
    actionLink: { marginTop: 10 },
    testBar: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        flexDirection: 'row',
        gap: 12,
    },
    empty: {
        alignItems: 'center',
        paddingTop: 100,
    },
});
