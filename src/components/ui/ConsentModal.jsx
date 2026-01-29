import React from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettings } from '../../context/SettingsContext';
import { Text } from './Text';
import { Button } from './Button';
import { Surface } from './Surface';

const ConsentModal = ({ visible }) => {
    const { tokens, isDark } = useTheme();
    const { t } = useTranslation();
    const { updateConsent } = useSettings();

    const handleAccept = () => updateConsent(true);
    const handleDecline = () => updateConsent(false);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <View style={styles.overlay}>
                <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.blur}>
                    <Surface variant="elevated" radius="xl" style={styles.modalCard} padding="lg">
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: tokens.colors.primary + '20' }]}>
                                <Ionicons name="shield-checkmark" size={40} color={tokens.colors.primary} />
                            </View>
                        </View>

                        <Text variant="title" style={styles.title}>{t('privacyPolicyTitle') || 'Your Privacy Matters'}</Text>

                        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                            <Text variant="body" style={styles.description}>
                                {t('privacyDescription') || "To provide the best experience, Kataraa uses Voice Search and basic analytics. We value your privacy and only process data necessary for these features."}
                            </Text>

                            <View style={styles.featureRow}>
                                <Ionicons name="mic-outline" size={20} color={tokens.colors.primary} />
                                <View style={styles.featureText}>
                                    <Text variant="label" weight="bold">{t('voiceSearch') || 'Voice Search'}</Text>
                                    <Text variant="caption">{t('voiceSearchConsent') || 'Used only when you activate the mic.'}</Text>
                                </View>
                            </View>

                            <View style={styles.featureRow}>
                                <Ionicons name="stats-chart-outline" size={20} color={tokens.colors.primary} />
                                <View style={styles.featureText}>
                                    <Text variant="label" weight="bold">{t('analytics') || 'Analytics'}</Text>
                                    <Text variant="caption">{t('analyticsConsent') || 'Helps us improve your shopping experience.'}</Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <Button
                                title={t('acceptAll') || 'Accept & Continue'}
                                onPress={handleAccept}
                                variant="primary"
                                style={styles.mainBtn}
                            />
                            <TouchableOpacity onPress={handleDecline} style={styles.declineBtn}>
                                <Text variant="label" style={{ color: tokens.colors.textMuted }}>{t('decline') || 'Decline non-essential'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Surface>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '85%',
        maxHeight: '70%',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
    },
    contentScroll: {
        marginBottom: 24,
    },
    description: {
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    featureText: {
        flex: 1,
    },
    footer: {
        gap: 12,
    },
    mainBtn: {
        width: '100%',
    },
    declineBtn: {
        alignItems: 'center',
        paddingVertical: 8,
    },
});

export default ConsentModal;
