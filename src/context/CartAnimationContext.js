/**
 * Cart Animation Context - Kataraa 🛍️✨
 * Global context for triggering add-to-cart animation from anywhere
 */

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import AddToCartAnimation from '../components/AddToCartAnimation';
import { useCart } from './CartContext';
import { useRouter } from 'expo-router';

const CartAnimationContext = createContext();

export const useCartAnimation = () => {
    const context = useContext(CartAnimationContext);
    if (!context) {
        throw new Error('useCartAnimation must be used within CartAnimationProvider');
    }
    return context;
};

export const CartAnimationProvider = ({ children }) => {
    const router = useRouter();
    const { addToCart } = useCart();

    const [animationVisible, setAnimationVisible] = useState(false);
    const [animationData, setAnimationData] = useState({
        productImage: null,
        productName: '',
        sourcePosition: null,
    });

    // Cart icon position ref for fly-to target
    const cartIconRef = useRef(null);
    const [cartPosition, setCartPosition] = useState({ x: 0, y: 0 });

    // Register cart icon position
    const registerCartIcon = useCallback((ref) => {
        cartIconRef.current = ref;
    }, []);

    // Measure cart icon position
    const measureCartIcon = useCallback(() => {
        if (cartIconRef.current) {
            cartIconRef.current.measureInWindow((x, y, width, height) => {
                setCartPosition({ x: x + width / 2, y: y + height / 2 });
            });
        }
    }, []);

    // Trigger the epic animation with product data
    const triggerAddToCart = useCallback((product, sourceRef = null) => {
        console.log('🚀 [CartAnimation] Triggering AddToCart for:', product.name);

        // First measure cart icon position
        measureCartIcon();

        // Helper to trigger the UI state
        const startState = (pos) => {
            console.log('✅ [CartAnimation] Position locked, starting UI state');
            setAnimationData({
                productImage: product.image || product.images?.[0]?.src,
                productName: product.name,
                sourcePosition: pos,
            });

            // Small stabilization delay to ensure coordinates are registered by the view
            setTimeout(() => {
                console.log('🎬 [CartAnimation] SetAnimationVisible(true)');
                setAnimationVisible(true);
            }, 50);
        };

        // Get source position if provided
        if (sourceRef?.current) {
            console.log('🔍 [CartAnimation] Measuring source interaction position...');
            sourceRef.current.measureInWindow((x, y, width, height) => {
                const pos = { x: x + width / 2, y: y + height / 2, width, height };
                console.log('📍 [CartAnimation] Measured at:', pos);
                startState(pos);
            });
        } else {
            console.log('⚠️ [CartAnimation] No sourceRef provided, using center screen');
            startState(null);
        }

        // Add to cart (business logic)
        addToCart({
            id: product.id,
            name: product.name,
            price: product.sale_price || product.price,
            image: product.image || product.images?.[0]?.src,
            quantity: product.quantity || 1,
        });
    }, [addToCart, measureCartIcon]);

    // Animation complete handler
    const handleAnimationComplete = useCallback(() => {
        setAnimationVisible(false);
        setAnimationData({
            productImage: null,
            productName: '',
            sourcePosition: null,
        });

        // No automatic navigation - just complete the animation
        console.log('✅ [CartAnimation] Animation complete, staying on page');
    }, []);

    return (
        <View style={{ flex: 1, position: 'relative' }}>
            <CartAnimationContext.Provider
                value={{
                    triggerAddToCart,
                    registerCartIcon,
                    cartIconRef,
                }}
            >
                {children}

                {/* Global Animation Overlay - Forced to absolute top */}
                <View style={[StyleSheet.absoluteFill, { zIndex: 999999, elevation: 999999 }]} pointerEvents="none">
                    <AddToCartAnimation
                        visible={animationVisible}
                        productImage={animationData.productImage}
                        productName={animationData.productName}
                        sourcePosition={animationData.sourcePosition}
                        targetPosition={cartPosition}
                        onComplete={handleAnimationComplete}
                    />
                </View>
            </CartAnimationContext.Provider>
        </View>
    );
};

export default CartAnimationContext;
