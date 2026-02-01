import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useState } from 'react';
import PaymentService from '../services/PaymentService';
import userProfileService from '../services/userProfileService';
import { storage } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useNotifications } from './NotificationContext';

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
  const [isSyncing, setIsSyncing] = useState(false);

  // Load data from Cloud (Firestore) and Local Storage
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setOrders([]);
        setSavedAddresses([]);
        setSavedPaymentMethods([]);
        return;
      }

      setIsSyncing(true);
      const suffix = user.email.toLowerCase();
      try {
        // 1. Fetch from Firestore (Cloud) - Source of Truth
        const [cloudOrders, cloudAddresses] = await Promise.all([
          userProfileService.getUserOrders(user.uid),
          userProfileService.getUserAddresses(user.uid)
        ]);

        // 2. Fetch from Local Storage (Backup/Legacy)
        const [storedOrders, storedAddresses, storedPayments] = await Promise.all([
          storage.getItem(`orders_${suffix}`),
          storage.getItem(`addresses_${suffix}`),
          storage.getItem(`payments_${suffix}`),
        ]);

        // Merge and set state (Cloud takes precedence)
        setOrders(cloudOrders.length > 0 ? cloudOrders : (storedOrders || []));
        setSavedAddresses(cloudAddresses.length > 0 ? cloudAddresses : (storedAddresses || []));
        if (storedPayments) setSavedPaymentMethods(storedPayments);

        // If cloud had no data but local did, sync local to cloud
        if (cloudAddresses.length === 0 && storedAddresses?.length > 0) {
          console.log('📦 Syncing local addresses to cloud...');
          for (const addr of storedAddresses) {
            await userProfileService.saveUserAddress(user.uid, addr);
          }
        }

        if (cloudOrders.length === 0 && storedOrders?.length > 0) {
          console.log('📦 Syncing local orders to cloud...');
          for (const order of storedOrders) {
            await userProfileService.saveUserOrder(user.uid, order);
          }
        }

      } catch (e) {
        console.error('Error loading checkout/profile data:', e);
      } finally {
        setIsSyncing(false);
      }
    };

    loadData();
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
      // 🔥 Sync to Firestore
      try {
        await userProfileService.saveUserAddress(user.uid, address);
      } catch (e) {
        console.error('Cloud address save failed:', e);
      }
    }
  };

  const deleteAddress = async (id) => {
    const newAddresses = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(newAddresses);
    if (user) {
      await storage.setItem(`addresses_${user.email.toLowerCase()}`, newAddresses);
      // 🔥 Sync to Firestore
      try {
        await userProfileService.deleteUserAddress(user.uid, id);
      } catch (e) {
        console.error('Cloud address delete failed:', e);
      }
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
      // 🔥 Sync to Firestore
      try {
        await userProfileService.saveUserOrder(user.uid, order);
      } catch (e) {
        console.error('Cloud order save failed:', e);
      }
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
      isSyncing,
      // Add more as needed
    }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export default CheckoutContext;
