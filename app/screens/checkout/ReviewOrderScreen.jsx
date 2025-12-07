import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartContext } from '../../../src/context/CardContext';
import { useCheckout } from '../../../src/context/CheckoutContext';
import PremiumBackground from '../../components/PremiumBackground';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { rateLimiters } from '../../../src/utils/security';
import { handleError } from '../../../src/utils/errorHandler';

const { width } = Dimensions.get('window');

const ReviewOrderScreen = () => {
    const router = useRouter();
    const { carts, getTotalPrice, clearCart } = useContext(CartContext);
    const {
        currentShippingAddress,
        currentPaymentMethod,
        discount,
        promoCode,
        createOrder
    } = useCheckout();

    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    const subtotal = getTotalPrice();
    const shipping = 0; // Free shipping
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount + shipping;

    // Validate order before placing
    const validateOrder = () => {
        if (!carts || carts.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty. Please add items before checkout.');
            return false;
        }

        if (!currentShippingAddress || !currentShippingAddress.fullName) {
            Alert.alert('Missing Address', 'Please add a shipping address.');
            router.push('/screens/checkout/ShippingScreen');
            return false;
        }

        if (!currentPaymentMethod || !currentPaymentMethod.type) {
            Alert.alert('Missing Payment', 'Please select a payment method.');
            router.push('/screens/checkout/PaymentScreen');
            return false;
        }

        return true;
    };

    const handlePlaceOrder = async () => {
        // Rate limiting check
        if (!rateLimiters.api.isAllowed('place_order')) {
            const waitTime = Math.ceil(rateLimiters.api.getTimeUntilReset('place_order') / 1000);
            Alert.alert(
                'Please Wait',
                `You're ordering too quickly. Please wait ${waitTime} seconds.`
            );
            return;
        }

        // Validate order
        if (!validateOrder()) {
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                items: carts.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1,
                    image: item.image,
                })),
                shippingAddress: currentShippingAddress,
                paymentMethod: {
                    type: currentPaymentMethod.type,
                    lastFour: currentPaymentMethod.lastFour || null,
                    cardType: currentPaymentMethod.cardType || null,
                },
                subtotal,
                shipping,
                discount: discountAmount,
                total,
                promoCode,
                createdAt: new Date().toISOString(),
            };

            const order = await createOrder(orderData);

            if (order) {
                setOrderPlaced(true);
                // Clear cart after successful order
                if (clearCart) {
                    clearCart();
                }

                // Navigate to success screen
                router.replace({
                    pathname: '/screens/checkout/OrderSuccessScreen',
                    params: {
                        orderNumber: order.orderNumber,
                        total: total.toFixed(2),
                    }
                });
            } else {
                Alert.alert('Order Failed', 'Failed to create order. Please try again.');
            }
        } catch (error) {
            handleError(error, {
                context: 'ReviewOrderScreen',
                onPaymentError: () => {
                    Alert.alert('Payment Error', 'There was an issue processing your payment. Please try again.');
                },
                onNetworkError: () => {
                    Alert.alert('Connection Error', 'Please check your internet connection and try again.');
                },
                onError: () => {
                    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                }
            });
        } finally {
            setLoading(false);
        }
    };

    // Get payment icon based on type
    const getPaymentIcon = () => {
        const cardType = currentPaymentMethod?.cardType;
        switch (cardType) {
            case 'visa':
                return <FontAwesome name="cc-visa" size={24} color="#1A1F71" />;
            case 'mastercard':
                return <FontAwesome name="cc-mastercard" size={24} color="#EB001B" />;
            case 'amex':
                return <FontAwesome name="cc-amex" size={24} color="#006FCF" />;
            default:
                if (currentPaymentMethod?.type === 'Cash on Delivery') {
                    return <Ionicons name="cash-outline" size={24} color="#4CAF50" />;
                }
                return <Ionicons name="card-outline" size={24} color="#fff" />;
        }
    };

    const renderCartItem = (item, index) => (
        <Animated.View
            key={item.id}
            entering={FadeInDown.delay(index * 100).springify()}
            style={[styles.cartItem, index === carts.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}
        >
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>${(item.price * (item.quantity || 1)).toFixed(2)}</Text>
            </View>
            <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>×{item.quantity || 1}</Text>
            </View>
        </Animated.View>
    );

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Review Order</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Progress Indicator */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressStep, styles.progressStepCompleted]}>
                            <View style={styles.completedCircle}>
                                <Ionicons name="checkmark" size={16} color="#667eea" />
                            </View>
                            <Text style={styles.progressLabel}>Shipping</Text>
                        </View>
                        <View style={[styles.progressLine, styles.progressLineCompleted]} />
                        <View style={[styles.progressStep, styles.progressStepCompleted]}>
                            <View style={styles.completedCircle}>
                                <Ionicons name="checkmark" size={16} color="#667eea" />
                            </View>
                            <Text style={styles.progressLabel}>Payment</Text>
                        </View>
                        <View style={[styles.progressLine, styles.progressLineCompleted]} />
                        <View style={[styles.progressStep, styles.progressStepActive]}>
                            <View style={styles.activeStepCircle}>
                                <Text style={styles.activeStepText}>3</Text>
                            </View>
                            <Text style={[styles.progressLabel, styles.progressLabelActive]}>Review</Text>
                        </View>
                    </View>

                    {/* Order Items */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <Ionicons name="cart" size={20} color="#fff" />
                            <Text style={styles.sectionTitle}>Order Items ({carts.length})</Text>
                        </View>
                        <View style={styles.sectionContent}>
                            {carts.map((item, index) => renderCartItem(item, index))}
                        </View>
                    </Animated.View>

                    {/* Shipping Address */}
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <Ionicons name="location" size={20} color="#fff" />
                            <Text style={styles.sectionTitle}>Shipping Address</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/screens/checkout/ShippingScreen')}
                                disabled={loading}
                            >
                                <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sectionContent}>
                            <Text style={styles.addressName}>
                                {currentShippingAddress?.fullName || 'No Address'}
                            </Text>
                            <Text style={styles.addressText}>
                                {currentShippingAddress?.address || ''}
                            </Text>
                            <Text style={styles.addressText}>
                                {currentShippingAddress?.city}, {currentShippingAddress?.zipCode}
                            </Text>
                            <Text style={styles.addressText}>
                                {currentShippingAddress?.phoneNumber || ''}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Payment Method */}
                    <Animated.View
                        entering={FadeInDown.delay(300).springify()}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <Ionicons name="card" size={20} color="#fff" />
                            <Text style={styles.sectionTitle}>Payment Method</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/screens/checkout/PaymentScreen')}
                                disabled={loading}
                            >
                                <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sectionContent}>
                            <View style={styles.paymentInfo}>
                                <View style={styles.paymentIconContainer}>
                                    {getPaymentIcon()}
                                </View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={styles.paymentType}>
                                        {currentPaymentMethod?.type || 'Not selected'}
                                    </Text>
                                    {currentPaymentMethod?.lastFour && (
                                        <Text style={styles.paymentNumber}>
                                            •••• •••• •••• {currentPaymentMethod.lastFour}
                                        </Text>
                                    )}
                                </View>
                                {currentPaymentMethod?.type === 'Cash on Delivery' && (
                                    <View style={styles.codBadge}>
                                        <Text style={styles.codText}>COD</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Animated.View>

                    {/* Price Summary */}
                    <Animated.View
                        entering={FadeInDown.delay(400).springify()}
                        style={styles.section}
                    >
                        <View style={styles.sectionHeader}>
                            <Ionicons name="receipt" size={20} color="#fff" />
                            <Text style={styles.sectionTitle}>Price Details</Text>
                        </View>
                        <View style={styles.sectionContent}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Subtotal ({carts.length} items)</Text>
                                <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Shipping</Text>
                                <Text style={[styles.priceValue, styles.freeText]}>FREE</Text>
                            </View>
                            {discount > 0 && (
                                <View style={styles.priceRow}>
                                    <View style={styles.discountRow}>
                                        <Ionicons name="pricetag" size={16} color="#4CAF50" />
                                        <Text style={styles.promoLabel}>{promoCode}</Text>
                                    </View>
                                    <Text style={[styles.priceValue, styles.discountText]}>
                                        -${discountAmount.toFixed(2)}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.divider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Security Note */}
                    <Animated.View
                        entering={FadeInUp.delay(500).springify()}
                        style={styles.securityNote}
                    >
                        <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                        <Text style={styles.securityText}>
                            Your order is protected by our secure checkout
                        </Text>
                    </Animated.View>
                </ScrollView>

                {/* Place Order Button */}
                <Animated.View
                    entering={FadeInDown.delay(500).springify()}
                    style={styles.footer}
                >
                    <View style={styles.footerTotal}>
                        <Text style={styles.footerTotalLabel}>Total</Text>
                        <Text style={styles.footerTotalValue}>${total.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
                        onPress={handlePlaceOrder}
                        activeOpacity={0.8}
                        disabled={loading || orderPlaced}
                    >
                        <LinearGradient
                            colors={loading ? ['#999', '#777'] : ['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}
                        >
                            {loading ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.placeOrderText}>Processing...</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.placeOrderText}>Place Order</Text>
                                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 140,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        paddingVertical: 20,
    },
    progressStep: {
        alignItems: 'center',
    },
    progressStepCompleted: {
        opacity: 1,
    },
    progressStepActive: {},
    completedCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeStepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeStepText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    progressLabel: {
        marginTop: 8,
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    progressLabelActive: {
        color: '#fff',
        fontWeight: '600',
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 10,
    },
    progressLineCompleted: {
        backgroundColor: '#fff',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 8,
        flex: 1,
    },
    editText: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: '600',
    },
    sectionContent: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#667eea',
    },
    quantityBadge: {
        backgroundColor: 'rgba(102,126,234,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    quantityText: {
        color: '#fff',
        fontWeight: '600',
    },
    addressName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    addressText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    paymentNumber: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    codBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    codText: {
        color: '#4CAF50',
        fontWeight: '700',
        fontSize: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    freeText: {
        color: '#4CAF50',
    },
    discountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    promoLabel: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    discountText: {
        color: '#4CAF50',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#667eea',
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
    },
    securityText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginLeft: 10,
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    footerTotalLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    footerTotalValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    placeOrderButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    placeOrderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
});

export default ReviewOrderScreen;
