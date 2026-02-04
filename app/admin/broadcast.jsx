/**
 * Admin Broadcast - Kataraa
 * Send push notifications to all users
 * 🔐 Protected by RequireAdmin
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Text, Button, Surface } from '../../src/components/ui';
import { sendBroadcast } from '../../src/services/adminNotificationService';

export default function AdminBroadcast() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [form, setForm] = useState({ title: '', body: '' });
    const [deviceCount, setDeviceCount] = useState(null);

    // Import service dynamically or ensure it imports new functions
    // We need useEffect to load count
    React.useEffect(() => {
        const loadCount = async () => {
            try {
                // Dynamic import to avoid cycles or ensure freshness
                const { getReachabilityCount } = await import('../../src/services/adminNotificationService');
                const count = await getReachabilityCount();
                setDeviceCount(count);
            } catch (e) {
                console.error(e);
            }
        };
        loadCount();
    }, []);

    const handleSend = async () => {
        if (!form.title || !form.body) {
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
            return;
        }

        if (deviceCount === 0) {
            Alert.alert('تنبيه', 'لا توجد أجهزة مسجلة لاستلام الإشعارات. جرب فتح التطبيق من هاتف حقيقي.');
            return;
        }

        Alert.alert(
            'تأكيد الإرسال',
            `سيتم الإرسال إلى ${deviceCount || '?'} جهاز. هل أنت متأكد؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'إرسال الآن',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const result = await sendBroadcast({
                                title: form.title,
                                body: form.body,
                            });
                            Alert.alert('تم الإرسال', `تم إرسال الإشعار بنجاح إلى ${result.count} جهاز.`);
                            setForm({ title: '', body: '' });
                        } catch (error) {
                            Alert.alert('خطأ', 'فشل في إرسال الإشعار الجماعي');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleTestSend = async () => {
        try {
            setTestLoading(true);
            const { useNotifications } = await import('../../src/context/NotificationContext');
            // We can't use hook inside async callback, so we assume we are testing on THIS device.
            // But we can't access context here easily without being inside the component flow properly.
            // Better approach: Get token from context (need to update component to use hook)

            // Re-implementing simplified test fetch because hooking context dynamically is tricky
            // We'll rely on the user knowing they need to be logged in and valid.

            // Actually, let's just use the service if check passed
            const { sendTestNotification } = await import('../../src/services/adminNotificationService');

            // We need a token. We don't have access to MY token here easily unless we use the hook at top level.
            // Let's Alert user for now.
        } catch (e) { }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>إرسال إشعار جماعي</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Surface variant="elevated" radius="xl" padding="lg" style={styles.formCard}>

                    {/* Reachability Banner */}
                    <View style={[
                        styles.infoBox,
                        { backgroundColor: deviceCount === 0 ? '#FEF2F2' : 'rgba(99, 102, 241, 0.1)' }
                    ]}>
                        <Ionicons
                            name={deviceCount === 0 ? "warning" : "people"}
                            size={24}
                            color={deviceCount === 0 ? "#EF4444" : theme.primary}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text variant="caption" style={{ color: theme.text, fontWeight: 'bold' }}>
                                {deviceCount !== null ? `${deviceCount} جهاز نشط` : 'جاري التحميل...'}
                            </Text>
                            <Text variant="caption" style={{ color: theme.textSecondary }}>
                                {deviceCount === 0
                                    ? "⚠️ تنبيه: لا توجد أجهزة مسجلة. الإشعارات لن تصل لأحد. تأكد من فتح التطبيق على هاتف حقيقي."
                                    : "سيصل الإشعار لجميع هؤلاء الزبناء."}
                            </Text>
                        </View>
                    </View>

                    <TestNotificationButton />

                    <Text variant="label" style={styles.label}>عنوان الإشعار (Title)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: theme.text }]}
                        value={form.title}
                        onChangeText={(t) => setForm({ ...form, title: t })}
                        placeholder="خصم هائل بمناسبة العيد! 🎉"
                        placeholderTextColor={theme.textMuted}
                    />

                    <Text variant="label" style={styles.label}>نص الرسالة (Body)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: theme.text }]}
                        value={form.body}
                        onChangeText={(t) => setForm({ ...form, body: t })}
                        placeholder="استعمل كود EID25 للحصول على تخفيض 25% على جميع المنتجات الكورية."
                        placeholderTextColor={theme.textMuted}
                        multiline
                        numberOfLines={4}
                    />

                    <View style={styles.preview}>
                        <Text variant="label" style={{ marginBottom: 10 }}>معاينة (Preview):</Text>
                        <View style={[styles.notifPreview, { backgroundColor: isDark ? '#333' : '#EEE' }]}>
                            <View style={styles.previewIcon} />
                            <View style={{ flex: 1 }}>
                                <Text weight="bold" style={{ fontSize: 13 }}>{form.title || 'العنوان يظهر هنا'}</Text>
                                <Text style={{ fontSize: 12 }}>{form.body || 'نص الرسالة يظهر هنا...'}</Text>
                            </View>
                        </View>
                    </View>

                    <Button
                        title="إرسال للجميع الآن"
                        onPress={handleSend}
                        loading={loading}
                        variant="primary"
                        style={{ marginTop: 20 }}
                        icon={<Ionicons name="send" size={20} color="#FFF" />}
                        disabled={deviceCount === 0}
                    />
                </Surface>
            </ScrollView>
        </View>
    );
}

// Separate component to hook into context easily
function TestNotificationButton() {
    const { expoPushToken, registrationError } = require('../../src/context/NotificationContext').useNotifications();
    const { theme } = useTheme(); // Added useTheme hook
    const [sending, setSending] = React.useState(false);
    const [showDetails, setShowDetails] = React.useState(false);

    const sendTest = async () => {
        if (!expoPushToken) {
            Alert.alert(
                'مشكلة في الجهاز',
                `هذا الجهاز ليس مسجلاً في الإشعارات.\nالسبب: ${registrationError || 'غير معروف (ربما محاكي؟)'}`
            );
            return;
        }
        setSending(true);
        try {
            const { sendTestNotification } = await import('../../src/services/adminNotificationService');

            // Show toast or alert
            const result = await sendTestNotification(expoPushToken);
            if (result.success) {
                Alert.alert('✅ تم الإرسال من السيرفر', 'تم قبول الطلب من طرف Expo.\n\nإذا لم يصلك الإشعار، فهذا يعني:\n1. القناة (Channel) في Android محظورة.\n2. أو أن الهاتف في وضع "عدم الإزعاج".');
            } else {
                Alert.alert('❌ رفض من السيرفر', `التفاصيل:\n${result.error}\n\nتأكد من Project ID.`);
            }
        } catch (e) {
            Alert.alert('خطأ', 'حدث خطأ غير متوقع: ' + e.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <TouchableOpacity
                    onPress={() => setShowDetails(!showDetails)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                >
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>
                        {showDetails ? '👁️ إخفاء التفاصيل' : '🛠️ عرض التفاصيل التقنية'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={sendTest} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {sending ? <ActivityIndicator size="small" color="#6366F1" /> : <Ionicons name="construct-outline" size={16} color="#6366F1" />}
                    <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '600' }}>
                        {sending ? 'جاري الفحص...' : 'فحص استلام الإشعار'}
                    </Text>
                </TouchableOpacity>
            </View>

            {showDetails && (
                <View style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontFamily: 'monospace', color: theme.text }}>
                        Token: {expoPushToken || 'None'}
                    </Text>
                    {registrationError && (
                        <Text style={{ fontSize: 10, color: '#EF4444', marginTop: 4 }}>
                            Error: {registrationError}
                        </Text>
                    )}
                </View>
            )}

            {/* Status Line */}
            {!expoPushToken && (
                <Text style={{ color: '#EF4444', fontSize: 10, textAlign: 'right', marginTop: 4 }}>
                    ⚠️ غير جاهز للاستلام: {registrationError || 'بدون توكن'}
                </Text>
            )}
            {expoPushToken && (
                <Text style={{ color: '#10B981', fontSize: 10, textAlign: 'right', marginTop: 4 }}>
                    ✅ التوكن جاهز
                </Text>
            )}
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
    content: { padding: 20 },
    formCard: { gap: 10 },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    label: { marginTop: 10 },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    preview: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    notifPreview: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    previewIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#6366F1',
    },
});
