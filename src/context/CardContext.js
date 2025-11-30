import { createContext, useEffect, useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from './AuthContext';
import { sanitizeEmail } from '../utils/helpers';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [carts, setCarts] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        loadCartItems();
    }, [user]);

    const loadCartItems = async () => {
        if (!user) {
            setCarts([]);
            setTotalPrice(0);
            return;
        }

        try {
            const safeEmail = sanitizeEmail(user.email);
            const key = `carts_${safeEmail}`;
            let storedCarts = await AsyncStorage.getItem(key);
            storedCarts = storedCarts ? JSON.parse(storedCarts) : [];
            setCarts(storedCarts);
            totalSum(storedCarts);
        } catch (error) {
            console.warn('Failed to load cart:', error);
        }
    };

    const saveCartItems = async (items) => {
        if (!user) return;
        try {
            const safeEmail = sanitizeEmail(user.email);
            const key = `carts_${safeEmail}`;
            await AsyncStorage.setItem(key, JSON.stringify(items));
        } catch (error) {
            console.warn('Failed to save cart:', error);
        }
    };

    const addToCart = async (item) => {
        if (!user) return; // Should prompt login in UI

        const itemExist = carts.findIndex((cart) => cart.id === item.id);
        if (itemExist === -1) {
            // إضافة المنتج مع كمية ابتدائية = 1
            const newItem = { ...item, quantity: 1 };
            const newCartItems = [...carts, newItem];
            await saveCartItems(newCartItems);
            setCarts(newCartItems);
            totalSum(newCartItems);
        }
    };

    const deleteItemFromCart = async (item) => {
        const newItems = carts.filter((cart) => cart.id !== item.id);
        setCarts(newItems);
        await saveCartItems(newItems);
        totalSum(newItems);
    };

    // تحديث كمية المنتج في السلة
    const updateCartItemQuantity = async (itemId, newQuantity) => {
        const updatedCarts = carts.map((cart) => {
            if (cart.id === itemId) {
                // التحقق من عدم تجاوز الكمية المتوفرة
                const maxQuantity = cart.stock || 999;
                const validQuantity = Math.min(Math.max(1, newQuantity), maxQuantity);
                return { ...cart, quantity: validQuantity };
            }
            return cart;
        });
        setCarts(updatedCarts);
        await saveCartItems(updatedCarts);
        totalSum(updatedCarts);
    };

    // حساب المجموع الكلي بناءً على الكمية
    const totalSum = (carts) => {
        const total = carts.reduce((amount, item) => {
            const quantity = item.quantity || 1;
            return amount + (item.price * quantity);
        }, 0);
        setTotalPrice(total.toFixed(2));
    };

    // إتمام عملية الشراء (تقليل الكمية من المخزون)
    const checkout = async () => {
        // هنا يمكنك إضافة منطق تحديث المخزون في قاعدة البيانات
        // حالياً سنقوم فقط بمسح السلة
        setCarts([]);
        await saveCartItems([]);
        setTotalPrice(0);
        return true;
    };

    const clearCart = async () => {
        setCarts([]);
        await saveCartItems([]);
        setTotalPrice(0);
    };

    const getTotalPrice = () => {
        return parseFloat(totalPrice) || 0;
    };

    const value = {
        carts,
        addToCart,
        totalPrice,
        deleteItemFromCart,
        updateCartItemQuantity,
        checkout,
        clearCart,
        getTotalPrice,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};