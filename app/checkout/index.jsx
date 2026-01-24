/**
 * Single Page Checkout - Kataraa Cosmic Luxury
 * Unified Shipping & Payment Flow with Premium UI
 */

import React, { useState, useEffect } from 'react';
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
import { getAllCoupons, validateCoupon, updateCouponUsage, getAllCountries, getDeliveryPrice, ARAB_COUNTRIES } from '../../src/services/adminSettingsService';
import { kuwaitGovernorates, kuwaitCities, calculateShipping } from '../../src/data/kuwaitLocations';

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

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [coupons, setCoupons] = useState([]);

    // Shipping states (Dynamic)
    const [allCountries, setAllCountries] = useState(ARAB_COUNTRIES);
    const [activeZones, setActiveZones] = useState([]);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [suggestedCities, setSuggestedCities] = useState([]);

    // Initial data loading
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [couponsData, countriesData] = await Promise.all([
                    getAllCoupons(),
                    getAllCountries()
                ]);
                setCoupons(couponsData);

                // Merge Firestore countries with Arab suggestions
                if (countriesData && countriesData.length > 0) {
                    const combined = [...ARAB_COUNTRIES];
                    countriesData.forEach(c => {
                        if (!combined.find(ac => ac.id === c.id || ac.code === c.code)) {
                            combined.push(c);
                        }
                    });
                    setAllCountries(combined);
                }

                // Set default country (e.g. Kuwait)
                const kuwait = ARAB_COUNTRIES.find(c => c.id === 'kuwait');
                if (kuwait && !shippingInfo.country) {
                    selectCountry(kuwait);
                }
            } catch (error) {
                console.error('Error loading checkout data:', error);
            }
        };
        loadInitialData();
    }, []);

    const cartTotal = getCartTotal();

    // Shipping calculation
    const getShippingFee = () => {
        if (appliedCoupon?.type === 'free_shipping') return 0;

        // Specialized logic for Kuwait
        if (shippingInfo.country === 'kuwait' || shippingInfo.country === 'KW') {
            const res = calculateShipping(shippingInfo.governorate, cartTotal, shippingInfo.city);
            return res.fee;
        }

        // Firestore dynamic zones
        const res = getDeliveryPrice(shippingInfo.city, cartTotal, activeZones);
        return res?.price || 0;
    };

    const currentShippingFee = getShippingFee();
    const finalTotal = cartTotal - discountAmount + currentShippingFee;

    const formatPrice = (price) => {
        const country = allCountries.find(c => c.id === shippingInfo.country || c.code === shippingInfo.country);
        const symbol = country?.currency || t('currency');
        return `${parseFloat(price || 0).toFixed(3)} ${symbol}`;
    };

    const updateField = (field, value) => {
        setShippingInfo(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const selectCountry = (country) => {
        updateField('country', country.id);
        updateField('city', '');
        updateField('governorate', '');

        // Update suggested cities
        if (country.id === 'kuwait') {
            setSuggestedCities([]); // We show governorates first for Kuwait
        } else if (country.id === 'morocco') {
            // Use DELIVERY_ZONES from admin service (already handled by getDeliveryPrice fallback if we want)
            // But for suggestions we can just map them
            setSuggestedCities(['الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'فاس', 'أكادير']);
        } else {
            // Basic suggestions for other Arab countries
            const citySuggestions = {
                saudi: ['الرياض', 'جددة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة'],
                uae: ['دبي', 'أبو ظبي', 'الشارقة', 'عجمان'],
                qatar: ['الدوحة', 'الوكرة', 'الخور'],
                egypt: ['القاهرة', 'الإسكندرية', 'الجيزة'],
            };
            setSuggestedCities(citySuggestions[country.id] || []);
        }

        setActiveZones(country.zones || []);
        setShowCountryDropdown(false);
    };

    const selectCity = (city) => {
        updateField('city', city);
        setShowCityDropdown(false);
    };

    const selectGovernorate = (govId) => {
        updateField('governorate', govId);
        const cities = kuwaitCities[govId] || [];
        setSuggestedCities(cities);
    };

    const getCountryName = () => {
        const country = allCountries.find(c => c.id === shippingInfo.country || c.code === shippingInfo.country);
        return country ? `${country.flag || '📍'} ${country.name}` : t('selectCountry');
    };

    const validateShipping = () => {
        const e = {};
        if (!shippingInfo.fullName?.trim()) e.fullName = t('required');
        // Simple regex for phone validation (min 8 digits)
        if (!shippingInfo.phone?.trim() || shippingInfo.phone.length < 8) e.phone = t('invalidPhone');
        if (!shippingInfo.country) e.country = t('required');
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
            console.log('🔄 Verifying stock for items:', cartItems.length);

            // Validate IDs
            const invalidItems = cartItems.filter(item => !item.id);
            if (invalidItems.length > 0) {
                console.warn('⚠️ Found items in cart without valid IDs:', invalidItems);
                Alert.alert(t('error'), 'Found invalid items in your cart. Please try removing them and adding them again.');
                return false;
            }

            const stockChecks = await Promise.all(cartItems.map(item => {
                console.log(`🔍 Checking stock for product: ${item.id} (${item.name})`);
                return api.getProduct(item.id);
            }));

            // Filter out null results (failed fetches)
            const resolvedStock = stockChecks.filter(p => p !== null);

            if (resolvedStock.length < cartItems.length) {
                console.warn('⚠️ Some products could not be found in Firestore.');
                // We handle missing products as out of stock for safety
            }

            const outOfStockItems = resolvedStock.filter(p => p.stock <= 0 || p.status === 'out_of_stock');

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

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) return;

        setIsValidatingCoupon(true);
        const result = validateCoupon(couponCode, cartTotal, coupons);

        if (result.valid) {
            setAppliedCoupon(result.coupon);
            setDiscountAmount(result.discount);
            Alert.alert(t('success'), `${t('couponApplied')} (${result.coupon.code})`);
        } else {
            Alert.alert(t('error'), result.error);
            setAppliedCoupon(null);
            setDiscountAmount(0);
        }
        setIsValidatingCoupon(false);
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

            // 1. Construct Order Data
            const wooOrderData = {
                payment_method: paymentMethod,
                payment_method_title: paymentMethod === 'cod' ? 'Cash on Delivery' : (paymentMethod === 'knet' ? 'KNET' : 'Credit Card'),
                set_paid: false,
                status: 'pending',
                customer: {
                    uid: user?.uid,
                    displayName: user?.displayName || shippingInfo.fullName,
                    email: user?.email || 'guest@kataraa.com',
                    photoURL: user?.photoURL || null
                },
                shipping_info: { ...shippingInfo },
                billing: {
                    first_name: shippingInfo.fullName,
                    address_1: shippingInfo.street,
                    address_2: `Block ${shippingInfo.block}`,
                    city: shippingInfo.city,
                    state: shippingInfo.governorate,
                    postcode: 'KW',
                    country: shippingInfo.country === 'kuwait' ? 'KW' : shippingInfo.country,
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
                    country: shippingInfo.country === 'kuwait' ? 'KW' : shippingInfo.country
                },
                line_items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    name: item.name,
                    price: item.price,
                    image: item.image
                })),
                total: finalTotal,
                currency: 'KWD', // Or dynamic based on country
                shipping_total: currentShippingFee,
                discount_total: discountAmount
            };

            // 2. Create Order
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
                // 3. Update Coupon Usage if applied
                if (appliedCoupon && appliedCoupon.id) {
                    await updateCouponUsage(appliedCoupon.id);
                }

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
                                <Text variant="subtitle" style={{ marginBottom: 20, textAlign: 'center' }}>{t('shippingAddress')}</Text>

                                {/* Arab Country Suggestions - Horizontal Scroll */}
                                <View style={{ marginBottom: 24 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text variant="label" weight="bold">{t('selectCountry')}</Text>
                                        <TouchableOpacity onPress={() => setShowCountryDropdown(!showCountryDropdown)}>
                                            <Text variant="caption" style={{ color: tokens.colors.primary }}>{t('viewAll')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                                        {ARAB_COUNTRIES.map(country => (
                                            <TouchableOpacity
                                                key={country.id}
                                                style={[
                                                    styles.countryCircle,
                                                    shippingInfo.country === country.id && { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primary + '10' }
                                                ]}
                                                onPress={() => selectCountry(country)}
                                            >
                                                <View style={styles.flagWrapper}>
                                                    <Text style={{ fontSize: 24 }}>{country.flag}</Text>
                                                </View>
                                                <Text variant="caption" weight={shippingInfo.country === country.id ? "bold" : "regular"} style={{ marginTop: 6, color: shippingInfo.country === country.id ? tokens.colors.primary : tokens.colors.text }}>
                                                    {country.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    {showCountryDropdown && (
                                        <Surface style={[styles.dropdownList, { marginTop: 10 }]} elevation={4}>
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {allCountries.map(country => (
                                                    <TouchableOpacity
                                                        key={country.id}
                                                        style={styles.dropdownItem}
                                                        onPress={() => selectCountry(country)}
                                                    >
                                                        <Text>{country.flag} {country.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </Surface>
                                    )}
                                </View>

                                <Surface variant="glass" padding="md" style={{ marginBottom: 32, borderRadius: 24 }}>
                                    <Input
                                        label={t('fullName')}
                                        placeholder={t('enterName')}
                                        value={shippingInfo.fullName}
                                        onChangeText={v => updateField('fullName', v)}
                                        error={errors.fullName}
                                        icon={<Ionicons name="person-outline" size={18} color={tokens.colors.primary} />}
                                    />

                                    <View style={{ height: 24 }} />

                                    <Input
                                        label={t('phone')}
                                        placeholder={t('enterPhone')}
                                        value={shippingInfo.phone}
                                        onChangeText={v => updateField('phone', v)}
                                        keyboardType="phone-pad"
                                        error={errors.phone}
                                        icon={<Ionicons name="call-outline" size={18} color={tokens.colors.primary} />}
                                    />
                                </Surface>

                                {/* Location Details Suggestions */}
                                <Surface variant="glass" padding="md" style={{ marginBottom: 32, borderRadius: 24 }}>
                                    {/* Kuwait Specialized Governorate Select */}
                                    {shippingInfo.country === 'kuwait' && (
                                        <View style={{ marginBottom: 24 }}>
                                            <Text variant="label" style={{ marginBottom: 16 }}>{t('governorate')}</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                {kuwaitGovernorates.map(gov => (
                                                    <TouchableOpacity
                                                        key={gov.id}
                                                        style={[
                                                            styles.pillChip,
                                                            shippingInfo.governorate === gov.id && { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary }
                                                        ]}
                                                        onPress={() => selectGovernorate(gov.id)}
                                                    >
                                                        <Text style={{ color: shippingInfo.governorate === gov.id ? '#FFF' : tokens.colors.text, fontSize: 13, fontWeight: shippingInfo.governorate === gov.id ? 'bold' : 'normal' }}>
                                                            {gov.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}

                                    {/* City / Area Suggestions */}
                                    {suggestedCities.length > 0 && (
                                        <View style={{ marginBottom: 24 }}>
                                            <Text variant="label" style={{ marginBottom: 16 }}>{t('selectCity')}</Text>
                                            <View style={styles.chipsWrapper}>
                                                {suggestedCities.slice(0, 10).map((city, i) => (
                                                    <TouchableOpacity
                                                        key={i}
                                                        style={[
                                                            styles.pillChip,
                                                            shippingInfo.city === city && { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary }
                                                        ]}
                                                        onPress={() => selectCity(city)}
                                                    >
                                                        <Text style={{ color: shippingInfo.city === city ? '#FFF' : tokens.colors.text, fontSize: 13, fontWeight: shippingInfo.city === city ? 'bold' : 'normal' }}>
                                                            {city}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                                {suggestedCities.length > 10 && (
                                                    <TouchableOpacity onPress={() => setShowCityDropdown(true)} style={[styles.pillChip, { backgroundColor: tokens.colors.primary + '10' }]}>
                                                        <Text style={{ fontSize: 13, color: tokens.colors.primary }}>+ {suggestedCities.length - 10}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    <Input
                                        label={t('city')}
                                        placeholder={t('selectCity')}
                                        value={shippingInfo.city}
                                        onChangeText={v => updateField('city', v)}
                                        error={errors.city}
                                        icon={<Ionicons name="location-outline" size={18} color={tokens.colors.primary} />}
                                    />

                                    <View style={{ height: 24 }} />

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
                                </Surface>

                                {/* Optional Coupon Section - More subtle */}
                                <Surface variant="glass" padding="md" style={{ marginBottom: 28, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: tokens.colors.primary + '30' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="pricetag-outline" size={18} color={tokens.colors.primary} style={{ marginRight: 6 }} />
                                            <Text variant="label" weight="bold">{t('promoCode')}</Text>
                                        </View>
                                        <Text variant="caption" style={{ color: tokens.colors.textMuted }}>({t('optional')})</Text>
                                    </View>

                                    <View style={styles.promoInputRow}>
                                        <View style={{ flex: 1 }}>
                                            <Input
                                                placeholder={t('enterPromoCode')}
                                                value={couponCode}
                                                onChangeText={setCouponCode}
                                                containerStyle={{ marginBottom: 0 }}
                                                autoCapitalize="characters"
                                            />
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.applyBtnSmall, { backgroundColor: couponCode.trim() ? tokens.colors.primary : tokens.colors.border }]}
                                            onPress={handleApplyCoupon}
                                            disabled={isValidatingCoupon || !couponCode.trim()}
                                        >
                                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{isValidatingCoupon ? '...' : t('apply')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {appliedCoupon && (
                                        <TouchableOpacity
                                            style={styles.removeCoupon}
                                            onPress={() => {
                                                setAppliedCoupon(null);
                                                setDiscountAmount(0);
                                                setCouponCode('');
                                            }}
                                        >
                                            <Ionicons name="close-circle" size={16} color={tokens.colors.error} />
                                            <Text variant="caption" style={{ color: tokens.colors.error, marginLeft: 4 }}>{t('removeCoupon')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </Surface>

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
                                    {discountAmount > 0 && (
                                        <View style={styles.summaryRow}>
                                            <Text variant="body" style={{ color: tokens.colors.success }}>{t('discount')} ({appliedCoupon?.code})</Text>
                                            <Text variant="body" style={{ color: tokens.colors.success }}>-{formatPrice(discountAmount)}</Text>
                                        </View>
                                    )}
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
    countryCircle: {
        width: 80,
        height: 90,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        backgroundColor: tokens.colors.card,
        marginRight: 12,
    },
    flagWrapper: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: tokens.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    pillChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: tokens.colors.card,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        marginRight: 10,
        marginBottom: 10,
    },
    chipsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    applyBtnSmall: {
        height: 50,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
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
    promoInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    applyBtn: {
        height: 50,
        paddingHorizontal: 20,
    },
    removeCoupon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        alignSelf: 'flex-start',
    },
});
