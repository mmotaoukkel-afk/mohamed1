import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCheckout } from '../../src/context/CheckoutContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

const PromoCodeInput = () => {
    const { promoCode, discount, applyPromoCode, removePromoCode } = useCheckout();
    const [inputValue, setInputValue] = useState('');
    const [isApplying, setIsApplying] = useState(false);

    const handleApply = () => {
        if (!inputValue.trim()) {
            Alert.alert('Error', 'Please enter a promo code');
            return;
        }

        setIsApplying(true);
        const result = applyPromoCode(inputValue.toUpperCase());

        setTimeout(() => {
            setIsApplying(false);
            if (result.success) {
                Alert.alert(
                    'Success! 🎉',
                    `${result.discount}% discount applied!`,
                    [{ text: 'OK' }]
                );
                setInputValue('');
            } else {
                Alert.alert('Invalid Code', result.message);
            }
        }, 500);
    };

    const handleRemove = () => {
        removePromoCode();
        setInputValue('');
    };

    if (promoCode) {
        return (
            <Animated.View
                entering={FadeInDown.springify()}
                style={styles.appliedContainer}
            >
                <LinearGradient
                    colors={['rgba(76,175,80,0.2)', 'rgba(76,175,80,0.1)']}
                    style={styles.appliedGradient}
                >
                    <View style={styles.appliedLeft}>
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                        <View style={styles.appliedText}>
                            <Text style={styles.appliedLabel}>Promo Applied</Text>
                            <Text style={styles.appliedCode}>{promoCode}</Text>
                        </View>
                    </View>
                    <View style={styles.appliedRight}>
                        <Text style={styles.discountText}>-{discount}%</Text>
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={handleRemove}
                        >
                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Ionicons name="pricetag" size={20} color="rgba(255,255,255,0.7)" />
                <TextInput
                    style={styles.input}
                    placeholder="Enter promo code"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={inputValue}
                    onChangeText={setInputValue}
                    autoCapitalize="characters"
                    onSubmitEditing={handleApply}
                />
                {inputValue.length > 0 && (
                    <TouchableOpacity onPress={() => setInputValue('')}>
                        <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                )}
            </View>
            <TouchableOpacity
                style={[
                    styles.applyButton,
                    !inputValue.trim() && styles.applyButtonDisabled
                ]}
                onPress={handleApply}
                disabled={!inputValue.trim() || isApplying}
            >
                <Text style={styles.applyButtonText}>
                    {isApplying ? 'Applying...' : 'Apply'}
                </Text>
            </TouchableOpacity>

            {/* Promo Code Hints */}
            <View style={styles.hintsContainer}>
                <Text style={styles.hintsTitle}>💡 Try these codes:</Text>
                <View style={styles.hintsRow}>
                    <TouchableOpacity
                        style={styles.hintChip}
                        onPress={() => setInputValue('SAVE10')}
                    >
                        <Text style={styles.hintText}>SAVE10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.hintChip}
                        onPress={() => setInputValue('WELCOME')}
                    >
                        <Text style={styles.hintText}>WELCOME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.hintChip}
                        onPress={() => setInputValue('FIRST')}
                    >
                        <Text style={styles.hintText}>FIRST</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        marginLeft: 12,
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    applyButtonDisabled: {
        opacity: 0.5,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    appliedContainer: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    appliedGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(76,175,80,0.3)',
    },
    appliedLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    appliedText: {
        marginLeft: 12,
    },
    appliedLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 2,
    },
    appliedCode: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    appliedRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    discountText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4CAF50',
    },
    removeButton: {
        padding: 4,
    },
    hintsContainer: {
        backgroundColor: 'rgba(102,126,234,0.1)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(102,126,234,0.2)',
    },
    hintsTitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 8,
    },
    hintsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    hintChip: {
        backgroundColor: 'rgba(102,126,234,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    hintText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
});

export default PromoCodeInput;
