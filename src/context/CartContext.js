/**
 * Cart Context - Kataraa
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // Get current user
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedUserEmail, setLoadedUserEmail] = useState(null);

  // Load cart when user changes
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setCartItems([]);
      setLoadedUserEmail(null);
      setLoading(false);
    }
  }, [user]);

  // Save cart to storage
  useEffect(() => {
    if (!loading && user?.email && user.email === loadedUserEmail) {
      const handler = setTimeout(() => {
        const key = `@kataraa_cart_${user.email.toLowerCase()}`;
        AsyncStorage.setItem(key, JSON.stringify(cartItems));
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [cartItems, loading, user, loadedUserEmail]);

  const loadCart = async () => {
    if (!user?.email) return;

    setLoading(true);
    setCartItems([]); // Clear immediately

    try {
      const key = `@kataraa_cart_${user.email.toLowerCase()}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setCartItems(JSON.parse(saved));
      } else {
        setCartItems([]);
      }
      setLoadedUserEmail(user.email);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) || 0) * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      loading,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
