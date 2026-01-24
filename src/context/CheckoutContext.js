import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import * as Linking from 'expo-linking';
import PaymentService from '../services/PaymentService';
import api from '../services/api';
import { useCart } from './CartContext';

const CheckoutContext = createContext();

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
};

export const CheckoutProvider = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { clearCart } = useCart();
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    country: '',
    governorate: '',
    city: '',
    block: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, card
  const [shippingFee, setShippingFee] = useState(0);
  const [orders, setOrders] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Load data from Storage
  useEffect(() => {
    const loadSavedData = async () => {
      if (!user) {
        setOrders([]);
        setSavedAddresses([]);
        setSavedPaymentMethods([]);
        return;
      }

      const suffix = user.email.toLowerCase();
      try {
        const [storedOrders, storedAddresses, storedPayments] = await Promise.all([
          storage.getItem(`orders_${suffix}`),
          storage.getItem(`addresses_${suffix}`),
          storage.getItem(`payments_${suffix}`),
        ]);

        if (storedOrders) setOrders(storedOrders);
        if (storedAddresses) setSavedAddresses(storedAddresses);
        if (storedPayments) setSavedPaymentMethods(storedPayments);
      } catch (e) {
        console.error('Error loading checkout data:', e);
      }
    };

    loadSavedData();
  }, [user]);

  // Handle Deep Linking for Payment Callbacks
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const { url } = event;
      if (!url) return;

      const parsed = Linking.parse(url);

      // Check for success or error in path/query
      if (url.includes('checkout/success') || parsed.queryParams?.paymentId) {
        const paymentId = parsed.queryParams?.paymentId || parsed.queryParams?.paymentID;
        if (paymentId) {
          verifyPayment(paymentId);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL (for when app is opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, [pendingOrderId]);

  const verifyPayment = async (paymentId) => {
    if (isVerifyingPayment) return;
    setIsVerifyingPayment(true);
    try {
      const status = await PaymentService.getPaymentStatus(paymentId);
      if (status.IsSuccess && status.Data.InvoiceStatus === 'Paid') {
        // Add order to local storage
        if (pendingOrderId) {
          await addOrder({
            id: pendingOrderId,
            status: 'processing',
            date: new Date().toISOString(),
            total: status.Data.InvoiceValue,
            payment_method: status.Data.PaymentGateway
          });
        }

        // Clear Cart and Reset
        clearCart();
        setPendingOrderId(null);

        // Notify user
        addNotification(
          'notifOrderTitle',
          'notifOrderMsg',
          "success",
          { orderId: pendingOrderId }
        );
      }
    } catch (e) {
      console.error('Payment verification failed:', e);
      addNotification("paymentErrorTitle", "paymentErrorMsg", "error");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const updateShippingInfo = (info) => {
    setShippingInfo(prev => ({ ...prev, ...info }));
  };

  const resetCheckout = () => {
    setShippingInfo({
      fullName: '',
      phone: '',
      country: '',
      governorate: '',
      city: '',
      block: '',
      street: '',
      building: '',
      floor: '',
      apartment: '',
      notes: '',
    });
    setPaymentMethod('cod');
    setShippingFee(0);
  };

  const saveAddress = async (address) => {
    const newAddresses = [address, ...savedAddresses];
    setSavedAddresses(newAddresses);
    if (user) {
      await storage.setItem(`addresses_${user.email.toLowerCase()}`, newAddresses);
    }
  };

  const deleteAddress = async (id) => {
    const newAddresses = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(newAddresses);
    if (user) {
      await storage.setItem(`addresses_${user.email.toLowerCase()}`, newAddresses);
    }
  };

  const savePaymentMethod = async (method) => {
    const newMethods = [method, ...savedPaymentMethods];
    setSavedPaymentMethods(newMethods);
    if (user) {
      await storage.setItem(`payments_${user.email.toLowerCase()}`, newMethods);
    }
  };

  const deletePaymentMethod = async (id) => {
    const newMethods = savedPaymentMethods.filter(m => m.id !== id);
    setSavedPaymentMethods(newMethods);
    if (user) {
      await storage.setItem(`payments_${user.email.toLowerCase()}`, newMethods);
    }
  };

  const addOrder = async (order) => {
    const newOrders = [order, ...orders];
    setOrders(newOrders);
    if (user) {
      await storage.setItem(`orders_${user.email.toLowerCase()}`, newOrders);
    }
  };

  return (
    <CheckoutContext.Provider value={{
      shippingInfo,
      setShippingInfo,
      updateShippingInfo,
      paymentMethod,
      setPaymentMethod,
      shippingFee,
      setShippingFee,
      resetCheckout,
      orders,
      addOrder,
      savedAddresses,
      saveAddress,
      deleteAddress,
      savedPaymentMethods,
      savePaymentMethod,
      deletePaymentMethod,
      pendingOrderId,
      setPendingOrderId,
      isVerifyingPayment,
      verifyPayment,
      // Add more as needed
    }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export default CheckoutContext;
