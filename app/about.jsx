
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Dimensions,
    Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/context/ThemeContext';
import { useTranslation } from '../src/hooks/useTranslation';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AboutScreen() {
    const { theme, isDark } = useTheme();
    const { t, locale } = useTranslation();
    const router = useRouter();

    const contactMethods = [
        {
            id: 'whatsapp',
            icon: 'logo-whatsapp',
            label: 'WhatsApp',
            value: '+965 1234 5678',
            color: '#25D366',
            onPress: () => Linking.openURL('whatsapp://send?phone=96512345678')
        },
        {
            id: 'email',
            icon: 'mail-outline',
            label: t('email'),
            value: 'info@kataraa.com',
            color: theme.primary,
            onPress: () => Linking.openURL('mailto:info@kataraa.com')
        },
        {
            id: 'phone',
            icon: 'call-outline',
            label: t('phone'),
            value: '+965 1234 5678',
            color: '#3498db',
            onPress: () => Linking.openURL('tel:+96512345678')
        }
    ];

    const faqs = [
        {
            q: locale === 'ar' ? 'كيف يمكنني تتبع طلبي؟' : 'How can I track my order?',
            a: locale === 'ar' ? 'يمكنك تتبع طلبك من خلال قسم الطلبات في ملفك الشخصي أو بالاتصال بنا عبر واتساب.' : 'You can track your order through the Orders section in your profile or by contacting us via WhatsApp.'
        },
        {
            q: locale === 'ar' ? 'ما هي مدة التوصيل؟' : 'What is the delivery time?',
            a: locale === 'ar' ? 'يستغرق التوصيل عادةً من 24 إلى 48 ساعة داخل الكويت.' : 'Delivery typically takes 24-48 hours within Kuwait.'
        },
        {
            q: locale === 'ar' ? 'هل المنتجات أصلية؟' : 'Are the products authentic?',
            a: locale === 'ar' ? 'نعم، جميع منتجاتنا مستوردة مباشرة من كوريا الجنوبية وهي أصلية 100%.' : 'Yes, all our products are imported directly from South Korea and are 100% authentic.'
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    headerTransparent: true,
                    headerTitle: t('aboutApp'),
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color="#fff" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Feature */}
                <View style={styles.header}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800' }}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                        style={styles.headerOverlay}
                    />
                    <View style={styles.headerContent}>
                        <Animated.Text entering={FadeInDown.delay(200)} style={styles.brandName}>KATARAA</Animated.Text>
                        <Animated.Text entering={FadeInDown.delay(400)} style={styles.brandTagline}>K-Beauty Excellence</Animated.Text>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Brand Story */}
                    <Animated.View entering={FadeInDown.delay(500)} style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
                        <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>{locale === 'ar' ? 'قصتنا' : 'Our Story'}</Text>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                            {t('aboutDescription')}
                        </Text>
                    </Animated.View>

                    {/* Contact Us */}
                    <Text style={[styles.mainSectionTitle, { color: theme.text }]}>{t('contactUs')}</Text>
                    <View style={styles.contactContainer}>
                        {contactMethods.map((method, index) => (
                            <Animated.View key={method.id} entering={FadeInDown.delay(600 + index * 100)}>
                                <TouchableOpacity
                                    style={[styles.contactCard, { backgroundColor: theme.backgroundCard }]}
                                    onPress={method.onPress}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: method.color + '15' }]}>
                                        <Ionicons name={method.icon} size={24} color={method.color} />
                                    </View>
                                    <View style={styles.contactInfo}>
                                        <Text style={[styles.contactLabel, { color: theme.textMuted }]}>{method.label}</Text>
                                        <Text style={[styles.contactValue, { color: theme.text }]}>{method.value}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>

                    {/* FAQ Section (Merged Help) */}
                    <Text style={[styles.mainSectionTitle, { color: theme.text }]}>{t('faq')}</Text>
                    {faqs.map((faq, index) => (
                        <Animated.View key={index} entering={FadeInDown.delay(900 + index * 100)} style={[styles.faqCard, { backgroundColor: theme.backgroundCard }]}>
                            <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.q}</Text>
                            <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.a}</Text>
                        </Animated.View>
                    ))}

                    <View style={styles.footer}>
                        <Text style={[styles.version, { color: theme.textMuted }]}>{t('appVersion')}</Text>
                        <Text style={[styles.copyright, { color: theme.textMuted }]}>© 2025 Kataraa. All Rights Reserved.</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        marginLeft: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        height: 280,
        width: '100%',
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    headerContent: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    brandName: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 4,
    },
    brandTagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
        letterSpacing: 2,
    },
    content: {
        padding: 20,
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: 'transparent',
    },
    card: {
        padding: 24,
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'left'
    },
    mainSectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
        marginLeft: 4,
        textAlign: 'left'
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'left'
    },
    contactContainer: {
        marginBottom: 24,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        marginBottom: 2,
        textAlign: 'left'
    },
    contactValue: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'left'
    },
    faqCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'left'
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'left'
    },
    footer: {
        marginTop: 30,
        paddingBottom: 40,
        alignItems: 'center',
    },
    version: {
        fontSize: 14,
        fontWeight: '600',
    },
    copyright: {
        fontSize: 12,
        marginTop: 4,
    },
});
