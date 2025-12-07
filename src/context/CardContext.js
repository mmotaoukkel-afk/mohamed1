import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [carts, setCarts] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        loadCartItems();
    }, []);

    const loadCartItems = async () => {
        try {
            let storedCarts = await AsyncStorage.getItem('guest_cart');
            storedCarts = storedCarts ? JSON.parse(storedCarts) : [];
            setCarts(storedCarts);
            totalSum(storedCarts);
        } catch (error) {
            console.warn('Failed to load cart:', error);
        }
    };

    const saveCartItems = async (items) => {
        try {
            await AsyncStorage.setItem('guest_cart', JSON.stringify(items));
        } catch (error) {
            console.warn('Failed to save cart:', error);
        }
    };

    const addToCart = async (item) => {
        const itemExist = carts.findIndex((cart) => cart.id === item.id);
        if (itemExist === -1) {
            const newItem = { ...item, quantity: item.quantity || 1 };
            const newCartItems = [...carts, newItem];
            await saveCartItems(newCartItems);
            setCarts(newCartItems);
            totalSum(newCartItems);
        } else {
            // إذا موجود، زيد الكمية
            const updatedCarts = carts.map((cart, index) => {
                if (index === itemExist) {
                    return { ...cart, quantity: cart.quantity + (item.quantity || 1) };
                }
                return cart;
            });
            await saveCartItems(updatedCarts);
            setCarts(updatedCarts);
            totalSum(updatedCarts);
        }
    };

    const deleteItemFromCart = async (item) => {
        const newItems = carts.filter((cart) => cart.id !== item.id);
        setCarts(newItems);
        await saveCartItems(newItems);
        totalSum(newItems);
    };

    const updateCartItemQuantity = async (itemId, newQuantity) => {
        const updatedCarts = carts.map((cart) => {
            if (cart.id === itemId) {
                return { ...cart, quantity: Math.max(1, newQuantity) };
            }
            return cart;
        });
        setCarts(updatedCarts);
        await saveCartItems(updatedCarts);
        totalSum(updatedCarts);
    };

    const totalSum = (carts) => {
        const total = carts.reduce((amount, item) => {
            const quantity = item.quantity || 1;
            return amount + (parseFloat(item.price) * quantity);
        }, 0);
        setTotalPrice(total.toFixed(2));
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
        clearCart,
        getTotalPrice,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
};
