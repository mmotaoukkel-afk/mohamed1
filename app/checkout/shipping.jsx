/**
 * Shipping Screen - Kataraa
 * Dynamic version using Admin Shipping Service
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../src/context/CartContext';
import { useCheckout } from '../../src/context/CheckoutContext';
import { getShippingZones } from '../../src/services/adminShippingService';
import currencyService from '../../src/services/currencyService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ShippingScreen() {
  const router = useRouter();
  const { shippingInfo, setShippingInfo, setShippingFee } = useCheckout();
  const { getCartTotal } = useCart();

  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  const cartTotal = getCartTotal();

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const data = await getShippingZones();
      // Filter only active zones
      const activeZones = data.filter(z => z.active);
      setZones(activeZones);
    } catch (error) {
      console.error('Failed to load shipping zones:', error);
      Alert.alert('خطأ', 'فشل تحميل مناطق التوصيل');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const selectZone = (zone) => {
    setShippingInfo(prev => ({
      ...prev,
      governorate: zone.id, // We store Zone ID as governorate for consistency
      city: zone.name, // City name
      shippingFee: zone.fee
    }));

    // Update shipping fee in context
    setShippingFee(zone.fee);

    setShowZoneDropdown(false);
    if (errors.city) setErrors(prev => ({ ...prev, city: null }));
  };

  const validate = () => {
    const e = {};
    if (!shippingInfo.fullName?.trim()) e.fullName = 'مطلوب';
    if (!shippingInfo.phone?.trim()) e.phone = 'مطلوب';
    if (!shippingInfo.city) e.city = 'مطلوب'; // City represents Zone/Region now
    if (!shippingInfo.block?.trim()) e.block = 'مطلوب';
    if (!shippingInfo.street?.trim()) e.street = 'مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      router.push('/checkout/payment');
    }
  };

  // Helper to find selected zone object
  const selectedZone = zones.find(z => z.name === shippingInfo.city) || null;
  const currentFee = selectedZone ? selectedZone.fee : 0;

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
        {/* Shipping Banner */}
        {selectedZone && (
          <View style={styles.banner}>
            <Ionicons name="car" size={22} color="#667eea" />
            <Text style={styles.bannerText}>
              رسوم التوصيل لـ {selectedZone.name}: {currencyService.formatKWD(currentFee)}
            </Text>
          </View>
        )}

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

          {/* Zone/City Selection */}
          <Text style={styles.label}>المنطقة / المدينة *</Text>
          <TouchableOpacity
            style={[styles.select, errors.city && styles.inputErr, showZoneDropdown && styles.selectOpen]}
            onPress={() => setShowZoneDropdown(!showZoneDropdown)}
          >
            <Ionicons name={showZoneDropdown ? "chevron-up" : "chevron-down"} size={20} color="#667eea" />
            <Text style={[styles.selectText, !shippingInfo.city && styles.placeholder]}>
              {shippingInfo.city || 'اختر المنطقة'}
            </Text>
          </TouchableOpacity>

          {/* Zone List Dropdown */}
          {showZoneDropdown && (
            <View style={styles.dropdown}>
              {loading ? (
                <ActivityIndicator size="small" color="#667eea" style={{ padding: 20 }} />
              ) : (
                <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true}>
                  {zones.map((zone) => (
                    <TouchableOpacity
                      key={zone.id}
                      style={[
                        styles.dropdownItem,
                        shippingInfo.city === zone.name && styles.dropdownItemSelected
                      ]}
                      onPress={() => selectZone(zone)}
                    >
                      <View style={styles.dropdownItemContent}>
                        <Text style={[
                          styles.dropdownText,
                          shippingInfo.city === zone.name && styles.dropdownTextSelected
                        ]}>
                          {zone.name}
                        </Text>
                        <Text style={styles.dropdownSubText}>
                          {zone.nameEn} - {currencyService.formatKWD(zone.fee)}
                        </Text>
                      </View>
                      {shippingInfo.city === zone.name && (
                        <Ionicons name="checkmark-circle" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
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
    backgroundColor: 'rgba(102,126,234,0.1)',
    marginBottom: 16
  },
  bannerText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
    color: '#667eea'
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
