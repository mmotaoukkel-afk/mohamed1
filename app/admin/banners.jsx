/**
 * Admin Banner Manager - Kataraa
 * Manage Home Screen Promotional Carousel
 * 🔐 Protected by RequireAdmin
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    FlatList,
    Image,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Text, Button, Surface } from '../../src/components/ui';
import { getAllBanners, addBanner, updateBanner, deleteBanner } from '../../src/services/adminBannerService';

export default function AdminBanners() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [form, setForm] = useState({
        title: '',
        imageUrl: '',
        link: '',
        isActive: true
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllBanners();
            setBanners(data);
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        if (!form.imageUrl) {
            Alert.alert('خطأ', 'يرجى إدخال رابط الصورة');
            return;
        }

        try {
            setLoading(true);
            if (editingBanner) {
                await updateBanner(editingBanner.id, form);
                Alert.alert('تم التحديث', 'تم تحديث البانر بنجاح');
            } else {
                await addBanner(form);
                Alert.alert('تمت الإضافة', 'تم إضافة البانر بنجاح');
            }
            setShowForm(false);
            setEditingBanner(null);
            setForm({ title: '', imageUrl: '', link: '', isActive: true });
            fetchData();
        } catch (error) {
            Alert.alert('خطأ', 'فشل في حفظ البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'حذف البانر',
            'هل أنت متأكد من حذف هذا البانر؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteBanner(id);
                            fetchData();
                        } catch (e) {
                            Alert.alert('خطأ', 'فشل في الحذف');
                        }
                    }
                }
            ]
        );
    };

    const toggleStatus = async (item) => {
        try {
            await updateBanner(item.id, { isActive: !item.isActive });
            setBanners(prev => prev.map(b => b.id === item.id ? { ...b, isActive: !item.isActive } : b));
        } catch (e) {
            Alert.alert('خطأ', 'فشل في تغيير الحالة');
        }
    };

    const renderBanner = ({ item }) => (
        <Surface variant="glass" radius="lg" style={styles.bannerItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.bannerPreview} resizeMode="cover" />
            <View style={styles.bannerInfo}>
                <View style={styles.bannerHeader}>
                    <Text weight="bold" style={styles.bannerTitle}>{item.title || 'بدون عنوان'}</Text>
                    <Switch
                        value={item.isActive}
                        onValueChange={() => toggleStatus(item)}
                        trackColor={{ true: theme.primary }}
                    />
                </View>
                <Text variant="caption" style={{ color: theme.textSecondary }}>{item.link || 'لا يوجد رابط'}</Text>
                <View style={styles.bannerActions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            setEditingBanner(item);
                            setForm({
                                title: item.title,
                                imageUrl: item.imageUrl,
                                link: item.link,
                                isActive: item.isActive
                            });
                            setShowForm(true);
                        }}
                    >
                        <Ionicons name="pencil" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </Surface>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>تسيير الواجهة (Banners)</Text>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => {
                                setEditingBanner(null);
                                setForm({ title: '', imageUrl: '', link: '', isActive: true });
                                setShowForm(!showForm);
                            }}
                        >
                            <Ionicons name={showForm ? "close" : "add"} size={26} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {showForm ? (
                <ScrollView contentContainerStyle={styles.formContent}>
                    <Surface variant="elevated" radius="xl" padding="lg">
                        <Text variant="label" style={styles.label}>عنوان البانر (اختياري)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#333' : '#F5F5F5', color: theme.text }]}
                            value={form.title}
                            onChangeText={(t) => setForm({ ...form, title: t })}
                            placeholder="مثال: خصومات الربيع"
                        />

                        <Text variant="label" style={styles.label}>رابط الصورة (URL)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#333' : '#F5F5F5', color: theme.text }]}
                            value={form.imageUrl}
                            onChangeText={(t) => setForm({ ...form, imageUrl: t })}
                            placeholder="https://example.com/image.jpg"
                        />

                        <Text variant="label" style={styles.label}>رابط التوجيه (Redirect Link)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#333' : '#F5F5F5', color: theme.text }]}
                            value={form.link}
                            onChangeText={(t) => setForm({ ...form, link: t })}
                            placeholder="مثال: /category/serum"
                        />

                        {form.imageUrl ? (
                            <View style={styles.previewContainer}>
                                <Text variant="label" style={{ marginBottom: 10 }}>معاينة الصورة:</Text>
                                <Image source={{ uri: form.imageUrl }} style={styles.livePreview} resizeMode="cover" />
                            </View>
                        ) : null}

                        <Button
                            title={editingBanner ? "تحديث البانر" : "إضافة البانر"}
                            onPress={handleSave}
                            loading={loading}
                            style={{ marginTop: 20 }}
                        />
                    </Surface>
                </ScrollView>
            ) : (
                <FlatList
                    data={banners}
                    keyExtractor={item => item.id}
                    renderItem={renderBanner}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.empty}>
                                <Ionicons name="images-outline" size={64} color={theme.textMuted} />
                                <Text style={{ color: theme.textSecondary, marginTop: 16 }}>لا توجد بانرات حالياً</Text>
                            </View>
                        )
                    }
                />
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
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: { padding: 16 },
    bannerItem: {
        marginBottom: 16,
        overflow: 'hidden',
    },
    bannerPreview: {
        width: '100%',
        height: 150,
    },
    bannerInfo: {
        padding: 12,
    },
    bannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerTitle: {
        fontSize: 16,
    },
    bannerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        gap: 15,
    },
    actionBtn: {
        padding: 5,
    },
    formContent: { padding: 20 },
    label: { marginTop: 15, marginBottom: 5 },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    previewContainer: {
        marginTop: 20,
    },
    livePreview: {
        width: '100%',
        height: 120,
        borderRadius: 12,
    },
    empty: {
        alignItems: 'center',
        paddingTop: 100,
    },
});
