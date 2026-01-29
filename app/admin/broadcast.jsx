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
    const [form, setForm] = useState({ title: '', body: '' });

    const handleSend = async () => {
        if (!form.title || !form.body) {
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
            return;
        }

        Alert.alert(
            'تأكيد الإرسال',
            'هل أنت متأكد من إرسال هذا الإشعار لجميع الزبناء؟ لا يمكن التراجع عن هذه الخطوة.',
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
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                        <Text variant="caption" style={{ color: theme.textSecondary, flex: 1, marginLeft: 10 }}>
                            سيصل هذا الإشعار لجميع الزبناء الذين حملوا التطبيق وقاموا بتفعيل الإشعارات.
                        </Text>
                    </View>

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
                    />
                </Surface>
            </ScrollView>
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
