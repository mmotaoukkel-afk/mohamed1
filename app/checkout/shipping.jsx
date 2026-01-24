/**
 * Shipping Screen - Kataraa
 * Fixed version with inline dropdown instead of Modal
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCheckout } from '../../src/context/CheckoutContext';
import { useCart } from '../../src/context/CartContext';
import { kuwaitGovernorates, getCitiesByGovernorate, calculateShipping } from '../../src/data/kuwaitLocations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ShippingScreen() {
  const router = useRouter();
  const { shippingInfo, setShippingInfo, setShippingFee } = useCheckout();
  const { getCartTotal } = useCart();

  const [showGovDropdown, setShowGovDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  const cartTotal = getCartTotal();
  const cities = getCitiesByGovernorate(shippingInfo.governorate);
  const shipping = calculateShipping(shippingInfo.governorate, cartTotal, shippingInfo.city);

  const updateField = (field, value) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const selectGovernorate = (gov) => {
    // Update both fields at once to avoid stale state
    setShippingInfo(prev => ({
      ...prev,
      governorate: gov.id,
      city: ''
    }));
    // Reset shipping fee until city is selected
    setShippingFee(0);
    setShowGovDropdown(false);
    if (errors.governorate) setErrors(prev => ({ ...prev, governorate: null }));
  };

  const selectCity = (city) => {
    setShippingInfo(prev => ({ ...prev, city: city }));
    // Calculate shipping based on city
    const newShipping = calculateShipping(shippingInfo.governorate, cartTotal, city);
    setShippingFee(newShipping.fee);
    setShowCityDropdown(false);
    if (errors.city) setErrors(prev => ({ ...prev, city: null }));
  };

  const validate = () => {
    const e = {};
    if (!shippingInfo.fullName?.trim()) e.fullName = 'مطلوب';
    if (!shippingInfo.phone?.trim()) e.phone = 'مطلوب';
    if (!shippingInfo.governorate) e.governorate = 'مطلوب';
    if (!shippingInfo.city) e.city = 'مطلوب';
    if (!shippingInfo.block?.trim()) e.block = 'مطلوب';
    if (!shippingInfo.street?.trim()) e.street = 'مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getGovName = () => {
    const gov = kuwaitGovernorates.find(g => g.id === shippingInfo.governorate);
    return gov ? gov.name : 'اختر المحافظة';
  };

  const handleContinue = () => {
    if (validate()) {
      router.push('/checkout/payment');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>عنوان التوصيل</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled={true}
      >
        {/* Shipping Banner - Only show when city is selected */}
        {shippingInfo.city ? (
          <View style={[styles.banner, shipping.fee === 0 && styles.freeBanner, shipping.fee === 5 && styles.specialBanner]}>
            <Ionicons
              name={shipping.fee === 0 ? 'gift' : 'car'}
              size={22}
              color={shipping.fee === 0 ? '#4CAF50' : shipping.fee === 5 ? '#E91E63' : '#FF9800'}
            />
            <Text style={[styles.bannerText, { color: shipping.fee === 0 ? '#4CAF50' : shipping.fee === 5 ? '#E91E63' : '#FF9800' }]}>
              {shipping.message}
            </Text>
          </View>
        ) : cartTotal >= 25 ? (
          <View style={[styles.banner, styles.freeBanner]}>
            <Ionicons name="gift" size={22} color="#4CAF50" />
            <Text style={[styles.bannerText, { color: '#4CAF50' }]}>
              طلبك مؤهل للشحن المجاني! 🎉
            </Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          {/* Name */}
          <Text style={styles.label}>الاسم الكامل *</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputErr]}
            placeholder="أدخل اسمك الكامل"
            placeholderTextColor="#999"
            value={shippingInfo.fullName}
            onChangeText={v => updateField('fullName', v)}
            textAlign="right"
          />

          {/* Phone */}
          <Text style={styles.label}>رقم الهاتف *</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputErr]}
            placeholder="99999999"
            placeholderTextColor="#999"
            value={shippingInfo.phone}
            onChangeText={v => updateField('phone', v)}
            keyboardType="phone-pad"
            textAlign="right"
          />

          {/* Governorate Dropdown */}
          <Text style={styles.label}>المحافظة *</Text>
          <TouchableOpacity
            style={[styles.select, errors.governorate && styles.inputErr, showGovDropdown && styles.selectOpen]}
            onPress={() => {
              setShowGovDropdown(!showGovDropdown);
              setShowCityDropdown(false);
            }}
          >
            <Ionicons name={showGovDropdown ? "chevron-up" : "chevron-down"} size={20} color="#667eea" />
            <Text style={[styles.selectText, !shippingInfo.governorate && styles.placeholder]}>
              {getGovName()}
            </Text>
          </TouchableOpacity>

          {/* Governorate List */}
          {showGovDropdown && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                {kuwaitGovernorates.map((gov) => (
                  <TouchableOpacity
                    key={gov.id}
                    style={[
                      styles.dropdownItem,
                      shippingInfo.governorate === gov.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => selectGovernorate(gov)}
                  >
                    <View style={styles.dropdownItemContent}>
                      <Text style={[
                        styles.dropdownText,
                        shippingInfo.governorate === gov.id && styles.dropdownTextSelected
                      ]}>
                        {gov.name}
                      </Text>
                      <Text style={styles.dropdownSubText}>{gov.nameEn}</Text>
                    </View>
                    {shippingInfo.governorate === gov.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#667eea" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* City Dropdown */}
          <Text style={styles.label}>المنطقة *</Text>
          <TouchableOpacity
            style={[
              styles.select,
              errors.city && styles.inputErr,
              !shippingInfo.governorate && styles.selectDisabled,
              showCityDropdown && styles.selectOpen
            ]}
            onPress={() => {
              if (shippingInfo.governorate) {
                setShowCityDropdown(!showCityDropdown);
                setShowGovDropdown(false);
              }
            }}
            disabled={!shippingInfo.governorate}
          >
            <Ionicons name={showCityDropdown ? "chevron-up" : "chevron-down"} size={20} color="#667eea" />
            <Text style={[styles.selectText, !shippingInfo.city && styles.placeholder]}>
              {shippingInfo.city || 'اختر المنطقة'}
            </Text>
          </TouchableOpacity>

          {/* City List */}
          {showCityDropdown && cities.length > 0 && (
            <View style={[styles.dropdown, styles.cityDropdown]}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                {cities.map((city, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownItem,
                      shippingInfo.city === city && styles.dropdownItemSelected
                    ]}
                    onPress={() => selectCity(city)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      shippingInfo.city === city && styles.dropdownTextSelected
                    ]}>
                      {city}
                    </Text>
                    {shippingInfo.city === city && (
                      <Ionicons name="checkmark-circle" size={20} color="#667eea" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Block */}
          <Text style={styles.label}>القطعة *</Text>
          <TextInput
            style={[styles.input, errors.block && styles.inputErr]}
            placeholder="رقم القطعة"
            placeholderTextColor="#999"
            value={shippingInfo.block}
            onChangeText={v => updateField('block', v)}
            textAlign="right"
          />

          {/* Street */}
          <Text style={styles.label}>الشارع *</Text>
          <TextInput
            style={[styles.input, errors.street && styles.inputErr]}
            placeholder="اسم أو رقم الشارع"
            placeholderTextColor="#999"
            value={shippingInfo.street}
            onChangeText={v => updateField('street', v)}
            textAlign="right"
          />

          {/* Building */}
          <Text style={styles.label}>المبنى (اختياري)</Text>
          <TextInput
            style={styles.input}
            placeholder="رقم المبنى"
            placeholderTextColor="#999"
            value={shippingInfo.building}
            onChangeText={v => updateField('building', v)}
            textAlign="right"
          />

          {/* Notes */}
          <Text style={styles.label}>ملاحظات التوصيل (اختياري)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="مثال: بجانب المسجد، الباب الأزرق..."
            placeholderTextColor="#999"
            value={shippingInfo.notes}
            onChangeText={v => updateField('notes', v)}
            multiline
            textAlign="right"
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.continueBtnGrad}>
            <Text style={styles.continueBtnText}>متابعة للدفع</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 16
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,152,0,0.1)',
    marginBottom: 16
  },
  freeBanner: {
    backgroundColor: 'rgba(76,175,80,0.1)'
  },
  specialBanner: {
    backgroundColor: 'rgba(233,30,99,0.1)'
  },
  bannerText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputErr: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  select: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 52,
  },
  selectOpen: {
    borderColor: '#667eea',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectDisabled: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  selectText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  placeholder: {
    color: '#999',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#667eea',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -1,
    maxHeight: 250,
    overflow: 'hidden',
  },
  cityDropdown: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(102,126,234,0.1)',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
  },
  dropdownTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  dropdownSubText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 2,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  continueBtn: {
    borderRadius: 14,
    overflow: 'hidden'
  },
  continueBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
});
