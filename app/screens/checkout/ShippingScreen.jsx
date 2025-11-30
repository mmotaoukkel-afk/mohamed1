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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useCheckout } from '../../../src/context/CheckoutContext';
import PremiumBackground from '../../components/PremiumBackground';
import Animated, { FadeInDown } from 'react-native-reanimated';

const ShippingScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { shippingAddress, setShippingAddress, savedAddresses } = useCheckout();

    const [form, setForm] = useState(shippingAddress || {
        fullName: '',
        phoneNumber: '',
        address: '',
        city: '',
        zipCode: '',
        country: '',
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        let valid = true;
        let newErrors = {};

        if (!form.fullName) {
            newErrors.fullName = 'Full Name is required';
            valid = false;
        }
        if (!form.phoneNumber) {
            newErrors.phoneNumber = 'Phone Number is required';
            valid = false;
        }
        if (!form.address) {
            newErrors.address = 'Address is required';
            valid = false;
        }
        if (!form.city) {
            newErrors.city = 'City is required';
            valid = false;
        }
        if (!form.zipCode) {
            newErrors.zipCode = 'Zip Code is required';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleNext = () => {
        if (validate()) {
            setShippingAddress(form);
            navigation.navigate('PaymentScreen');
        } else {
            Alert.alert('Error', 'Please fill in all required fields');
        }
    };

    const handleUseSavedAddress = (address) => {
        setForm(address);
    };

    const renderInput = (label, field, placeholder, keyboardType = 'default') => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, errors[field] && styles.inputError]}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={form[field]}
                onChangeText={(text) => setForm({ ...form, [field]: text })}
                keyboardType={keyboardType}
            />
            {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
        </View>
    );

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Shipping Address</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressItem}>
                        <View style={[styles.progressCircle, styles.activeProgress]}>
                            <Text style={styles.progressText}>1</Text>
                        </View>
                        <Text style={[styles.progressLabel, styles.activeLabel]}>Shipping</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressItem}>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressText}>2</Text>
                        </View>
                        <Text style={styles.progressLabel}>Payment</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressItem}>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressText}>3</Text>
                        </View>
                        <Text style={styles.progressLabel}>Review</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                        {savedAddresses.length > 0 && (
                            <View style={styles.savedAddressesSection}>
                                <Text style={styles.sectionTitle}>Saved Addresses</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {savedAddresses.map((addr, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.savedAddressCard}
                                            onPress={() => handleUseSavedAddress(addr)}
                                        >
                                            <Text style={styles.savedAddressName}>{addr.fullName}</Text>
                                            <Text style={styles.savedAddressText} numberOfLines={2}>
                                                {addr.address}, {addr.city}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <Animated.View entering={FadeInDown.duration(500)} style={styles.formCard}>
                            <Text style={styles.sectionTitle}>Enter New Address</Text>

                            {renderInput('Full Name', 'fullName', 'John Doe')}
                            {renderInput('Phone Number', 'phoneNumber', '+1 234 567 890', 'phone-pad')}
                            {renderInput('Address', 'address', '123 Main St')}

                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.inputLabel}>City</Text>
                                    <TextInput
                                        style={[styles.input, errors.city && styles.inputError]}
                                        placeholder="New York"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        value={form.city}
                                        onChangeText={(text) => setForm({ ...form, city: text })}
                                    />
                                    {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                                </View>

                                <View style={[styles.inputContainer, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Zip Code</Text>
                                    <TextInput
                                        style={[styles.input, errors.zipCode && styles.inputError]}
                                        placeholder="10001"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        value={form.zipCode}
                                        onChangeText={(text) => setForm({ ...form, zipCode: text })}
                                        keyboardType="numeric"
                                    />
                                    {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
                                </View>
                            </View>

                            {renderInput('Country', 'country', 'United States')}

                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>Continue to Payment</Text>
                        <Ionicons name="arrow-forward" size={20} color="#667eea" />
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
        marginBottom:50
    },
    nextButtonText: {
        color: '#ffffffff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default ShippingScreen;
