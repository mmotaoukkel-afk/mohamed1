import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../../src/context/CardContext';
import { useCheckout } from '../../../src/context/CheckoutContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { getCardType } from '../../../src/services/paymentService';
import { handleError } from '../../../src/utils/errorHandler';
import { cleanInput, rateLimiters } from '../../../src/utils/security';
import { validateCardNumber, validateCVV, validateExpiry, validateName } from '../../../src/utils/validation';
import PremiumBackground from '../../components/PremiumBackground';
import PromoCodeInput from '../../components/PromoCodeInput';

const PaymentScreen = () => {
    const router = useRouter();
    const { colors } = useTheme();
    const { setCurrentPaymentMethod, currentShippingAddress } = useCheckout();
    const { carts, clearCart } = useCart();

    const [selectedMethod, setSelectedMethod] = useState('cod');
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: '',
    });
    const [cardType, setCardType] = useState('unknown');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saveCard, setSaveCard] = useState(false);

    // Detect card type as user types
    useEffect(() => {
        if (cardDetails.number.length >= 4) {
            const type = getCardType(cardDetails.number);
            setCardType(type);
        } else {
            setCardType('unknown');
        }
    }, [cardDetails.number]);

    // Format card number with spaces
    const handleCardNumberChange = (text) => {
        // Remove non-digits
        const cleaned = text.replace(/\D/g, '');
        // Format with spaces every 4 digits
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardDetails({ ...cardDetails, number: formatted.slice(0, 19) });
        if (errors.number) setErrors(prev => ({ ...prev, number: null }));
    };

    // Format expiry date
    const handleExpiryChange = (text) => {
        // Remove non-digits
        const cleaned = text.replace(/\D/g, '');
        // Format as MM/YY
        let formatted = cleaned;
        if (cleaned.length >= 2) {
            formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        setCardDetails({ ...cardDetails, expiry: formatted.slice(0, 5) });
        if (errors.expiry) setErrors(prev => ({ ...prev, expiry: null }));
    };

    const validateCard = () => {
        let valid = true;
        let newErrors = {};

        if (selectedMethod === 'card') {
            // Validate card number using Luhn algorithm
            const cardValidation = validateCardNumber(cardDetails.number.replace(/\s/g, ''));
            if (!cardValidation.isValid) {
                newErrors.number = cardValidation.error;
                valid = false;
            }

            // Validate expiry date
            if (!cardDetails.expiry) {
                newErrors.expiry = 'Expiry date is required';
                valid = false;
            } else {
                const [month, year] = cardDetails.expiry.split('/');
                const expiryValidation = validateExpiry(month, year);
                if (!expiryValidation.isValid) {
                    newErrors.expiry = expiryValidation.error;
                    valid = false;
                }
            }

            // Validate CVV
            const cvvValidation = validateCVV(cardDetails.cvc, cardType);
            if (!cvvValidation.isValid) {
                newErrors.cvc = cvvValidation.error;
                valid = false;
            }

            // Validate holder name
            const nameValidation = validateName(cardDetails.name);
            if (!nameValidation.isValid) {
                newErrors.name = nameValidation.error;
                valid = false;
            }
        }

        setErrors(newErrors);
        return valid;
    };

    const handleContinue = async () => {
        // Rate limiting check
        if (rateLimiters && rateLimiters.payment && !rateLimiters.payment.isAllowed('payment_attempt')) {
            const waitTime = Math.ceil(rateLimiters.payment.getTimeUntilReset('payment_attempt') / 1000);
            Alert.alert(
                'Too Many Attempts',
                `Please wait ${waitTime} seconds before trying again.`
            );
            return;
        }

        if (selectedMethod === 'card' && !validateCard()) {
            return;
        }

        setLoading(true);
        try {
            // Sanitize and save payment method
            const paymentData = {
                type: selectedMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card',
                cardType: selectedMethod === 'card' ? cardType : null,
                lastFour: selectedMethod === 'card' ? cardDetails.number.replace(/\s/g, '').slice(-4) : null,
                holderName: selectedMethod === 'card' ? cleanInput(cardDetails.name) : null,
                saveCard,
            };

            setCurrentPaymentMethod(paymentData);

            // Small delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));

            // Use router.push for navigation
            router.push('/screens/checkout/ReviewOrderScreen');
        } catch (error) {
            handleError(error, {
                context: 'PaymentScreen',
                onError: () => {
                    Alert.alert('Error', 'Failed to process payment method. Please try again.');
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const getCardIcon = () => {
        switch (cardType) {
            case 'visa':
                return <FontAwesome name="cc-visa" size={28} color="#1A1F71" />;
            case 'mastercard':
                return <FontAwesome name="cc-mastercard" size={28} color="#EB001B" />;
            case 'amex':
                return <FontAwesome name="cc-amex" size={28} color="#006FCF" />;
            case 'discover':
                return <FontAwesome name="cc-discover" size={28} color="#FF6000" />;
            default:
                return <FontAwesome name="credit-card" size={24} color="#fff" />;
        }
    };

    const renderPaymentOption = (id, icon, label, subLabel, IconComponent = FontAwesome) => (
        <TouchableOpacity
            style={[
                styles.paymentOption,
                selectedMethod === id && styles.activePaymentOption,
            ]}
            onPress={() => setSelectedMethod(id)}
            activeOpacity={0.7}
        >
            <View style={styles.paymentOptionHeader}>
                <View style={[
                    styles.paymentIconContainer,
                    selectedMethod === id && styles.activeIconContainer
                ]}>
                    <IconComponent name={icon} size={24} color={selectedMethod === id ? '#667eea' : '#fff'} />
                </View>
                <View style={styles.paymentTextContainer}>
                    <Text style={styles.paymentLabel}>{label}</Text>
                    <Text style={styles.paymentSubLabel}>{subLabel}</Text>
                </View>
                <View style={[styles.radioButton, selectedMethod === id && styles.activeRadioButton]}>
                    {selectedMethod === id && <View style={styles.radioInner} />}
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
                            <Text style={[styles.progressText, { color: 'rgba(255,255,255,0.6)' }]}>3</Text>
                        </View>
                        <Text style={styles.progressLabel}>Review</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                        <Animated.View entering={FadeInDown.duration(500)}>
                            <Text style={styles.sectionTitle}>Select Payment Method</Text>

                            {renderPaymentOption('cod', 'money', 'Cash on Delivery', 'Pay when you receive')}
                            {renderPaymentOption('card', 'credit-card', 'Credit / Debit Card', 'Pay securely now')}

                            {/* Apple Pay / Google Pay option */}
                            {Platform.OS === 'ios' && renderPaymentOption(
                                'applepay',
                                'apple',
                                'Apple Pay',
                                'Fast and secure checkout',
                                MaterialCommunityIcons
                            )}
                            {Platform.OS === 'android' && renderPaymentOption(
                                'googlepay',
                                'google',
                                'Google Pay',
                                'Fast and secure checkout',
                                MaterialCommunityIcons
                            )}

                            {/* Promo Code Input */}
                            <PromoCodeInput />

                            {selectedMethod === 'card' && (
                                <Animated.View entering={FadeInUp.duration(400)} style={styles.cardForm}>
                                    {/* Card Preview */}
                                    <View style={styles.cardPreview}>
                                        <View style={styles.cardPreviewHeader}>
                                            {getCardIcon()}
                                            <Text style={styles.cardPreviewType}>
                                                {cardType !== 'unknown' ? cardType.toUpperCase() : 'CREDIT CARD'}
                                            </Text>
                                        </View>
                                        <Text style={styles.cardPreviewNumber}>
                                            {cardDetails.number || '•••• •••• •••• ••••'}
                                        </Text>
                                        <View style={styles.cardPreviewFooter}>
                                            <View>
                                                <Text style={styles.cardPreviewLabel}>CARDHOLDER</Text>
                                                <Text style={styles.cardPreviewValue}>
                                                    {cardDetails.name.toUpperCase() || 'YOUR NAME'}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
                                                <Text style={styles.cardPreviewValue}>
                                                    {cardDetails.expiry || 'MM/YY'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Card Number</Text>
                                        <View style={[styles.inputWrapper, errors.number && styles.inputError]}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="0000 0000 0000 0000"
                                                placeholderTextColor="rgba(255,255,255,0.5)"
                                                value={cardDetails.number}
                                                onChangeText={handleCardNumberChange}
                                                keyboardType="numeric"
                                                maxLength={19}
                                            />
                                            <View style={styles.cardTypeIcon}>
                                                {getCardIcon()}
                                            </View>
                                        </View>
                                        {errors.number && <Text style={styles.errorText}>{errors.number}</Text>}
                                    </View>

                                    <View style={styles.row}>
                                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                            <Text style={styles.inputLabel}>Expiry Date</Text>
                                            <TextInput
                                                style={[styles.inputSmall, errors.expiry && styles.inputError]}
                                                placeholder="MM/YY"
                                                placeholderTextColor="rgba(255,255,255,0.5)"
                                                value={cardDetails.expiry}
                                                onChangeText={handleExpiryChange}
                                                keyboardType="numeric"
                                                maxLength={5}
                                            />
                                            {errors.expiry && <Text style={styles.errorText}>{errors.expiry}</Text>}
                                        </View>

                                        <View style={[styles.inputContainer, { flex: 1 }]}>
                                            <Text style={styles.inputLabel}>CVV</Text>
                                            <View style={[styles.inputWrapper, { paddingRight: 10 }, errors.cvc && styles.inputError]}>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder={cardType === 'amex' ? '1234' : '123'}
                                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                                    value={cardDetails.cvc}
                                                    onChangeText={(text) => {
                                                        setCardDetails({ ...cardDetails, cvc: text.replace(/\D/g, '') });
                                                        if (errors.cvc) setErrors(prev => ({ ...prev, cvc: null }));
                                                    }}
                                                    keyboardType="numeric"
                                                    maxLength={cardType === 'amex' ? 4 : 3}
                                                    secureTextEntry
                                                />
                                                <Ionicons name="help-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
                                            </View>
                                            {errors.cvc && <Text style={styles.errorText}>{errors.cvc}</Text>}
                                        </View>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Cardholder Name</Text>
                                        <TextInput
                                            style={[styles.inputSmall, errors.name && styles.inputError]}
                                            placeholder="John Doe"
                                            placeholderTextColor="rgba(255,255,255,0.5)"
                                            value={cardDetails.name}
                                            onChangeText={(text) => {
                                                setCardDetails({ ...cardDetails, name: text });
                                                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                                            }}
                                            autoCapitalize="words"
                                        />
                                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                                    </View>

                                    {/* Save Card Option */}
                                    <TouchableOpacity
                                        style={styles.saveCardOption}
                                        onPress={() => setSaveCard(!saveCard)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.checkbox, saveCard && styles.checkboxActive]}>
                                            {saveCard && <Ionicons name="checkmark" size={16} color="#667eea" />}
                                        </View>
                                        <Text style={styles.saveCardText}>Save card for future purchases</Text>
                                    </TouchableOpacity>

                                    {/* Security Badge */}
                                    <View style={styles.securityBadge}>
                                        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                                        <Text style={styles.securityText}>
                                            Your payment info is secure and encrypted
                                        </Text>
                                    </View>
                                </Animated.View>
                            )}
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.payButton, loading && styles.payButtonDisabled]}
                        onPress={handleContinue}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#667eea" />
                        ) : (
                            <>
                                <Text style={styles.payButtonText}>Continue to Review</Text>
                                <Ionicons name="arrow-forward" size={20} color="#667eea" />
                            </>
                        )}
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
        paddingBottom: 120,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 15,
    },
    paymentOption: {
        marginBottom: 12,
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
        padding: 16,
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
    activeIconContainer: {
        backgroundColor: '#fff',
    },
    paymentTextContainer: {
        flex: 1,
    },
    paymentLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
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
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    cardPreview: {
        padding: 20,
        borderRadius: 16,
        backgroundColor: '#667eea',
        marginBottom: 20,
    },
    cardPreviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    cardPreviewType: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    cardPreviewNumber: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: 2,
        marginBottom: 20,
    },
    cardPreviewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardPreviewLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardPreviewValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        color: '#fff',
        fontSize: 16,
    },
    inputSmall: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 14,
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
        marginTop: 6,
    },
    cardTypeIcon: {
        marginLeft: 10,
    },
    row: {
        flexDirection: 'row',
    },
    saveCardOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    saveCardText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    securityText: {
        color: '#10B981',
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
    payButtonDisabled: {
        opacity: 0.7,
    },
    payButtonText: {
        color: '#667eea',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default PaymentScreen;
