/**
 * Drawer Menu Component - Kataraa
 * Slide-in menu from left side
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    ScrollView,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, SPACING, RADIUS, GRADIENTS, SHADOWS } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export default function DrawerMenu({ visible, onClose }) {
    const router = useRouter();
    const { t } = useTranslation();

    const menuItems = [
        { id: 'home', icon: 'home-outline', label: t('home'), route: '/' },
        { id: 'products', icon: 'grid-outline', label: t('productsTitle'), route: '/products' },
        { id: 'categories', icon: 'layers-outline', label: t('categoriesMenu'), route: '/products' },
        { id: 'offers', icon: 'pricetag-outline', label: t('offersMenu'), route: '/products?sale=true' },
        { id: 'favorites', icon: 'heart-outline', label: t('favorites'), route: '/favorites' },
        { id: 'cart', icon: 'cart-outline', label: t('cart'), route: '/cart' },
        { id: 'profile', icon: 'person-outline', label: t('profile'), route: '/profile' },
        { id: 'analytics', icon: 'analytics-outline', label: t('searchAnalytics'), route: '/admin/analytics-dashboard' },
    ];

    const socialLinks = [
        { id: 'instagram', icon: 'logo-instagram', color: '#E1306C' },
        { id: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366' },
        { id: 'tiktok', icon: 'logo-tiktok', color: '#000' },
    ];

    const handleNavigation = (route) => {
        onClose();
        setTimeout(() => {
            router.push(route);
        }, 300);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Drawer */}
                <View style={styles.drawer}>
                    {/* Header */}
                    <LinearGradient colors={GRADIENTS.header} style={styles.header}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.logo}>KATARAA</Text>
                        </View>
                        <Text style={styles.tagline}>{t('tagline')}</Text>
                    </LinearGradient>

                    {/* Menu Items */}
                    <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.menuItem}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        ))}

                        <View style={styles.divider} />

                        {/* Contact Section */}
                        <View style={styles.contactSection}>
                            <Text style={styles.sectionTitle}>{t('contactUs')}</Text>
                            <View style={styles.socialRow}>
                                {socialLinks.map((social) => (
                                    <TouchableOpacity key={social.id} style={styles.socialBtn}>
                                        <Ionicons name={social.icon} size={24} color={social.color} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* About */}
                        <View style={styles.aboutSection}>
                            <Text style={styles.aboutText}>{t('aboutMenu')}</Text>
                            <Text style={styles.copyright}>© 2024 Kataraa. {t('locale') === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: COLORS.background,
        ...SHADOWS.lg,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: SPACING.md,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
    },
    tagline: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    menuList: {
        flex: 1,
        padding: SPACING.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        marginLeft: SPACING.md,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
    },
    contactSection: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textAlign: 'right',
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    socialBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    aboutSection: {
        marginTop: SPACING.lg,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    aboutText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    copyright: {
        fontSize: 10,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: SPACING.md,
    },
});
