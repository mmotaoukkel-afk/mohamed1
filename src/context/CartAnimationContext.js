/**
 * Cart Animation Context - Kataraa 🛍️✨
 * Global context for triggering add-to-cart animation from anywhere
 */

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View } from 'react-native';
import AddToCartAnimation from '../components/AddToCartAnimation';
import { useCart } from './CartContext';

const CartAnimationContext = createContext();

export const useCartAnimation = () => {
    const context = useContext(CartAnimationContext);
    if (!context) {
        throw new Error('useCartAnimation must be used within CartAnimationProvider');
    }
    return context;
};

export const CartAnimationProvider = ({ children }) => {
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

        // First measure cart icon position
        measureCartIcon();

        // Get source position if provided
        let sourcePos = null;
        if (sourceRef?.current) {
            sourceRef.current.measureInWindow((x, y, width, height) => {
                sourcePos = { x: x + width / 2, y: y + height / 2, width, height };
            });
        }

        // Set animation data
        setAnimationData({
            productImage: product.image || product.images?.[0]?.src,
            productName: product.name,
            sourcePosition: sourcePos,
        });

        // Show animation
        setAnimationVisible(true);

        // Add to cart (will update after animation via context)
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
    }, []);

    return (
        <CartAnimationContext.Provider
            value={{
                triggerAddToCart,
                registerCartIcon,
                cartIconRef,
            }}
        >
            {children}

            {/* Global Animation Overlay */}
            <AddToCartAnimation
                visible={animationVisible}
                productImage={animationData.productImage}
                productName={animationData.productName}
                sourcePosition={animationData.sourcePosition}
                targetPosition={cartPosition}
                onComplete={handleAnimationComplete}
            />
        </CartAnimationContext.Provider>
    );
};

export default CartAnimationContext;
