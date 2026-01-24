/**
 * Payment Screen - Kataraa
 * Updated: Order placed, team sends payment link
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCheckout } from '../../src/context/CheckoutContext';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import PaymentService from '../../src/services/PaymentService';
import * as Linking from 'expo-linking';

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { shippingInfo, shippingFee, resetCheckout, addOrder } = useCheckout();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const cartTotal = getCartTotal();
  const finalTotal = cartTotal + shippingFee;
  const formatPrice = (price) => `${parseFloat(price || 0).toFixed(3)} د.ك`;

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        payment_method: 'bacs',
        payment_method_title: 'حوالة مصرفية مباشرة',
        set_paid: false,
        status: 'pending',
        billing: {
          first_name: shippingInfo.fullName,
          phone: shippingInfo.phone,
          address_1: `القطعة ${shippingInfo.block}, شارع ${shippingInfo.street}${shippingInfo.building ? ', مبنى ' + shippingInfo.building : ''}`,
          city: shippingInfo.city,
          state: shippingInfo.governorate,
          country: 'KW'
        },
        shipping: {
          first_name: shippingInfo.fullName,
          address_1: `القطعة ${shippingInfo.block}, شارع ${shippingInfo.street}${shippingInfo.building ? ', مبنى ' + shippingInfo.building : ''}`,
          city: shippingInfo.city,
          state: shippingInfo.governorate,
          country: 'KW'
        },
        line_items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })),
        customer_note: shippingInfo.notes || '',
        shipping_lines: shippingFee > 0 ? [{
          method_id: 'flat_rate',
          method_title: 'توصيل',
          total: shippingFee.toString()
        }] : [],
      };

      const order = await api.createOrder(orderData);

      // Save to local history
      addOrder({
        ...order,
        items: cartItems,
        total: finalTotal,
        payment_status: 'pending'
      });

      // 💳 Initiate Real Payment via MyFatoorah
      const paymentData = {
        customerName: shippingInfo.fullName,
        amount: finalTotal,
        email: user?.email || 'customer@example.com',
        mobile: shippingInfo.phone,
        orderId: order.id.toString(),
      };

      const paymentResult = await PaymentService.initiatePayment(paymentData);

      if (paymentResult.success && paymentResult.paymentUrl) {
        // Redirection to MyFatoorah Payment Page
        Linking.openURL(paymentResult.paymentUrl);

        // Finalize local state
        clearCart();
        resetCheckout();
      } else {
        Alert.alert('خطأ في الدفع', paymentResult.error || 'فشل بدء عملية الدفع.');
      }
    } catch (error) {
      console.log('Order error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={s.header}>
        <SafeAreaView>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>تأكيد الطلب</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="location" size={20} color="#667eea" />
            <Text style={s.cardTitle}>عنوان التوصيل</Text>
          </View>
          <Text style={s.txt}>{shippingInfo.fullName}</Text>
          <Text style={s.txt}>{shippingInfo.phone}</Text>
          <Text style={s.txt}>{shippingInfo.city}، القطعة {shippingInfo.block}، شارع {shippingInfo.street}</Text>
          {shippingInfo.building && <Text style={s.txt}>مبنى {shippingInfo.building}</Text>}
        </View>

        {/* Payment Method Info */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="card" size={20} color="#667eea" />
            <Text style={s.cardTitle}>طريقة الدفع</Text>
          </View>

          <View style={s.paymentInfo}>
            <Ionicons name="shield-checkmark" size={40} color="#4CAF50" />
            <Text style={s.paymentTitle}>حوالة مصرفية آمنة</Text>
            <Text style={s.paymentDesc}>
              خلك مطمئن... فريقنا يتواصل معك قريباً ويرسل لك رابط الدفع عشان نأكد طلبك ونجهّزه لك بأسرع وقت
            </Text>
          </View>

          <View style={s.securityRow}>
            <View style={s.securityItem}>
              <Ionicons name="lock-closed" size={16} color="#667eea" />
              <Text style={s.securityText}>دفع آمن</Text>
            </View>
            <View style={s.securityItem}>
              <Ionicons name="time" size={16} color="#667eea" />
              <Text style={s.securityText}>تواصل سريع</Text>
            </View>
            <View style={s.securityItem}>
              <Ionicons name="checkmark-circle" size={16} color="#667eea" />
              <Text style={s.securityText}>ضمان الجودة</Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="receipt" size={20} color="#667eea" />
            <Text style={s.cardTitle}>ملخص الطلب</Text>
          </View>

          {cartItems.map(item => (
            <View key={item.id} style={s.item}>
              <Text style={s.itemQty}>x{item.quantity}</Text>
              <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}

          <View style={s.div} />

          <View style={s.row}>
            <Text style={s.rowValue}>{formatPrice(cartTotal)}</Text>
            <Text style={s.rowLabel}>المجموع الفرعي</Text>
          </View>

          <View style={s.row}>
            <Text style={[s.rowValue, shippingFee === 0 && s.freeShipping]}>
              {shippingFee === 0 ? 'مجاني 🎉' : formatPrice(shippingFee)}
            </Text>
            <Text style={s.rowLabel}>الشحن</Text>
          </View>

          <View style={s.div} />

          <View style={s.row}>
            <Text style={s.total}>{formatPrice(finalTotal)}</Text>
            <Text style={s.totalLabel}>الإجمالي</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={s.bottom}>
        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#aaa'] : ['#667eea', '#764ba2']}
            style={s.btnGrad}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={s.btnTxt}>تأكيد الطلب</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={s.termsText}>
          بالضغط على "تأكيد الطلب" أنت توافق على سياسة الخصوصية وشروط الاستخدام
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  txt: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 4
  },
  paymentInfo: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(76,175,80,0.05)',
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 12,
    marginBottom: 8,
  },
  paymentDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemQty: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: 'bold',
    minWidth: 30,
  },
  itemName: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  div: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  rowLabel: {
    fontSize: 14,
    color: '#666',
  },
  rowValue: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  freeShipping: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
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
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  btn: {
    borderRadius: 14,
    overflow: 'hidden'
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10
  },
  btnTxt: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  termsText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
});
