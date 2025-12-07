import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../app/services/api';

const CheckoutContext = createContext();

const STORAGE_KEYS = {
    ADDRESSES: '@saved_addresses',
    ORDERS: '@order_history',
};

export const CheckoutProvider = ({ children }) => {
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [shippingAddress, setShippingAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [orders, setOrders] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadSavedData();
    }, []);

    const loadSavedData = async () => {
        try {
            const addresses = await AsyncStorage.getItem(STORAGE_KEYS.ADDRESSES);
            const orderHistory = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
            if (addresses) setSavedAddresses(JSON.parse(addresses));
            if (orderHistory) setOrders(JSON.parse(orderHistory));
        } catch (error) {
            console.warn('Failed to load checkout data:', error);
        }
    };

    const saveAddress = async (address) => {
        try {
            const newAddress = {
                id: Date.now().toString(),
                ...address,
                isDefault: savedAddresses.length === 0,
            };
            const updatedAddresses = [...savedAddresses, newAddress];
            setSavedAddresses(updatedAddresses);
            await AsyncStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(updatedAddresses));
            return newAddress;
        } catch (error) {
            console.warn('Failed to save address:', error);
        }
    };

    // 🔥 إرسال الطلب لـ WooCommerce API
    const processOrder = async (cartItems, cardDetails = null) => {
        if (!shippingAddress) {
            return { success: false, message: 'يرجى إدخال عنوان الشحن' };
        }

        setIsProcessing(true);

        try {
            // تجهيز بيانات الطلب لـ WooCommerce
            const orderData = {
                payment_method: paymentMethod === 'cod' ? 'cod' : 'bacs',
                payment_method_title: paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'بطاقة ائتمان',
                set_paid: paymentMethod !== 'cod',
                billing: {
                    first_name: shippingAddress.fullName?.split(' ')[0] || '',
                    last_name: shippingAddress.fullName?.split(' ').slice(1).join(' ') || '',
                    address_1: shippingAddress.address || '',
                    city: shippingAddress.city || '',
                    postcode: shippingAddress.zipCode || '',
                    country: shippingAddress.country || 'KW',
                    phone: shippingAddress.phoneNumber || '',
                },
                shipping: {
                    first_name: shippingAddress.fullName?.split(' ')[0] || '',
                    last_name: shippingAddress.fullName?.split(' ').slice(1).join(' ') || '',
                    address_1: shippingAddress.address || '',
                    city: shippingAddress.city || '',
                    postcode: shippingAddress.zipCode || '',
                    country: shippingAddress.country || 'KW',
                },
                line_items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity || 1,
                })),
            };

            // إرسال الطلب لـ WooCommerce
            const response = await api.createOrder(orderData);

            if (response && response.id) {
                // حفظ الطلب محلياً
                const newOrder = {
                    orderNumber: response.number || `ORD-${response.id}`,
                    wooOrderId: response.id,
                    date: new Date().toISOString(),
                    status: response.status || 'processing',
                    total: response.total,
                    items: cartItems,
                };

                const updatedOrders = [newOrder, ...orders];
                setOrders(updatedOrders);
                await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

                setIsProcessing(false);
                return { success: true, order: newOrder };
            } else {
                setIsProcessing(false);
                return { success: false, message: 'فشل في إنشاء الطلب' };
            }
        } catch (error) {
            console.error('Order error:', error);
            setIsProcessing(false);
            return { success: false, message: 'حدث خطأ في الاتصال' };
        }
    };

    const resetCheckout = () => {
        setShippingAddress(null);
        setPaymentMethod('cod');
    };

    const value = {
        savedAddresses,
        shippingAddress,
        setShippingAddress,
        saveAddress,
        paymentMethod,
        setPaymentMethod,
        orders,
        processOrder,
        isProcessing,
        resetCheckout,
    };

    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    );
};

export const useCheckout = () => {
    const context = useContext(CheckoutContext);
    if (!context) {
        throw new Error('useCheckout must be used within CheckoutProvider');
    }
    return context;
};
