/**
 * AddProductModal - Kataraa
 * Modal form for creating/editing products
 * 🔐 Admin only
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import {
    PRODUCT_CATEGORIES,
    DEFAULT_PRODUCT,
    generateSKU,
    createProduct,
    updateProduct,
} from '../../services/adminProductService';
import { uploadImage } from '../../services/imageUploadService';

const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    'https://images.unsplash.com/photo-1556227702-d1e4e7b5c232?w=400',
];

export default function AddProductModal({ visible, onClose, onSuccess, editProduct = null }) {
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);

    const isEditing = !!editProduct;

    const [formData, setFormData] = useState(DEFAULT_PRODUCT);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (editProduct) {
            setFormData(editProduct);
            setSelectedCategory(editProduct.category || '');
        } else {
            setFormData(DEFAULT_PRODUCT);
            setSelectedCategory('');
        }
    }, [editProduct, visible]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
        handleChange('category', categoryId);

        // Auto-generate SKU when category is selected
        if (formData.name && !formData.sku) {
            handleChange('sku', generateSKU(categoryId, formData.name));
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            handleChange('tags', [...formData.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag) => {
        handleChange('tags', formData.tags.filter(t => t !== tag));
    };

    const handleAddImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert('مطلوب إذن', 'يرجى السماح بالوصول إلى الصور لإضافة صور للمنتج.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 4], // Square for products usually good
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setUploading(true);
                const uri = result.assets[0].uri;

                try {
                    // Upload to Firebase
                    const downloadUrl = await uploadImage(uri, 'products');

                    // Add to form data
                    handleChange('images', [...formData.images, { src: downloadUrl }]);
                } catch (error) {
                    Alert.alert('خطأ', 'فشل رفع الصورة. يرجى المتابعة لاحقا.');
                    // Fallback for demo if upload fails (optional)
                } finally {
                    setUploading(false);
                }
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
            setUploading(false);
        }
    };

    const handleRemoveImage = (image) => {
        handleChange('images', formData.images.filter(i => i !== image));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال اسم المنتج');
            return false;
        }
        if (!formData.price || formData.price <= 0) {
            Alert.alert('خطأ', 'يرجى إدخال سعر صحيح');
            return false;
        }
        if (!selectedCategory) {
            Alert.alert('خطأ', 'يرجى اختيار فئة المنتج');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (uploading) {
            Alert.alert('انتظر', 'يرجى انتظار اكتمال رفع الصور');
            return;
        }

        setLoading(true);
        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                compareAtPrice: parseFloat(formData.compareAtPrice) || 0,
                cost: parseFloat(formData.cost) || 0,
                stock: parseInt(formData.stock) || 0,
                lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
            };

            if (isEditing) {
                await updateProduct(editProduct.id, productData);
                Alert.alert('تم التحديث', 'تم تحديث المنتج بنجاح');
            } else {
                await createProduct(productData);
                Alert.alert('تمت الإضافة', 'تم إضافة المنتج بنجاح');
            }

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            Alert.alert('خطأ', 'فشل في حفظ المنتج');
        } finally {
            setLoading(false);
        }
    };

    const renderPreview = () => (
        <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
                <Text style={[styles.previewTitle, { color: theme.text }]}>معاينة المنتج</Text>
                <TouchableOpacity onPress={() => setShowPreview(false)}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.previewContent}>
                {formData.images.length > 0 ? (
                    <Image source={{ uri: formData.images[0]?.src || formData.images[0] }} style={styles.previewImage} />
                ) : (
                    <View style={[styles.previewImagePlaceholder, { backgroundColor: theme.border }]}>
                        <Ionicons name="image-outline" size={48} color={theme.textMuted} />
                    </View>
                )}

                <Text style={[styles.previewProductName, { color: theme.text }]}>
                    {formData.name || 'اسم المنتج'}
                </Text>

                <View style={styles.previewPriceRow}>
                    <Text style={[styles.previewPrice, { color: theme.primary }]}>
                        {formData.price || 0} MAD
                    </Text>
                    {formData.compareAtPrice > 0 && (
                        <Text style={[styles.previewComparePrice, { color: theme.textMuted }]}>
                            {formData.compareAtPrice} MAD
                        </Text>
                    )}
                </View>

                <Text style={[styles.previewDescription, { color: theme.textSecondary }]}>
                    {formData.description || 'لا يوجد وصف'}
                </Text>

                {formData.tags.length > 0 && (
                    <View style={styles.previewTags}>
                        {formData.tags.map((tag, i) => (
                            <View key={i} style={[styles.previewTag, { backgroundColor: theme.primary + '20' }]}>
                                <Text style={[styles.previewTagText, { color: theme.primary }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity
                style={[styles.previewPublishBtn, { backgroundColor: theme.primary }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.previewPublishText}>
                    {loading ? 'جارٍ الحفظ...' : (isEditing ? 'تحديث المنتج' : 'نشر المنتج')}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: theme.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {showPreview ? renderPreview() : (
                    <>
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={[styles.cancelBtn, { color: theme.textSecondary }]}>إلغاء</Text>
                            </TouchableOpacity>
                            <Text style={[styles.title, { color: theme.text }]}>
                                {isEditing ? 'تعديل المنتج' : 'منتج جديد'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowPreview(true)}>
                                <Text style={[styles.previewBtn, { color: theme.primary }]}>معاينة</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                            {/* Basic Info */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>المعلومات الأساسية</Text>

                                <View style={[styles.inputGroup, { backgroundColor: theme.backgroundCard }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>اسم المنتج *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        value={formData.name}
                                        onChangeText={(v) => handleChange('name', v)}
                                        placeholder="مثال: سيروم فيتامين C"
                                        placeholderTextColor={theme.textMuted}
                                    />
                                </View>

                                <View style={[styles.inputGroup, { backgroundColor: theme.backgroundCard }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>الوصف</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { color: theme.text }]}
                                        value={formData.description}
                                        onChangeText={(v) => handleChange('description', v)}
                                        placeholder="وصف المنتج..."
                                        placeholderTextColor={theme.textMuted}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>
                            </View>

                            {/* Category */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>الفئة *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.categoryRow}>
                                        {PRODUCT_CATEGORIES.map((cat) => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                style={[
                                                    styles.categoryChip,
                                                    {
                                                        backgroundColor: selectedCategory === cat.id
                                                            ? theme.primary
                                                            : theme.backgroundCard
                                                    }
                                                ]}
                                                onPress={() => handleCategorySelect(cat.id)}
                                            >
                                                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                                <Text style={[
                                                    styles.categoryText,
                                                    { color: selectedCategory === cat.id ? '#fff' : theme.text }
                                                ]}>
                                                    {cat.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Pricing */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>التسعير</Text>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, styles.halfWidth, { backgroundColor: theme.backgroundCard }]}>
                                        <Text style={[styles.label, { color: theme.textSecondary }]}>السعر (MAD) *</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            value={(formData.price ?? 0).toString()}
                                            onChangeText={(v) => handleChange('price', v)}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={[styles.inputGroup, styles.halfWidth, { backgroundColor: theme.backgroundCard }]}>
                                        <Text style={[styles.label, { color: theme.textSecondary }]}>السعر قبل الخصم</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            value={(formData.compareAtPrice ?? 0).toString()}
                                            onChangeText={(v) => handleChange('compareAtPrice', v)}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Stock */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>المخزون</Text>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, styles.halfWidth, { backgroundColor: theme.backgroundCard }]}>
                                        <Text style={[styles.label, { color: theme.textSecondary }]}>الكمية</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            value={(formData.stock ?? 0).toString()}
                                            onChangeText={(v) => handleChange('stock', v)}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={[styles.inputGroup, styles.halfWidth, { backgroundColor: theme.backgroundCard }]}>
                                        <Text style={[styles.label, { color: theme.textSecondary }]}>تنبيه عند</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            value={(formData.lowStockThreshold ?? 5).toString()}
                                            onChangeText={(v) => handleChange('lowStockThreshold', v)}
                                            placeholder="5"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={[styles.inputGroup, { backgroundColor: theme.backgroundCard }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>SKU</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        value={formData.sku}
                                        onChangeText={(v) => handleChange('sku', v)}
                                        placeholder="تلقائي"
                                        placeholderTextColor={theme.textMuted}
                                    />
                                </View>
                            </View>

                            {/* Images */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>الصور</Text>
                                <View style={styles.imagesGrid}>
                                    {formData.images.map((img, i) => (
                                        <View key={i} style={styles.imageWrapper}>
                                            <Image source={{ uri: img.src || img }} style={styles.imageThumb} />
                                            <TouchableOpacity
                                                style={styles.removeImageBtn}
                                                onPress={() => handleRemoveImage(img)}
                                            >
                                                <Ionicons name="close-circle" size={22} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <TouchableOpacity
                                        style={[styles.addImageBtn, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}
                                        onPress={handleAddImage}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <ActivityIndicator size="small" color={theme.primary} />
                                        ) : (
                                            <Ionicons name="add" size={28} color={theme.primary} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Tags */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>الوسوم</Text>
                                <View style={[styles.tagInputRow, { backgroundColor: theme.backgroundCard }]}>
                                    <TextInput
                                        style={[styles.tagInput, { color: theme.text }]}
                                        value={tagInput}
                                        onChangeText={setTagInput}
                                        placeholder="أضف وسم..."
                                        placeholderTextColor={theme.textMuted}
                                        onSubmitEditing={handleAddTag}
                                    />
                                    <TouchableOpacity
                                        style={[styles.addTagBtn, { backgroundColor: theme.primary }]}
                                        onPress={handleAddTag}
                                    >
                                        <Ionicons name="add" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.tagsContainer}>
                                    {formData.tags.map((tag, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={[styles.tag, { backgroundColor: theme.primary + '20' }]}
                                            onPress={() => handleRemoveTag(tag)}
                                        >
                                            <Text style={[styles.tagText, { color: theme.primary }]}>{tag}</Text>
                                            <Ionicons name="close" size={14} color={theme.primary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.bottomPadding} />
                        </ScrollView>

                        {/* Submit Button */}
                        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Ionicons name={isEditing ? "checkmark" : "add"} size={20} color="#fff" />
                                <Text style={styles.submitBtnText}>
                                    {loading ? 'جارٍ الحفظ...' : (isEditing ? 'حفظ التغييرات' : 'إضافة المنتج')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>
        </Modal>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    cancelBtn: {
        fontSize: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
    },
    previewBtn: {
        fontSize: 16,
        fontWeight: '600',
    },
    form: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    inputGroup: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        marginBottom: 6,
    },
    input: {
        fontSize: 16,
        padding: 0,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
    },
    imagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    imageWrapper: {
        position: 'relative',
    },
    imageThumb: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    removeImageBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
    },
    addImageBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 8,
        gap: 8,
    },
    tagInput: {
        flex: 1,
        fontSize: 15,
        padding: 8,
    },
    addTagBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    tagText: {
        fontSize: 13,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomPadding: {
        height: 20,
    },
    // Preview styles
    previewContainer: {
        flex: 1,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    previewTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    previewContent: {
        flex: 1,
        padding: 16,
    },
    previewImage: {
        width: '100%',
        height: 300,
        borderRadius: 16,
        marginBottom: 16,
    },
    previewImagePlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    previewProductName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    previewPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    previewPrice: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    previewComparePrice: {
        fontSize: 16,
        textDecorationLine: 'line-through',
    },
    previewDescription: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 16,
    },
    previewTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    previewTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    previewTagText: {
        fontSize: 13,
    },
    previewPublishBtn: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    previewPublishText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
