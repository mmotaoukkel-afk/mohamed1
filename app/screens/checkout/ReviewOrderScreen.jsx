import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartContext } from '../../../src/context/CardContext';
import { useCheckout } from '../../../src/context/CheckoutContext';
import PremiumBackground from '../../components/PremiumBackground';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ReviewOrderScreen = () => {
    const router = useRouter();
    const { carts, getTotalPrice } = useContext(CartContext);
    const {
        currentShippingAddress,
        currentPaymentMethod,
        discount,
        promoCode,
        createOrder
    } = useCheckout();

    const subtotal = getTotalPrice();
    const shipping = 0; // Free shipping
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount + shipping;

    const handlePlaceOrder = async () => {
        const orderData = {
            items: carts,
            shippingAddress: currentShippingAddress,
            paymentMethod: currentPaymentMethod,
            subtotal,
            shipping,
            discount: discountAmount,
            total,
            promoCode,
        };

        const order = await createOrder(orderData);

        if (order) {
            router.replace({
                pathname: '/screens/checkout/OrderSuccessScreen',
                params: { orderNumber: order.orderNumber }
            });
        }
    };

    const renderCartItem = (item) => (
        <Animated.View
            key={item.id}
            entering={FadeInDown.springify()}
            style={styles.cartItem}
        >
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
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
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                            <Text style={styles.progressLabel}>Shipping</Text>
                        </View>
                        <View style={styles.progressLine} />
                        <View style={[styles.progressStep, styles.progressStepCompleted]}>
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                            <Text style={styles.progressLabel}>Payment</Text>
                        </View>
                        <View style={styles.progressLine} />
                        <View style={[styles.progressStep, styles.progressStepActive]}>
                            <View style={styles.activeStepCircle}>
                                <Ionicons name="document-text" size={20} color="#fff" />
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
                            {carts.map(renderCartItem)}
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
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sectionContent}>
                            <Text style={styles.addressName}>{currentShippingAddress?.name || 'No Address'}</Text>
                            <Text style={styles.addressText}>{currentShippingAddress?.address || ''}</Text>
                            <Text style={styles.addressText}>{currentShippingAddress?.phone || ''}</Text>
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
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sectionContent}>
                            <View style={styles.paymentInfo}>
                                <Ionicons name="card-outline" size={24} color="#fff" />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.paymentType}>{currentPaymentMethod?.type || 'Visa'}</Text>
                                    <Text style={styles.paymentNumber}>{currentPaymentMethod?.number || '**** 4242'}</Text>
                                </View>
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
                                <Text style={styles.priceLabel}>Subtotal</Text>
                                <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Shipping</Text>
                                <Text style={[styles.priceValue, styles.freeText]}>FREE</Text>
                            </View>
                            {discount > 0 && (
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Discount ({promoCode})</Text>
                                    <Text style={[styles.priceValue, styles.discountText]}>-${discountAmount.toFixed(2)}</Text>
                                </View>
                            )}
                            <View style={styles.divider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Place Order Button */}
                <Animated.View
                    entering={FadeInDown.delay(500).springify()}
                    style={styles.footer}
                >
                    <TouchableOpacity
                        style={styles.placeOrderButton}
                        onPress={handlePlaceOrder}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}
                        >
                            <Text style={styles.placeOrderText}>Place Order</Text>
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
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
        paddingBottom: 100,
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
        opacity: 0.7,
    },
    progressStepActive: {},
    activeStepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
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
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    discountText: {
        color: '#FF6B6B',
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
        fontSize: 20,
        fontWeight: '800',
        color: '#667eea',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    placeOrderButton: {
        borderRadius: 16,
        overflow: 'hidden',
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
