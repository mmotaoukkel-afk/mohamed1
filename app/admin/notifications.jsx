/**
 * Admin Notifications - Kataraa
 * Push Notification Campaign Manager
 * 🔐 Protected by RequireAdmin
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AdminPageHeader, { PAGE_GRADIENTS } from '../../src/components/admin/AdminPageHeader';
import {
    ADMIN_COLORS,
    ADMIN_SHADOWS,
    BORDER_RADIUS
} from '../../src/constants/adminDesignTokens';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getCampaignHistory, sendCampaign } from '../../src/services/adminNotificationService';

const { width } = Dimensions.get('window');

export default function AdminNotifications() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t, locale } = useTranslation();
    const styles = getStyles(theme, isDark);

    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [history, setHistory] = useState([]);

    // Form State
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [target, setTarget] = useState('all_users');
    const [showTargetOptions, setShowTargetOptions] = useState(false);

    const loadHistory = async () => {
        setHistoryLoading(true);
        const data = await getCampaignHistory();
        setHistory(data);
        setHistoryLoading(false);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            Alert.alert(t('error'), t('pleaseEnterTitleAndMessage'));
            return;
        }

        Alert.alert(
            t('confirmSend'),
            t('confirmSendToTarget', { target: getTargetLabel(target) }),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('send'),
                    onPress: async () => {
                        setLoading(true);
                        const result = await sendCampaign({
                            title,
                            body,
                            target,
                            data: { type: 'campaign' } // Basic data payload
                        });

                        if (result.success) {
                            Alert.alert(t('success'), t('notificationSentToCount', { count: result.sent }));
                            setTitle('');
                            setBody('');
                            loadHistory();
                        } else {
                            Alert.alert(t('sendFailed'), result.message || t('unknownError'));
                        }
                        setLoading(false);
                    }
                }
            ]
        );
    };

    const getTargetLabel = (targetKey) => {
        switch (targetKey) {
            case 'all_users': return t('allUsers');
            case 'new_users': return t('newUsers7Days');
            case 'inactive_users': return t('inactiveUsers');
            default: return targetKey;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F8FAFC' }]}>
            <AdminPageHeader
                title={t('manageNotifications')}
                gradient={PAGE_GRADIENTS.notifications}
                onBack={() => router.back()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={historyLoading} onRefresh={loadHistory} tintColor={theme.primary} />}
            >
                {/* Compose Section */}
                <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('sendNewNotification')}</Text>

                    <Text style={[styles.label, { color: theme.textSecondary }]}>{t('title')}</Text>
                    <TextInput
                        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                        placeholder={t('titlePlaceholder')}
                        placeholderTextColor={theme.textMuted}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={[styles.label, { color: theme.textSecondary }]}>{t('message')}</Text>
                    <TextInput
                        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background, height: 100, textAlignVertical: 'top' }]}
                        placeholder={t('messagePlaceholder')}
                        placeholderTextColor={theme.textMuted}
                        multiline
                        value={body}
                        onChangeText={setBody}
                    />

                    <Text style={[styles.label, { color: theme.textSecondary }]}>{t('targetAudience')}</Text>
                    <TouchableOpacity
                        style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.background }]}
                        onPress={() => setShowTargetOptions(!showTargetOptions)}
                    >
                        <Text style={{ color: theme.text }}>{getTargetLabel(target)}</Text>
                        <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {showTargetOptions && (
                        <View style={[styles.optionsContainer, { borderColor: theme.border, backgroundColor: theme.backgroundCard }]}>
                            {['all_users', 'new_users'].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.optionItem, target === t && { backgroundColor: theme.primary + '20' }]}
                                    onPress={() => { setTarget(t); setShowTargetOptions(false); }}
                                >
                                    <Text style={{ color: theme.text }}>{getTargetLabel(t)}</Text>
                                    {target === t && <Ionicons name="checkmark" size={18} color={theme.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: theme.primary }]}
                        onPress={handleSend}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="paper-plane" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('sendNow')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Integration Info */}
                <View style={[styles.infoBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <Ionicons name="information-circle" size={24} color="#3B82F6" />
                    <Text style={{ flex: 1, marginLeft: 10, color: '#1E40AF', fontSize: 13 }}>
                        {t('expoNotificationInfo')}
                    </Text>
                </View>

                {/* History Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 100 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('sendingHistory')}</Text>

                    {history.length === 0 ? (
                        <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>{t('noPreviousHistory')}</Text>
                    ) : (
                        history.map((item) => (
                            <View key={item.id} style={[styles.historyItem, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.historyTitle, { color: theme.text }]}>{item.title}</Text>
                                    <Text style={[styles.historyBody, { color: theme.textSecondary }]} numberOfLines={2}>{item.body}</Text>
                                    <Text style={[styles.historyMeta, { color: theme.textMuted }]}>
                                        {item.sentAt?.toLocaleDateString ? item.sentAt.toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'en-US') : t('justNow')} • {getTargetLabel(item.target)}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                                        <Text style={{ color: '#166534', fontSize: 10, fontWeight: 'bold' }}>{t('sentCount', { count: item.totalSent })}</Text>
                                    </View>
                                    {item.totalFailed > 0 && (
                                        <View style={[styles.badge, { backgroundColor: '#FEE2E2', marginTop: 4 }]}>
                                            <Text style={{ color: '#991B1B', fontSize: 10 }}>{t('failedCount', { count: item.totalFailed })}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
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
        margin: 16,
        borderRadius: BORDER_RADIUS.xl,
        padding: 24,
        paddingBottom: 30,
        backgroundColor: isDark ? ADMIN_COLORS.neutral[800] : '#fff',
        ...ADMIN_SHADOWS.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'right', // Align right for Arabic
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        marginTop: 12,
        fontWeight: '600',
        textAlign: 'right', // Align right for Arabic
    },
    input: {
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.lg,
        padding: 14,
        fontSize: 15,
        textAlign: 'right', // RTL input
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.lg,
        padding: 14,
        flexDirection: 'row-reverse', // RTL dropdown
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionsContainer: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: BORDER_RADIUS.lg,
        borderBottomRightRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginTop: -4,
        zIndex: 10,
    },
    optionItem: {
        padding: 14,
        flexDirection: 'row-reverse', // RTL option
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? ADMIN_COLORS.neutral[700] : ADMIN_COLORS.neutral[200],
    },
    sendBtn: {
        marginTop: 24,
        padding: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...ADMIN_SHADOWS.sm,
    },
    infoBox: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: BORDER_RADIUS.lg,
        flexDirection: 'row-reverse', // RTL info
        alignItems: 'center',
        borderWidth: 1,
    },
    historyItem: {
        flexDirection: 'row-reverse', // RTL history item
        padding: 16,
        marginBottom: 12,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        ...ADMIN_SHADOWS.sm,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'right',
    },
    historyBody: {
        fontSize: 13,
        marginBottom: 8,
        textAlign: 'right',
    },
    historyMeta: {
        fontSize: 11,
        textAlign: 'right',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
        alignItems: 'center',
    },
});
