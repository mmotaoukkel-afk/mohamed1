
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useTranslation } from '../src/hooks/useTranslation';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TermsScreen() {
    const { theme } = useTheme();
    const { t, locale } = useTranslation();
    const router = useRouter();

    const sections = [
        {
            title: locale === 'ar' ? '1. شروط الاستخدام' : '1. Terms of Use',
            content: locale === 'ar'
                ? 'باستخدامك لتطبيق كتارا، فإنك توافق على الالتزام بشروط الاستخدام الخاصة بنا. نحن نوفر منتجات تجميل كورية أصلية ونضمن استلامك للمنتجات في حالة ممتازة.'
                : 'By using the Kataraa app, you agree to be bound by our Terms of Use. We provide authentic Korean beauty products and ensure that you receive products in excellent condition.'
        },
        {
            title: locale === 'ar' ? '2. سياسة الخصوصية' : '2. Privacy Policy',
            content: locale === 'ar'
                ? 'نحن نحترم خصوصيتك. يتم جمع المعلومات الشخصية فقط لتسهيل الطلبات وتحسين تجربتك في التطبيق. لن نقوم بمشاركة بياناتك مع أطراف ثالثة دون موافقتك.'
                : 'We respect your privacy. Personal information is collected only to facilitate orders and improve your experience in the app. We will not share your data with third parties without your consent.'
        },
        {
            title: locale === 'ar' ? '3. الشحن والتوصيل' : '3. Shipping & Delivery',
            content: locale === 'ar'
                ? 'يتم التوصيل داخل الكويت و دول الخليج. نسعى دائماً لتوصيل طلباتكم في أسرع وقت ممكن. يرجى التأكد من كتابة العنوان بدقة لتجنب أي تأخير.'
                : 'Delivery is available within Kuwait and GCC countries. We always strive to deliver your orders as quickly as possible. Please ensure the address is written accurately to avoid any delays.'
        },
        {
            title: locale === 'ar' ? '4. الإرجاع والاستبدال' : '4. Returns & Exchanges',
            content: locale === 'ar'
                ? 'نظراً لطبيعة المنتجات الصحية، لا يمكن إرجاع أو استبدال منتجات التجميل المفتوحة أو المستخدمة إلا إذا كانت تالفة عند الاستلام.'
                : 'Due to the sanitary nature of products, opened or used beauty products cannot be returned or exchanged unless they were damaged upon receipt.'
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    headerTitle: t('termsPrivacy'),
                    headerTintColor: theme.text,
                    headerStyle: { backgroundColor: theme.background },
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color={theme.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
                    <Ionicons name="document-text-outline" size={60} color={theme.primary} />
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{t('termsConditions')}</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {locale === 'ar' ? 'يرجى قراءة الشروط والخصوصية بعناية.' : 'Please read our terms and privacy policy carefully.'}
                    </Text>
                </Animated.View>

                {sections.map((section, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInDown.delay(400 + index * 100)}
                        style={[styles.sectionCard, { backgroundColor: theme.backgroundCard }]}
                    >
                        <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>{section.title}</Text>
                        <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>{section.content}</Text>
                    </Animated.View>
                ))}

                <View style={styles.footer}>
                    <Text style={[styles.lastUpdated, { color: theme.textMuted }]}>
                        {locale === 'ar' ? 'آخر تحديث: ديسمبر 2025' : 'Last Updated: December 2025'}
                    </Text>
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
        marginLeft: 8,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 15,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    sectionCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'left'
    },
    sectionContent: {
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'left'
    },
    footer: {
        marginTop: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    lastUpdated: {
        fontSize: 12,
        fontWeight: '600',
    },
});
