<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, KeyboardAvoidingView, Platform, StatusBar, Modal, FlatList
=======
import React, { useState, useRef } from 'react';
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
    ActivityIndicator,
>>>>>>> origin/main
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import PremiumBackground from '../../components/PremiumBackground';
<<<<<<< HEAD
import { useCheckout } from '../../../src/context/CheckoutContext';
import { useCart } from '../../../src/context/CardContext';
import { KUWAIT_STATES, KUWAIT_CITIES, calculateShipping } from '../../data/kuwaitLocations';

const ShippingScreen = () => {
    const router = useRouter();
    const { shippingAddress, setShippingAddress } = useCheckout();
    const { totalPrice } = useCart();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        state: '',
        stateName: '',
=======
import Animated, { FadeInDown } from 'react-native-reanimated';
import { validateName, validatePhone, validateAddress } from '../../../src/utils/validation';
import { cleanInput, isInputSafe } from '../../../src/utils/security';

const ShippingScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { currentShippingAddress, setCurrentShippingAddress, savedAddresses } = useCheckout();

    const [form, setForm] = useState(currentShippingAddress || {
        fullName: '',
        phoneNumber: '',
        address: '',
>>>>>>> origin/main
        city: '',
        cityName: '',
        address: '',
        notes: '',
    });

    const [errors, setErrors] = useState({});
<<<<<<< HEAD
    const [showStateModal, setShowStateModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [shippingCost, setShippingCost] = useState({ cost: 0, label: '' });
    const [cities, setCities] = useState([]);

    useEffect(() => {
        if (form.state) {
            setCities(KUWAIT_CITIES[form.state] || []);
            setForm(prev => ({ ...prev, city: '', cityName: '' }));
        }
    }, [form.state]);

    useEffect(() => {
        if (form.city) {
            const shipping = calculateShipping(form.city, parseFloat(totalPrice));
            setShippingCost(shipping);
        }
    }, [form.city, totalPrice]);
=======
    const [loading, setLoading] = useState(false);

    // Refs for input navigation
    const phoneRef = useRef(null);
    const addressRef = useRef(null);
    const cityRef = useRef(null);
    const zipRef = useRef(null);
    const countryRef = useRef(null);
>>>>>>> origin/main

    const validate = () => {
        let newErrors = {};
<<<<<<< HEAD
        if (!form.firstName) newErrors.firstName = 'الاسم الأول مطلوب';
        if (!form.lastName) newErrors.lastName = 'الاسم الأخير مطلوب';
        if (!form.phone) newErrors.phone = 'رقم الهاتف مطلوب';
        if (!form.state) newErrors.state = 'المحافظة مطلوبة';
        if (!form.city) newErrors.city = 'المدينة مطلوبة';
        if (!form.address) newErrors.address = 'العنوان مطلوب';
=======

        // Validate full name
        const nameResult = validateName(form.fullName);
        if (!nameResult.isValid) {
            newErrors.fullName = nameResult.error;
            valid = false;
        }

        // Validate phone
        const phoneResult = validatePhone(form.phoneNumber);
        if (!phoneResult.isValid) {
            newErrors.phoneNumber = phoneResult.error;
            valid = false;
        }

        // Validate address
        if (!form.address || form.address.trim().length < 5) {
            newErrors.address = 'Please enter a valid address';
            valid = false;
        }

        // Validate city
        if (!form.city || form.city.trim().length < 2) {
            newErrors.city = 'City is required';
            valid = false;
        }

        // Validate zip code
        if (!form.zipCode || !/^[\w\s\-]{3,10}$/.test(form.zipCode.trim())) {
            newErrors.zipCode = 'Invalid zip code';
            valid = false;
        }

        // Check for injection attempts
        const fieldsToCheck = [form.fullName, form.address, form.city, form.country];
        for (const field of fieldsToCheck) {
            if (field && !isInputSafe(field)) {
                Alert.alert('Security Warning', 'Invalid characters detected in your input.');
                return false;
            }
        }

>>>>>>> origin/main
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
<<<<<<< HEAD
            setShippingAddress({
                fullName: `${form.firstName} ${form.lastName}`,
                phoneNumber: form.phone,
                state: form.state,
                stateName: form.stateName,
                city: form.city,
                cityName: form.cityName,
                address: form.address,
                notes: form.notes,
                shippingCost: shippingCost.cost,
            });
            router.push('/screens/checkout/PaymentScreen');
        }
    };

    const selectState = (state) => {
        setForm({ ...form, state: state.id, stateName: state.name });
        setShowStateModal(false);
=======
            setLoading(true);
            // Sanitize all inputs before saving
            const sanitizedForm = {
                fullName: cleanInput(form.fullName),
                phoneNumber: cleanInput(form.phoneNumber),
                address: cleanInput(form.address),
                city: cleanInput(form.city),
                zipCode: cleanInput(form.zipCode),
                country: cleanInput(form.country),
            };
            setCurrentShippingAddress(sanitizedForm);
            setLoading(false);
            navigation.navigate('PaymentScreen');
        }
    };

    const handleUseSavedAddress = (address) => {
        setForm(address);
        setErrors({});
    };

    const handleInputChange = (field, text) => {
        setForm({ ...form, [field]: text });
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
>>>>>>> origin/main
    };

    const selectCity = (city) => {
        setForm({ ...form, city: city.id, cityName: city.name });
        setShowCityModal(false);
    };

    const renderInput = (label, field, placeholder, keyboardType = 'default', icon) => (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label} <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
                {icon && <Ionicons name={icon} size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />}
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={form[field]}
                    onChangeText={(text) => setForm({ ...form, [field]: text })}
                    keyboardType={keyboardType}
                />
            </View>
            {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
        </Animated.View>
    );

    const renderDropdown = (label, value, placeholder, onPress, error) => (
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label} <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
                style={[styles.dropdown, error && styles.inputError]} 
                onPress={onPress}
            >
                <Text style={value ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </Animated.View>
    );

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>عنوان الشحن</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Progress */}
                <Animated.View entering={FadeInUp.duration(500)} style={styles.progressContainer}>
                    <View style={styles.progressItem}>
                        <LinearGradient colors={['#ff6b9d', '#c44569']} style={styles.progressCircleActive}>
                            <Text style={styles.progressTextActive}>1</Text>
                        </LinearGradient>
                        <Text style={styles.progressLabelActive}>الشحن</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressItem}>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressText}>2</Text>
                        </View>
                        <Text style={styles.progressLabel}>الدفع</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressItem}>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressText}>3</Text>
                        </View>
                        <Text style={styles.progressLabel}>تأكيد</Text>
                    </View>
                </Animated.View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                        
                        {/* Form Card */}
                        <Animated.View entering={FadeInDown.duration(500)} style={styles.formCard}>
                            <View style={styles.formHeader}>
                                <Ionicons name="location" size={24} color="#ff6b9d" />
                                <Text style={styles.formTitle}>تفاصيل التوصيل</Text>
                            </View>

                            {/* Name Row */}
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    {renderInput('الاسم الأول', 'firstName', 'محمد', 'default', 'person-outline')}
                                </View>
                                <View style={{ flex: 1 }}>
                                    {renderInput('الاسم الأخير', 'lastName', 'الأحمد', 'default', null)}
                                </View>
                            </View>

                            {renderInput('رقم الهاتف', 'phone', '+965 xxxxxxxx', 'phone-pad', 'call-outline')}

                            {/* State Dropdown */}
                            {renderDropdown('المحافظة', form.stateName, 'اختر المحافظة', () => setShowStateModal(true), errors.state)}

                            {/* City Dropdown */}
                            {renderDropdown('المدينة', form.cityName, 'اختر المدينة', () => form.state && setShowCityModal(true), errors.city)}

                            {renderInput('العنوان التفصيلي', 'address', 'شارع، قطعة، منزل...', 'default', 'home-outline')}

                            {renderInput('ملاحظات (اختياري)', 'notes', 'تعليمات خاصة للتوصيل...', 'default', 'document-text-outline')}
                        </Animated.View>

                        {/* Shipping Cost Card */}
                        {form.city && (
                            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.shippingCard}>
                                <View style={styles.shippingRow}>
                                    <Ionicons name="car" size={24} color="#ff6b9d" />
                                    <View style={styles.shippingInfo}>
                                        <Text style={styles.shippingLabel}>تكلفة التوصيل</Text>
                                        <Text style={styles.shippingValue}>{shippingCost.label}</Text>
                                    </View>
                                    {shippingCost.cost === 0 && (
                                        <View style={styles.freeBadge}>
                                            <Text style={styles.freeText}>مجاني</Text>
                                        </View>
                                    )}
                                </View>
                                {parseFloat(totalPrice) < 25 && (
                                    <View style={styles.freeShippingHint}>
                                        <Ionicons name="gift" size={16} color="#ff6b9d" />
                                        <Text style={styles.hintText}>
                                            أضف {(25 - parseFloat(totalPrice)).toFixed(2)} د.ك للحصول على شحن مجاني!
                                        </Text>
                                    </View>
                                )}
                            </Animated.View>
                        )}

                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <LinearGradient colors={['#ff6b9d', '#c44569']} style={styles.nextButtonGradient}>
                            <Text style={styles.nextButtonText}>متابعة للدفع</Text>
                            <Ionicons name="arrow-back" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* State Modal */}
                <Modal visible={showStateModal} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>اختر المحافظة</Text>
                                <TouchableOpacity onPress={() => setShowStateModal(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={KUWAIT_STATES}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalItem} onPress={() => selectState(item)}>
                                        <Text style={styles.modalItemText}>{item.name}</Text>
                                        {form.state === item.id && <Ionicons name="checkmark" size={20} color="#ff6b9d" />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

                {/* City Modal */}
                <Modal visible={showCityModal} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>اختر المدينة</Text>
                                <TouchableOpacity onPress={() => setShowCityModal(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={cities}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalItem} onPress={() => selectCity(item)}>
                                        <Text style={styles.modalItemText}>{item.name}</Text>
                                        {item.specialShipping && <Text style={styles.specialBadge}>+5 د.ك</Text>}
                                        {form.city === item.id && <Ionicons name="checkmark" size={20} color="#ff6b9d" />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
<<<<<<< HEAD
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 40 },
    progressItem: { alignItems: 'center' },
    progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    progressCircleActive: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    progressText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    progressTextActive: { fontSize: 14, fontWeight: '700', color: '#fff' },
    progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    progressLabelActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
    progressLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 10, marginBottom: 20 },
    content: { padding: 20, paddingBottom: 120 },
    formCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    formTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    row: { flexDirection: 'row' },
    inputContainer: { marginBottom: 16 },
    inputLabel: { fontSize: 14, color: '#fff', marginBottom: 8, fontWeight: '600', textAlign: 'right' },
    required: { color: '#ff6b9d' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, color: '#fff', fontSize: 16, textAlign: 'right' },
    inputError: { borderColor: '#ff6b6b' },
    errorText: { color: '#ff6b6b', fontSize: 12, marginTop: 4, textAlign: 'right' },
    dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 14 },
    dropdownText: { color: '#fff', fontSize: 16 },
    dropdownPlaceholder: { color: 'rgba(255,255,255,0.4)', fontSize: 16 },
    shippingCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    shippingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    shippingInfo: { flex: 1 },
    shippingLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    shippingValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
    freeBadge: { backgroundColor: '#4ade80', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    freeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    freeShippingHint: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8, backgroundColor: 'rgba(255,107,157,0.2)', padding: 10, borderRadius: 10 },
    hintText: { color: '#fff', fontSize: 13 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
    nextButton: { borderRadius: 16, overflow: 'hidden' },
    nextButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
    nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalItemText: { fontSize: 16, color: '#333' },
    specialBadge: { fontSize: 12, color: '#ff6b9d', fontWeight: '600' },
=======
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
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 10,
        marginBottom: 15,
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
    savedAddressesSection: {
        marginBottom: 25,
    },
    savedAddressCard: {
        width: 200,
        padding: 15,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 15,
    },
    savedAddressName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 5,
    },
    savedAddressText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    formCard: {
        padding: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
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
    nextButton: {
        backgroundColor: '#7c3838ff',
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
        marginBottom: 50
    },
    nextButtonText: {
        color: '#ffffffff',
        fontSize: 18,
        fontWeight: '700',
    },
>>>>>>> origin/main
});

export default ShippingScreen;
