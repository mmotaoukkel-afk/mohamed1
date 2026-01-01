/**
 * Order Success Screen - Kataraa Cosmic Luxury
 * Premium animated success page after order placement
 */
import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import PaymentService from '../../src/services/PaymentService';
import { ActivityIndicator } from 'react-native';

import { useTheme } from '../../src/context/ThemeContext';
import { Text, Button, Surface } from '../../src/components/ui';

const { width, height } = Dimensions.get('window');

// Confetti Particle Component
const ConfettiParticle = ({ delay, startX, colors, style }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const randomDuration = 2000 + Math.random() * 1000;
        const randomX = (Math.random() - 0.5) * 100;

        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: height + 50,
                    duration: randomDuration,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: randomX,
                    duration: randomDuration,
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
                    duration: randomDuration,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(randomDuration * 0.7),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: randomDuration * 0.3,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ]).start();
    }, []);

    // Use passed colors or default
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 8 + Math.random() * 8;

    return (
        <Animated.View
            style={[
                style,
                {
                    left: startX,
                    width: size,
                    height: size,
                    backgroundColor: color,
                    borderRadius: Math.random() > 0.5 ? size / 2 : 2,
                    opacity,
                    transform: [
                        { translateY },
                        { translateX },
                        {
                            rotate: rotate.interpolate({
                                inputRange: [0, 360],
                                outputRange: ['0deg', '360deg'],
                            })
                        },
                    ],
                },
            ]}
        />
    );
};

export default function OrderSuccessScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { tokens, isDark } = useTheme();
    const { addNotification } = useNotifications();
    const styles = getStyles(tokens, isDark);

    const [verifying, setVerifying] = React.useState(!!useLocalSearchParams().paymentId);
    const [paymentStatus, setPaymentStatus] = React.useState(null); // 'success', 'failed'
    const { paymentId, orderId } = useLocalSearchParams();

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const checkmarkScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const verify = async () => {
            if (paymentId) {
                try {
                    const status = await PaymentService.getPaymentStatus(paymentId);
                    if (status.IsSuccess && status.Data.InvoiceStatus === 'Paid') {
                        setPaymentStatus('success');
                    } else {
                        setPaymentStatus('failed');
                    }
                } catch (e) {
                    setPaymentStatus('failed');
                } finally {
                    setVerifying(false);
                }
            } else {
                setPaymentStatus('success'); // Assume success if no paymentId (e.g. COD)
            }
        };

        verify();

        // Entrance animations
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(checkmarkScale, {
                toValue: 1,
                tension: 100,
                friction: 5,
                useNativeDriver: true,
            }),
        ]).start();

        // Add success notification only if verified
        if (paymentStatus) {
            addNotification(
                'notifOrderTitle',
                paymentStatus === 'failed' ? 'notifOrderFailed' : 'notifOrderMsg',
                paymentStatus === 'failed' ? 'error' : 'success',
                { orderId: orderId || '' }
            );
        }
    }, [paymentId, paymentStatus]);

    // Generate confetti particles
    const confettiColors = [
        tokens.colors.primary,
        tokens.colors.secondary,
        tokens.colors.accent,
        tokens.colors.success,
        '#FF9800'
    ];

    const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        delay: Math.random() * 500,
        startX: Math.random() * width,
    }));

    return (
        <View style={styles.container}>
            {/* Background Orbs */}
            <View style={[styles.orb, { backgroundColor: tokens.colors.success + '10', top: -50, right: -50 }]} />
            <View style={[styles.orb, { backgroundColor: tokens.colors.primary + '10', bottom: -50, left: -50 }]} />

            {/* Confetti */}
            {paymentStatus !== 'failed' && confettiParticles.map((particle) => (
                <ConfettiParticle
                    key={particle.id}
                    delay={particle.delay}
                    startX={particle.startX}
                    colors={confettiColors}
                    style={styles.confetti}
                />
            ))}

            <SafeAreaView style={styles.content}>
                {/* Success Circle */}
                <Animated.View
                    style={[
                        styles.successCircle,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <LinearGradient
                        colors={paymentStatus === 'failed'
                            ? [tokens.colors.error, '#FF8A80']
                            : [tokens.colors.success, '#81C784']}
                        style={styles.circleGradient}
                    >
                        <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                            <Ionicons
                                name={paymentStatus === 'failed' ? "close" : "checkmark"}
                                size={80}
                                color="#fff"
                            />
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>

                {/* Title */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text variant="display" style={{ textAlign: 'center', marginBottom: 16 }}>
                        {verifying ? t('verifyingPayment') :
                            paymentStatus === 'failed' ? t('paymentFailed') :
                                t('orderPlaced')}
                    </Text>
                </Animated.View>

                {verifying && <ActivityIndicator size="large" color={tokens.colors.primary} style={{ marginVertical: 20 }} />}

                {/* Order Number */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        width: '100%',
                        marginBottom: 20
                    }}
                >
                    <Surface variant="glass" style={styles.orderCard} padding="lg">
                        <Text variant="label" style={{ color: tokens.colors.textSecondary }}>{t('orderNumber')}</Text>
                        <Text variant="display" style={{ color: tokens.colors.primary, fontSize: 32 }}>#{orderId || '---'}</Text>
                    </Surface>
                </Animated.View>

                {/* Info Card */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        width: '100%',
                        marginBottom: 30
                    }}
                >
                    <Surface variant="glass" style={styles.infoCard} padding="lg">
                        <View style={styles.infoRow}>
                            <View style={[styles.iconBox, { backgroundColor: tokens.colors.primary + '15' }]}>
                                <Ionicons name="call" size={24} color={tokens.colors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text variant="body" weight="bold">{t('weWillContact')}</Text>
                                <Text variant="caption" style={{ color: tokens.colors.textSecondary }}>
                                    {t('weWillContactDesc')}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />

                        <View style={styles.infoRow}>
                            <View style={[styles.iconBox, { backgroundColor: tokens.colors.accent + '15' }]}>
                                <Ionicons name="time" size={24} color={tokens.colors.accent} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text variant="body" weight="bold">{t('deliveryTime')}</Text>
                                <Text variant="caption" style={{ color: tokens.colors.textSecondary }}>1-3 {t('days')}</Text>
                            </View>
                        </View>
                    </Surface>
                </Animated.View>

                {/* Return Home Button */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        width: '100%'
                    }}
                >
                    <Button
                        title={t('continueShopping')}
                        onPress={() => router.replace('/')}
                        variant="primary"
                        icon={<Ionicons name="home" size={20} color="#FFF" />}
                    />
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const getStyles = (tokens, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: tokens.colors.background,
    },
    orb: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
    },
    confetti: {
        position: 'absolute',
        top: 0,
        zIndex: 0,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    successCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        overflow: 'hidden',
        marginBottom: 32,
        shadowColor: tokens.colors.success,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    circleGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderCard: {
        alignItems: 'center',
        borderRadius: 24,
    },
    infoCard: {
        borderRadius: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
});
