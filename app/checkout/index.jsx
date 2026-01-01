/**
 * Single Page Checkout - Kataraa Cosmic Luxury
 * Unified Shipping & Payment Flow with Premium UI
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { useCheckout } from '../../src/context/CheckoutContext';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import api from '../../src/services/api';
import PaymentService from '../../src/services/PaymentService';
import { kuwaitGovernorates, getCitiesByGovernorate, calculateShipping } from '../../src/data/kuwaitLocations';

// UI Kit
import { Text, Input, Button, Surface, IconButton } from '../../src/components/ui';

export default function CheckoutScreen() {
    const router = useRouter();
    const { tokens, isDark } = useTheme();
    const { t } = useTranslation();
    const styles = getStyles(tokens, isDark);

    const {
        shippingInfo, setShippingInfo, setShippingFee, addOrder,
        savedAddresses, saveAddress, savedPaymentMethods, savePaymentMethod,
        pendingOrderId, setPendingOrderId
    } = useCheckout();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();

    const [step, setStep] = useState(1); // 1 = shipping, 2 = payment
    const [showGovDropdown, setShowGovDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, knet, card
    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);

    // Save for later states
    const [saveAddressChecked, setSaveAddressChecked] = useState(false);
    const [saveCardChecked, setSaveCardChecked] = useState(false);

    // Credit Card states
    const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvv: '' });

    const cartTotal = getCartTotal();
    const cities = getCitiesByGovernorate(shippingInfo.governorate);
    const shipping = calculateShipping(shippingInfo.governorate, cartTotal, shippingInfo.city);
    // Ensure shipping fee is updated in context for consistency
    // However, calculateShipping returns the fee object.
    const currentShippingFee = shipping?.fee || 0;
    const finalTotal = cartTotal + currentShippingFee;

    const formatPrice = (price) => `${parseFloat(price || 0).toFixed(3)} ${t('currency')}`;

    const updateField = (field, value) => {
        setShippingInfo(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const selectGovernorate = (gov) => {
        setShippingInfo(prev => ({ ...prev, governorate: gov.id, city: '' }));
        setShippingFee(0);
        setShowGovDropdown(false);
    };

    const selectCity = (city) => {
        setShippingInfo(prev => ({ ...prev, city }));
        const newShipping = calculateShipping(shippingInfo.governorate, cartTotal, city);
        setShippingFee(newShipping.fee);
        setShowCityDropdown(false);
    };

    const useSavedAddress = (addr) => {
        if (addr.data) {
            setShippingInfo({ ...addr.data });
        } else {
            // Backward compatibility
            setShippingInfo(prev => ({ ...prev, fullName: addr.title }));
        }
        setSaveAddressChecked(false);
    };

    const useSavedCard = (card) => {
        setCardInfo({ number: card.raw || card.number, expiry: '', cvv: '' });
        setSaveCardChecked(false);
    };

    const getGovName = () => {
        const gov = kuwaitGovernorates.find(g => g.id === shippingInfo.governorate);
        return gov ? gov.name : t('selectGovernorate');
    };

    const validateShipping = () => {
        const e = {};
        if (!shippingInfo.fullName?.trim()) e.fullName = t('required');
        // Simple regex for phone validation (min 8 digits)
        if (!shippingInfo.phone?.trim() || shippingInfo.phone.length < 8) e.phone = t('invalidPhone');
        if (!shippingInfo.governorate) e.governorate = t('required');
        if (!shippingInfo.city) e.city = t('required');
        if (!shippingInfo.block?.trim()) e.block = t('required');
        if (!shippingInfo.street?.trim()) e.street = t('required');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1 && validateShipping()) {
            setStep(2);
        }
    };

    const verifyStockBeforeOrder = async () => {
        try {
            const stockChecks = await Promise.all(cartItems.map(item => api.getProduct(item.id)));
            const outOfStockItems = stockChecks.filter(p => !p || p.stock_status === 'outofstock');

            if (outOfStockItems.length > 0) {
                const itemNames = outOfStockItems.map(p => p?.name || 'Unknown Item').join(', ');
                Alert.alert(t('outOfStock'), `${itemNames}. ${t('pleaseUpdateCart')}`);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Stock verification error:', error);
            return false;
        }
    };

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        try {
            // 0. Verify Stock
            const isStockValid = await verifyStockBeforeOrder();
            if (!isStockValid) {
                setIsProcessing(false);
                return;
            }

            // 1. Construct WooCommerce Order Data
            const wooOrderData = {
                payment_method: paymentMethod,
                payment_method_title: paymentMethod === 'cod' ? 'Cash on Delivery' : (paymentMethod === 'knet' ? 'KNET' : 'Credit Card'),
                set_paid: false,
                status: 'pending',
                billing: {
                    first_name: shippingInfo.fullName,
                    address_1: shippingInfo.street,
                    address_2: `Block ${shippingInfo.block}`,
                    city: shippingInfo.city,
                    state: shippingInfo.governorate,
                    postcode: 'KW',
                    country: 'KW',
                    email: user?.email || 'guest@kataraa.com',
                    phone: shippingInfo.phone
                },
                shipping: {
                    first_name: shippingInfo.fullName,
                    address_1: shippingInfo.street,
                    address_2: `Block ${shippingInfo.block}`,
                    city: shippingInfo.city,
                    state: shippingInfo.governorate,
                    postcode: 'KW',
                    country: 'KW'
                },
                line_items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity
                }))
            };

            // 2. Create Order in WooCommerce
            const result = await api.createOrder(wooOrderData);
            const orderId = result.id;

            // Persistence for user
            if (saveAddressChecked) {
                await saveAddress({
                    id: Date.now(),
                    title: shippingInfo.fullName,
                    data: { ...shippingInfo }
                });
            }

            if (paymentMethod === 'cod') {
                // Success for COD
                await addOrder({ ...result, id: orderId.toString(), items: [...cartItems], date: new Date().toISOString() });
                clearCart();
                setIsProcessing(false);
                router.replace('/checkout/success');
            } else {
                // 3. Initiate Payment for Card/KNET
                const paymentData = {
                    customerName: shippingInfo.fullName,
                    amount: finalTotal,
                    email: user?.email || 'guest@kataraa.com',
                    mobile: shippingInfo.phone,
                    orderId: orderId.toString()
                };

                const paymentResponse = await PaymentService.initiatePayment(paymentData);

                if (paymentResponse.success) {
                    setPendingOrderId(orderId.toString());
                    // 4. Redirect to Payment Gateway
                    if (paymentResponse.paymentUrl) {
                        Linking.openURL(paymentResponse.paymentUrl);
                    }
                } else {
                    Alert.alert(t('error'), paymentResponse.error || 'Payment failed to initiate');
                    setIsProcessing(false);
                }
            }
        } catch (error) {
            console.error('Order failed:', error);
            Alert.alert(t('error'), t('failedToPlaceOrder'));
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background */}
            <View style={[styles.orb, { backgroundColor: tokens.colors.primary + '08', top: -100, right: -100 }]} />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-back"
                        variant="ghost"
                        onPress={() => router.back()}
                    />
                    <Text variant="title" style={{ flex: 1, textAlign: 'center' }}>{t('checkout')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Progress Steps */}
                <View style={styles.progressRow}>
                    <View style={styles.stepItem}>
                        <Surface
                            variant={step >= 1 ? "glass" : "flat"}
                            style={[styles.stepCircle, step >= 1 && { borderColor: tokens.colors.primary, borderWidth: 1 }]}
                            padding="none"
                        >
                            <Text style={{ color: step >= 1 ? tokens.colors.primary : tokens.colors.textMuted, fontWeight: 'bold' }}>1</Text>
                        </Surface>
                        <Text variant="caption" style={{ marginTop: 4, color: step >= 1 ? tokens.colors.primary : tokens.colors.textMuted }}>{t('shipping')}</Text>
                    </View>
                    <View style={[styles.stepLine, { backgroundColor: step >= 2 ? tokens.colors.primary : tokens.colors.border }]} />
                    <View style={styles.stepItem}>
                        <Surface
                            variant={step >= 2 ? "glass" : "flat"}
                            style={[styles.stepCircle, step >= 2 && { borderColor: tokens.colors.primary, borderWidth: 1 }]}
                            padding="none"
                        >
                            <Text style={{ color: step >= 2 ? tokens.colors.primary : tokens.colors.textMuted, fontWeight: 'bold' }}>2</Text>
                        </Surface>
                        <Text variant="caption" style={{ marginTop: 4, color: step >= 2 ? tokens.colors.primary : tokens.colors.textMuted }}>{t('payment')}</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        style={styles.content}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 150 }}
                    >
                        {step === 1 ? (
                            /* STEP 1: Shipping Form */
                            <View style={styles.formContainer}>
                                <Text variant="subtitle" style={{ marginBottom: 16 }}>{t('shippingAddress')}</Text>

                                {/* Saved Addresses */}
                                {/* Saved Addresses */}
                                {savedAddresses.length > 0 && (
                                    <View style={styles.savedSection}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                            <Ionicons name="bookmark" size={18} color={tokens.colors.primary} style={{ marginRight: 8 }} />
                                            <Text variant="label">{t('useSavedAddress')}</Text>
                                        </View>

                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.savedList}>
                                            {savedAddresses.map((addr) => (
                                                <TouchableOpacity
                                                    key={addr.id}
                                                    style={[
                                                        styles.savedChip,
                                                        {
                                                            backgroundColor: tokens.colors.card,
                                                            borderColor: tokens.colors.border,
                                                            borderWidth: 1
                                                        }
                                                    ]}
                                                    onPress={() => useSavedAddress(addr)}
                                                >
                                                    <View style={{
                                                        width: 32, height: 32, borderRadius: 16,
                                                        backgroundColor: tokens.colors.primary + '15',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        marginRight: 8
                                                    }}>
                                                        <Ionicons name="location" size={16} color={tokens.colors.primary} />
                                                    </View>
                                                    <View>
                                                        <Text variant="body" weight="bold">{addr.title}</Text>
                                                        <Text variant="caption" style={{ color: tokens.colors.textMuted }}>
                                                            {addr.data.city}, {addr.data.block}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                <Input
                                    label={t('fullName')}
                                    placeholder={t('enterName')}
                                    value={shippingInfo.fullName}
                                    onChangeText={v => updateField('fullName', v)}
                                    error={errors.fullName}
                                />
                                <Input
                                    label={t('phone')}
                                    placeholder={t('enterPhone')}
                                    value={shippingInfo.phone}
                                    onChangeText={v => updateField('phone', v)}
                                    keyboardType="phone-pad"
                                    error={errors.phone}
                                />

                                {/* Governorate Select - Custom UI */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text variant="label" style={{ marginBottom: 8 }}>{t('governorate')}</Text>
                                    <TouchableOpacity
                                        style={[styles.selectBox, { borderColor: errors.governorate ? tokens.colors.error : tokens.colors.border }]}
                                        onPress={() => setShowGovDropdown(!showGovDropdown)}
                                    >
                                        <Text style={{ color: shippingInfo.governorate ? tokens.colors.text : tokens.colors.textMuted }}>
                                            {getGovName()}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color={tokens.colors.primary} />
                                    </TouchableOpacity>
                                    {errors.governorate && <Text variant="caption" style={{ color: tokens.colors.error, marginTop: 4 }}>{errors.governorate}</Text>}

                                    {showGovDropdown && (
                                        <Surface style={styles.dropdownList} elevation={4}>
                                            {kuwaitGovernorates.map(gov => (
                                                <TouchableOpacity
                                                    key={gov.id}
                                                    style={styles.dropdownItem}
                                                    onPress={() => selectGovernorate(gov)}
                                                >
                                                    <Text>{gov.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </Surface>
                                    )}
                                </View>

                                {/* City Select */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text variant="label" style={{ marginBottom: 8 }}>{t('city')}</Text>
                                    <TouchableOpacity
                                        style={[styles.selectBox, { borderColor: errors.city ? tokens.colors.error : tokens.colors.border, opacity: shippingInfo.governorate ? 1 : 0.6 }]}
                                        onPress={() => shippingInfo.governorate && setShowCityDropdown(!showCityDropdown)}
                                        disabled={!shippingInfo.governorate}
                                    >
                                        <Text style={{ color: shippingInfo.city ? tokens.colors.text : tokens.colors.textMuted }}>
                                            {shippingInfo.city || t('selectCity')}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color={tokens.colors.primary} />
                                    </TouchableOpacity>
                                    {errors.city && <Text variant="caption" style={{ color: tokens.colors.error, marginTop: 4 }}>{errors.city}</Text>}

                                    {showCityDropdown && (cities.length > 0) && (
                                        <Surface style={styles.dropdownList} elevation={4}>
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {cities.map((city, i) => (
                                                    <TouchableOpacity
                                                        key={i}
                                                        style={styles.dropdownItem}
                                                        onPress={() => selectCity(city)}
                                                    >
                                                        <Text>{city}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </Surface>
                                    )}
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.halfInput, { marginRight: 8 }]}>
                                        <Input
                                            label={t('block')}
                                            placeholder="1"
                                            value={shippingInfo.block}
                                            onChangeText={v => updateField('block', v)}
                                            error={errors.block}
                                        />
                                    </View>
                                    <View style={[styles.halfInput, { marginLeft: 8 }]}>
                                        <Input
                                            label={t('street')}
                                            placeholder="Street Name"
                                            value={shippingInfo.street}
                                            onChangeText={v => updateField('street', v)}
                                            error={errors.street}
                                        />
                                    </View>
                                </View>

                                <Input
                                    label={t('notes')}
                                    placeholder={t('enterNotes')}
                                    value={shippingInfo.notes}
                                    onChangeText={v => updateField('notes', v)}
                                    multiline
                                    numberOfLines={3}
                                />

                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setSaveAddressChecked(!saveAddressChecked)}
                                >
                                    <View style={[styles.checkbox, saveAddressChecked && { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary }]}>
                                        {saveAddressChecked && <Ionicons name="checkmark" size={12} color="#fff" />}
                                    </View>
                                    <Text variant="body">{t('saveForLater')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* STEP 2: Payment & Summary */
                            <View style={styles.formContainer}>
                                <Text variant="subtitle" style={{ marginBottom: 16 }}>{t('orderSummary')}</Text>

                                <Surface variant="glass" padding="md" style={{ marginBottom: 24 }}>
                                    {cartItems.map(item => (
                                        <View key={item.id} style={styles.orderItem}>
                                            <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                                            <View style={styles.orderItemInfo}>
                                                <Text variant="body" weight="bold">{item.name}</Text>
                                                <Text variant="caption">x{item.quantity}</Text>
                                            </View>
                                            <Text variant="body" weight="bold">{formatPrice(item.price * item.quantity)}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.divider} />
                                    <View style={styles.summaryRow}>
                                        <Text variant="body">{t('subtotal')}</Text>
                                        <Text variant="body">{formatPrice(cartTotal)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text variant="body">{t('shipping')}</Text>
                                        <Text variant="body" style={{ color: currentShippingFee === 0 ? tokens.colors.success : tokens.colors.text }}>
                                            {currentShippingFee === 0 ? t('free') : formatPrice(currentShippingFee)}
                                        </Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <View style={styles.summaryRow}>
                                        <Text variant="title">{t('total')}</Text>
                                        <Text variant="title" style={{ color: tokens.colors.primary }}>{formatPrice(finalTotal)}</Text>
                                    </View>
                                </Surface>

                                <Text variant="subtitle" style={{ marginBottom: 16 }}>{t('paymentMethod')}</Text>

                                <View style={styles.paymentMethods}>
                                    {['cod', 'knet', 'card'].map(method => (
                                        <TouchableOpacity
                                            key={method}
                                            style={[
                                                styles.paymentOption,
                                                paymentMethod === method && { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primary + '10' }
                                            ]}
                                            onPress={() => setPaymentMethod(method)}
                                        >
                                            <View style={[styles.radio, paymentMethod === method && { borderColor: tokens.colors.primary }]}>
                                                {paymentMethod === method && <View style={[styles.radioInner, { backgroundColor: tokens.colors.primary }]} />}
                                            </View>
                                            <Ionicons
                                                name={method === 'cod' ? 'cash-outline' : 'card-outline'}
                                                size={24}
                                                color={tokens.colors.text}
                                                style={{ marginRight: 12 }}
                                            />
                                            <Text variant="body" weight="bold">{t(method)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {paymentMethod === 'card' && (
                                    <View style={styles.cardForm}>
                                        {/* Saved Cards */}
                                        {savedPaymentMethods.length > 0 && (
                                            <View style={{ marginBottom: 16 }}>
                                                <Text variant="label" style={{ marginBottom: 8 }}>{t('useSavedCard')}</Text>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                    {savedPaymentMethods.map((card) => (
                                                        <TouchableOpacity
                                                            key={card.id || Math.random()}
                                                            style={[
                                                                styles.savedChip,
                                                                {
                                                                    backgroundColor: tokens.colors.card,
                                                                    borderColor: tokens.colors.border,
                                                                    borderWidth: 1,
                                                                    minWidth: 140
                                                                }
                                                            ]}
                                                            onPress={() => useSavedCard(card)}
                                                        >
                                                            <Ionicons name="card" size={20} color={tokens.colors.primary} style={{ marginRight: 8 }} />
                                                            <View>
                                                                <Text variant="body">•••• {card.number?.slice(-4) || '????'}</Text>
                                                                <Text variant="caption" style={{ color: tokens.colors.textMuted }}>{card.expiry}</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                        <Input
                                            label={t('cardNumber')}
                                            placeholder="XXXX XXXX XXXX XXXX"
                                            value={cardInfo.number}
                                            onChangeText={v => setCardInfo({ ...cardInfo, number: v })}
                                            keyboardType="numeric"
                                            maxLength={16}
                                        />
                                        <View style={styles.row}>
                                            <View style={[styles.halfInput, { marginRight: 8 }]}>
                                                <Input
                                                    label={t('expiryDate')}
                                                    placeholder="MM/YY"
                                                    value={cardInfo.expiry}
                                                    onChangeText={v => setCardInfo({ ...cardInfo, expiry: v })}
                                                    maxLength={5}
                                                />
                                            </View>
                                            <View style={[styles.halfInput, { marginLeft: 8 }]}>
                                                <Input
                                                    label={t('cvv')}
                                                    placeholder="123"
                                                    value={cardInfo.cvv}
                                                    onChangeText={v => setCardInfo({ ...cardInfo, cvv: v })}
                                                    keyboardType="numeric"
                                                    maxLength={3}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Action Bar */}
                <Surface variant="glass" style={styles.bottomBar} padding="lg">
                    {step === 1 ? (
                        <Button
                            title={t('continuePayment')}
                            onPress={handleNextStep}
                            variant="primary"
                            icon={<Ionicons name="arrow-forward" size={20} color="#FFF" />}
                        />
                    ) : (
                        <Button
                            title={isProcessing ? t('processing') : `${t('confirmOrder')} - ${formatPrice(finalTotal)}`}
                            onPress={handlePlaceOrder}
                            variant="primary"
                            disabled={isProcessing}
                            icon={!isProcessing ? <Ionicons name="checkmark-circle" size={20} color="#FFF" /> : undefined}
                        />
                    )}
                </Surface>
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
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    stepItem: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    stepLine: {
        width: 60,
        height: 2,
        marginHorizontal: 10,
        marginBottom: 14,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    formContainer: {
        paddingBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    halfInput: {
        flex: 1,
    },
    selectBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        backgroundColor: tokens.colors.inputBackground,
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 100,
        marginTop: 4,
        borderRadius: 12,
        backgroundColor: tokens.colors.card,
    },
    dropdownItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    savedSection: {
        marginBottom: 24,
    },
    savedList: {
        flexDirection: 'row',
    },
    savedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginRight: 10,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderItemImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: 12,
    },
    orderItemInfo: {
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: tokens.colors.border,
        marginVertical: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    paymentMethods: {
        gap: 12,
        marginBottom: 24,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        backgroundColor: tokens.colors.card,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: tokens.colors.border,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    bottomBar: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
});
