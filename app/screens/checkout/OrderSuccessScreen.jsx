import React, { useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import PremiumBackground from '../../components/PremiumBackground';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import Confetti from 'react-native-confetti';
import { CartContext } from '../../../src/context/CardContext';
import { useCheckout } from '../../../src/context/CheckoutContext';
import { sendOrderUpdateNotification } from '../../../src/utils/notifications';

const { width, height } = Dimensions.get('window');

const OrderSuccessScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { clearCart } = useContext(CartContext);
    const { resetCheckout } = useCheckout();
    const confettiRef = React.useRef(null);

    const orderNumber = params.orderNumber || 'ORD-123456';

    useEffect(() => {
        // Trigger confetti
        if (confettiRef.current) {
            confettiRef.current.startConfetti();
        }

        // Send notification
        sendOrderUpdateNotification(orderNumber, 'confirmed');

        // Clear cart and reset checkout
        clearCart();
        resetCheckout();

        // Stop confetti after 3 seconds
        const timer = setTimeout(() => {
            if (confettiRef.current) {
                confettiRef.current.stopConfetti();
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                <Confetti ref={confettiRef} confettiCount={50} timeout={3} />

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
                            <Ionicons name="checkmark-circle" size={80} color="#fff" />
                        </LinearGradient>
                    </Animated.View>

                    {/* Success Message */}
                    <Animated.Text
                        entering={FadeInDown.delay(400).springify()}
                        style={styles.title}
                    >
                        Order Placed Successfully! 🎉
                    </Animated.Text>

                    <Animated.Text
                        entering={FadeInDown.delay(500).springify()}
                        style={styles.subtitle}
                    >
                        Thank you for your purchase!
                    </Animated.Text>

                    {/* Order Number */}
                    <Animated.View
                        entering={FadeInDown.delay(600).springify()}
                        style={styles.orderNumberContainer}
                    >
                        <Text style={styles.orderNumberLabel}>Order Number</Text>
                        <Text style={styles.orderNumber}>{orderNumber}</Text>
                        <Text style={styles.orderNumberHint}>
                            Save this number to track your order
                        </Text>
                    </Animated.View>

                    {/* Features */}
                    <Animated.View
                        entering={FadeInDown.delay(700).springify()}
                        style={styles.featuresContainer}
                    >
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="mail" size={24} color="#667eea" />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>Confirmation Email</Text>
                                <Text style={styles.featureDesc}>Sent to your email</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="cube" size={24} color="#667eea" />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>Free Shipping</Text>
                                <Text style={styles.featureDesc}>Delivery in 3-5 days</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="shield-checkmark" size={24} color="#667eea" />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>Secure Payment</Text>
                                <Text style={styles.featureDesc}>100% Protected</Text>
                            </View>
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
                            onPress={() => router.push('/(tabs)')}
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
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        marginBottom: 30,
    },
    iconGradient: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 30,
    },
    orderNumberContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        width: '100%',
    },
    orderNumberLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    orderNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    orderNumberHint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    featureIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(102,126,234,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
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
        paddingVertical: 18,
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
        paddingVertical: 18,
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
