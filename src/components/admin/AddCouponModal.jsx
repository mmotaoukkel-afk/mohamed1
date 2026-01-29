import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Text, Button, Surface } from '../ui';
import { createCoupon, updateCoupon } from '../../services/adminCouponService';

const AddCouponModal = ({ visible, onClose, onSuccess, editCoupon }) => {
    const { tokens, isDark } = useTheme();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        code: '',
        type: 'percentage', // percentage | fixed
        value: '',
        minOrder: '',
        maxDiscount: '',
        usageLimit: '',
        isActive: true,
        description: '',
    });

    useEffect(() => {
        if (editCoupon) {
            setForm({
                code: editCoupon.code,
                type: editCoupon.type,
                value: String(editCoupon.value),
                minOrder: editCoupon.minOrder ? String(editCoupon.minOrder) : '',
                maxDiscount: editCoupon.maxDiscount ? String(editCoupon.maxDiscount) : '',
                usageLimit: editCoupon.usageLimit ? String(editCoupon.usageLimit) : '',
                isActive: editCoupon.isActive,
                description: editCoupon.description || '',
            });
        } else {
            setForm({
                code: '',
                type: 'percentage',
                value: '',
                minOrder: '',
                maxDiscount: '',
                usageLimit: '',
                isActive: true,
                description: '',
            });
        }
    }, [editCoupon, visible]);

    const handleSave = async () => {
        if (!form.code || !form.value) {
            Alert.alert('خطأ', 'يرجى ملء الحقول الأساسية (الكود والقيمة)');
            return;
        }

        try {
            setLoading(true);
            const data = {
                ...form,
                value: parseFloat(form.value),
                minOrder: form.minOrder ? parseFloat(form.minOrder) : 0,
                maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
                usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
            };

            if (editCoupon) {
                await updateCoupon(editCoupon.id, data);
            } else {
                await createCoupon(data);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Save coupon error:', error);
            Alert.alert('خطأ', 'فشل في حفظ الكوبون');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <Surface variant="elevated" radius="xl" style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text variant="title">
                            {editCoupon ? 'تعديل كوبون' : 'إضافة كوبون جديد'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={tokens.colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Coupon Code */}
                        <Text variant="label" style={styles.label}>كود الخصم (مثلاً: WELCOME10)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: tokens.colors.text }]}
                            value={form.code}
                            onChangeText={(val) => setForm({ ...form, code: val.toUpperCase() })}
                            autoCapitalize="characters"
                            placeholder="WINTER2024"
                            placeholderTextColor={tokens.colors.textMuted}
                        />

                        {/* Type Picker */}
                        <Text variant="label" style={styles.label}>نوع الخصم</Text>
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[
                                    styles.typeBtn,
                                    form.type === 'percentage' && { backgroundColor: tokens.colors.primary }
                                ]}
                                onPress={() => setForm({ ...form, type: 'percentage' })}
                            >
                                <Text style={{ color: form.type === 'percentage' ? '#FFF' : tokens.colors.textSecondary }}>نسبة مئوية (%)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeBtn,
                                    form.type === 'fixed' && { backgroundColor: tokens.colors.primary }
                                ]}
                                onPress={() => setForm({ ...form, type: 'fixed' })}
                            >
                                <Text style={{ color: form.type === 'fixed' ? '#FFF' : tokens.colors.textSecondary }}>مبلغ ثابت (درهم)</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Value */}
                        <Text variant="label" style={styles.label}>قيمة الخصم</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: tokens.colors.text }]}
                            value={form.value}
                            onChangeText={(val) => setForm({ ...form, value: val })}
                            keyboardType="numeric"
                            placeholder={form.type === 'percentage' ? 'مثلاً: 15' : 'مثلاً: 50'}
                            placeholderTextColor={tokens.colors.textMuted}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text variant="label" style={styles.label}>الحد الأدنى للطلب</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: tokens.colors.text }]}
                                    value={form.minOrder}
                                    onChangeText={(val) => setForm({ ...form, minOrder: val })}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={tokens.colors.textMuted}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text variant="label" style={styles.label}>الحد الأقصى للخصم</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: tokens.colors.text }]}
                                    value={form.maxDiscount}
                                    onChangeText={(val) => setForm({ ...form, maxDiscount: val })}
                                    keyboardType="numeric"
                                    placeholder="اختياري"
                                    placeholderTextColor={tokens.colors.textMuted}
                                />
                            </View>
                        </View>

                        <Text variant="label" style={styles.label}>عدد المرات المسموح بها (Limit)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: tokens.colors.text }]}
                            value={form.usageLimit}
                            onChangeText={(val) => setForm({ ...form, usageLimit: val })}
                            keyboardType="numeric"
                            placeholder="مثلاً: 100 (اتركه فارغاً للا نهائي)"
                            placeholderTextColor={tokens.colors.textMuted}
                        />

                        <View style={styles.switchRow}>
                            <Text variant="label">الحالة (نشط / غير نشط)</Text>
                            <Switch
                                value={form.isActive}
                                onValueChange={(val) => setForm({ ...form, isActive: val })}
                                trackColor={{ false: '#767577', true: tokens.colors.primary }}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button
                            title={editCoupon ? 'حفظ التعديلات' : 'إنشاء الكوبون'}
                            onPress={handleSave}
                            loading={loading}
                            fullWidth
                        />
                    </View>
                </Surface>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        height: '85%',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    content: {
        padding: 20,
    },
    label: {
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        marginTop: 8,
    },
    typeBtn: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginRight: 8,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footer: {
        padding: 20,
    },
});

export default AddCouponModal;
