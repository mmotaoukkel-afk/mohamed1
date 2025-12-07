import React, { useEffect, useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Share,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import PremiumBackground from '../../components/PremiumBackground';
import Animated, { FadeInDown, FadeInUp, ZoomIn, BounceIn } from 'react-native-reanimated';
import { CartContext } from '../../../src/context/CardContext';
import { useCheckout } from '../../../src/context/CheckoutContext';
import { sendOrderUpdateNotification } from '../../../src/utils/notifications';

const { width, height } = Dimensions.get('window');

const OrderSuccessScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { clearCart } = useContext(CartContext);
    const { resetCheckout } = useCheckout();
    const [showConfetti, setShowConfetti] = useState(true);

    const orderNumber = params.orderNumber || 'ORD-' + Date.now().toString(36).toUpperCase();
    const total = params.total || '0.00';

    useEffect(() => {
        // Send notification (wrapped in try-catch for Expo Go)
        try {
            sendOrderUpdateNotification(orderNumber, 'confirmed');
        } catch (error) {
            console.log('Notification skipped');
        }

        // Clear cart and reset checkout
        if (clearCart) clearCart();
        if (resetCheckout) resetCheckout();

        // Stop confetti after 4 seconds
        const timer = setTimeout(() => {
            setShowConfetti(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `I just ordered from Fashion Store! 🛍️\nOrder Number: ${orderNumber}\nTotal: $${total}`,
                title: 'My Fashion Store Order',
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    // Simple confetti effect with animated views
    const renderConfetti = () => {
        if (!showConfetti) return null;

        const confettiColors = ['#667eea', '#764ba2', '#4CAF50', '#FF6B6B', '#FFD93D', '#6BCB77'];
        return (
            <View style={styles.confettiContainer} pointerEvents="none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <Animated.View
                        key={i}
                        entering={BounceIn.delay(i * 50).duration(1000)}
                        style={[
                            styles.confettiPiece,
                            {
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 50}%`,
                                backgroundColor: confettiColors[i % confettiColors.length],
                                transform: [{ rotate: `${Math.random() * 360}deg` }],
                            },
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                {renderConfetti()}

                <View style={styles.content}>
                    {/* Success Icon */}
                    <Animated.View
                        entering={ZoomIn.delay(200).springify()}
                        style={styles.iconContainer}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#45a049']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="checkmark" size={60} color="#fff" />
                        </LinearGradient>
                    </Animated.View>

                    {/* Success Message */}
                    <Animated.Text
                        entering={FadeInDown.delay(400).springify()}
                        style={styles.title}
                    >
                        Order Confirmed! 🎉
                    </Animated.Text>

                    <Animated.Text
                        entering={FadeInDown.delay(500).springify()}
                        style={styles.subtitle}
                    >
                        Thank you for your purchase!
                    </Animated.Text>

                    {/* Order Details */}
                    <Animated.View
                        entering={FadeInDown.delay(600).springify()}
                        style={styles.orderDetailsContainer}
                    >
                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>Order Number</Text>
                            <TouchableOpacity
                                style={styles.copyButton}
                                onPress={handleShare}
                            >
                                <Text style={styles.orderValue}>{orderNumber}</Text>
                                <Ionicons name="share-outline" size={18} color="#667eea" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>${total}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>Estimated Delivery</Text>
                            <Text style={styles.orderValue}>3-5 Business Days</Text>
                        </View>
                    </Animated.View>

                    {/* Features */}
                    <Animated.View
                        entering={FadeInDown.delay(700).springify()}
                        style={styles.featuresContainer}
                    >
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: 'rgba(102,126,234,0.2)' }]}>
                                <Ionicons name="mail" size={22} color="#667eea" />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>Email Confirmation</Text>
                                <Text style={styles.featureDesc}>Sent to your email</Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        </View>

                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: 'rgba(76,175,80,0.2)' }]}>
                                <Ionicons name="cube" size={22} color="#4CAF50" />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>Free Shipping</Text>
                                <Text style={styles.featureDesc}>Tracked delivery</Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        </View>

                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,107,107,0.2)' }]}>
                                <Ionicons name="shield-checkmark" size={22} color="#FF6B6B" />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>Buyer Protection</Text>
                                <Text style={styles.featureDesc}>30-day guarantee</Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        </View>
                    </Animated.View>

                    {/* Action Buttons */}
                    <Animated.View
                        entering={FadeInUp.delay(800).springify()}
                        style={styles.buttonsContainer}
                    >
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push({
                                pathname: '/screens/orders/OrderTrackingScreen',
                                params: { id: orderNumber }
                            })}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="location" size={20} color="#fff" />
                                <Text style={styles.primaryButtonText}>Track Order</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.replace('/(tabs)')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
                            <Ionicons name="arrow-forward" size={18} color="#667eea" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    confettiPiece: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 24,
    },
    orderDetailsContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    orderLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    orderValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginRight: 8,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#4CAF50',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 4,
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
    },
    buttonsContainer: {
        width: '100%',
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: '#667eea',
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
});

export default OrderSuccessScreen;
