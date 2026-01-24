import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    // Image
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileModal({ visible, onClose }) {
    const { theme, isDark } = useTheme();
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();

    const [name, setName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [image, setImage] = useState(user?.photoURL || null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            Alert.alert(t('error'), t('fillAllFields') || 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            await updateUser({
                displayName: name,
                email: email,
                photoURL: image
            });
            onClose();
            Alert.alert(t('success'), t('profileUpdated') || 'Profile updated successfully!');
        } catch (error) {
            console.error('Update failed:', error);
            Alert.alert(t('error'), t('updateFailed') || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

                <View style={[styles.content, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>{t('editProfile')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        {/* Profile Image Picker */}
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            <View style={[styles.imageWrapper, { borderColor: theme.primary + '30' }]}>
                                {image ? (
                                    <Image
                                        source={image}
                                        style={styles.profileImage}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                ) : (
                                    <View style={[styles.placeholderImage, { backgroundColor: theme.primary + '10' }]}>
                                        <Ionicons name="camera" size={30} color={theme.primary} />
                                    </View>
                                )}
                                <View style={[styles.cameraBadge, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="camera" size={14} color="#FFF" />
                                </View>
                            </View>
                            <Text style={[styles.changePhotoText, { color: theme.primary }]}>{t('changePhoto') || 'Change Photo'}</Text>
                        </TouchableOpacity>
                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t('fullName')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                                <Ionicons name="person-outline" size={20} color={theme.textMuted} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t('fullName')}
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t('email')}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                                <Ionicons name="mail-outline" size={20} color={theme.textMuted} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder={t('email')}
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveBtnText}>{t('saveChanges')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    form: {
        gap: 20,
    },
    imagePicker: {
        alignItems: 'center',
        marginBottom: 10,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        padding: 4,
        position: 'relative',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    changePhotoText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    saveBtn: {
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    }
});
