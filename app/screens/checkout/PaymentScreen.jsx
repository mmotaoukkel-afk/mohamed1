import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useCheckout } from '../../../src/context/CheckoutContext';
import { useCart } from '../../../src/context/CardContext';
import PremiumBackground from '../../components/PremiumBackground';
import Animated, { FadeInDown } from 'react-native-reanimated';

const PaymentScreen = () => {
    const router = useRouter();
    const { colors } = useTheme();
    const { paymentMethod, setPaymentMethod, processOrder } = useCheckout();
    const { carts, clearCart } = useCart();

    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: '',
    });

    const [errors, setErrors] = useState({});

    const validateCard = () => {
        let valid = true;
        let newErrors = {};

        if (paymentMethod === 'card') {
            if (!cardDetails.number || cardDetails.number.length < 16) {
                newErrors.number = 'Valid card number is required';
                valid = false;
            }
            if (!cardDetails.expiry) {
                newErrors.expiry = 'Expiry date is required';
                valid = false;
            }
            if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
                newErrors.cvc = 'Valid CVC is required';
                valid = false;
            }
            if (!cardDetails.name) {
                newErrors.name = 'Cardholder name is required';
                valid = false;
            }
        }

        setErrors(newErrors);
        return valid;
    };

    const handlePlaceOrder = async () => {
        if (validateCard()) {
            const result = await processOrder(carts, cardDetails);
            if (result.success) { clearCart();
                Alert.alert(
                    'Order Placed!',
                    'Your order has been successfully placed.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.push('/(tabs)'),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to process order. Please try again.');
            }
        }
    };

    const renderPaymentOption = (id, icon, label, subLabel) => (
        <TouchableOpacity
            style={[
                styles.paymentOption,
                paymentMethod === id && styles.activePaymentOption,
            ]}
            onPress={() => setPaymentMethod(id)}
        >
            <View style={styles.paymentOptionHeader}>
                <View style={styles.paymentIconContainer}>
                    <FontAwesome name={icon} size={24} color={paymentMethod === id ? '#667eea' : '#fff'} />
                </View>
                <View style={styles.paymentTextContainer}>
                    <Text style={styles.paymentLabel}>{label}</Text>
                    <Text style={styles.paymentSubLabel}>{subLabel}</Text>
                </View>
                <View style={[styles.radioButton, paymentMethod === id && styles.activeRadioButton]}>
                    {paymentMethod === id && <View style={styles.radioInner} />}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment Method</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressItem}>
                        <View style={[styles.progressCircle, styles.completedProgress]}>
                            <Ionicons name="checkmark" size={18} color="#667eea" />
                        </View>
                        <Text style={[styles.progressLabel, styles.completedLabel]}>Shipping</Text>
                    </View>
                    <View style={[styles.progressLine, styles.completedLine]} />
                    <View style={styles.progressItem}>
                        <View style={[styles.progressCircle, styles.activeProgress]}>
                            <Text style={styles.progressText}>2</Text>
                        </View>
                        <Text style={[styles.progressLabel, styles.activeLabel]}>Payment</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressItem}>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressText}>3</Text>
                        </View>
                        <Text style={styles.progressLabel}>Review</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    <Animated.View entering={FadeInDown.duration(500)}>
                        <Text style={styles.sectionTitle}>Select Payment Method</Text>

                        {renderPaymentOption('cod', 'money', 'Cash on Delivery', 'Pay when you receive')}
                        {renderPaymentOption('card', 'credit-card', 'Credit / Debit Card', 'Pay securely now')}

                        {paymentMethod === 'card' && (
                            <Animated.View entering={FadeInDown.duration(400)} style={styles.cardForm}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Card Number</Text>
                                    <TextInput
                                        style={[styles.input, errors.number && styles.inputError]}
                                        placeholder="0000 0000 0000 0000"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        value={cardDetails.number}
                                        onChangeText={(text) => setCardDetails({ ...cardDetails, number: text })}
                                        keyboardType="numeric"
                                        maxLength={19}
                                    />
                                    {errors.number && <Text style={styles.errorText}>{errors.number}</Text>}
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                        <Text style={styles.inputLabel}>Expiry Date</Text>
                                        <TextInput
                                            style={[styles.input, errors.expiry && styles.inputError]}
                                            placeholder="MM/YY"
                                            placeholderTextColor="rgba(255,255,255,0.5)"
                                            value={cardDetails.expiry}
                                            onChangeText={(text) => setCardDetails({ ...cardDetails, expiry: text })}
                                            maxLength={5}
                                        />
                                        {errors.expiry && <Text style={styles.errorText}>{errors.expiry}</Text>}
                                    </View>

                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <Text style={styles.inputLabel}>CVC</Text>
                                        <TextInput
                                            style={[styles.input, errors.cvc && styles.inputError]}
                                            placeholder="123"
                                            placeholderTextColor="rgba(255,255,255,0.5)"
                                            value={cardDetails.cvc}
                                            onChangeText={(text) => setCardDetails({ ...cardDetails, cvc: text })}
                                            keyboardType="numeric"
                                            maxLength={4}
                                        />
                                        {errors.cvc && <Text style={styles.errorText}>{errors.cvc}</Text>}
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Cardholder Name</Text>
                                    <TextInput
                                        style={[styles.input, errors.name && styles.inputError]}
                                        placeholder="John Doe"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        value={cardDetails.name}
                                        onChangeText={(text) => setCardDetails({ ...cardDetails, name: text })}
                                    />
                                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.payButton} onPress={handlePlaceOrder}>
                        <Text style={styles.payButtonText}>
                            {paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
                        </Text>
                        <Ionicons name="checkmark-circle" size={20} color="#667eea" />
                    </TouchableOpacity>
                </View>

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
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 40,
    },
    progressItem: {
        alignItems: 'center',
    },
    progressCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    activeProgress: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    completedProgress: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    progressText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#667eea',
    },
    progressLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    activeLabel: {
        color: '#fff',
        fontWeight: '600',
    },
    completedLabel: {
        color: '#fff',
        fontWeight: '600',
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 10,
        marginBottom: 15,
    },
    completedLine: {
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 15,
    },
    paymentOption: {
        marginBottom: 15,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    activePaymentOption: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: '#fff',
    },
    paymentOptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    paymentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    paymentTextContainer: {
        flex: 1,
    },
    paymentLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    paymentSubLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeRadioButton: {
        borderColor: '#fff',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    cardForm: {
        marginTop: 10,
        padding: 20,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputError: {
        borderColor: '#ff6b6b',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 5,
    },
    row: {
        flexDirection: 'row',
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
    payButton: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    payButtonText: {
        color: '#667eea',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default PaymentScreen;
