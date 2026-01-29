/**
 * Drop-to-Cart Animation - Kataraa 🛍️✨
 * Using translateX/Y with proper positioning
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function AddToCartAnimation({
    visible,
    productImage,
    sourcePosition,
    targetPosition,
    onComplete,
}) {
    const { tokens } = useTheme();

    // Calculate positions relative to screen center
    const startX = sourcePosition ? sourcePosition.x - width / 2 : 0;
    const startY = sourcePosition ? sourcePosition.y - height / 2 : 0;

    const endX = targetPosition?.x ? targetPosition.x - width / 2 : 0;
    const endY = targetPosition?.y ? targetPosition.y - height / 2 : height / 2 - 100;

    // Animated values
    const translateX = useRef(new Animated.Value(startX)).current;
    const translateY = useRef(new Animated.Value(startY)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.3)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    // Sparkle
    const sparkleOpacity = useRef(new Animated.Value(0)).current;
    const sparkleScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            console.log('🎯 [Drop] From:', { startX, startY }, 'to:', { endX, endY });
            runAnimation();
        } else {
            resetAnimation();
        }
    }, [visible]);

    const runAnimation = () => {
        // Reset
        translateX.setValue(startX);
        translateY.setValue(startY);
        opacity.setValue(0);
        scale.setValue(0.3);
        rotate.setValue(0);
        sparkleOpacity.setValue(0);
        sparkleScale.setValue(0);

        // Animation sequence
        Animated.parallel([
            // Appear and grow
            Animated.timing(opacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            // Move to cart
            Animated.timing(translateX, {
                toValue: endX,
                duration: 700,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: endY,
                duration: 700,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(rotate, {
                toValue: 1,
                duration: 700,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            // Scale sequence: grow → shrink when reaching cart
            Animated.sequence([
                Animated.spring(scale, {
                    toValue: 1.2,
                    damping: 12,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.1, // Shrink to tiny when reaching cart
                    duration: 300,
                    delay: 400, // Start shrinking near end of movement
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            // Impact
            Animated.parallel([
                Animated.timing(sparkleOpacity, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.spring(sparkleScale, {
                    toValue: 1.5,
                    friction: 4,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Fade out
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(sparkleOpacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    console.log('✅ [Drop] Complete');
                    if (onComplete) onComplete();
                });
            });
        });
    };

    const resetAnimation = () => {
        translateX.setValue(startX);
        translateY.setValue(startY);
        opacity.setValue(0);
    };

    const rotateInterpolate = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '25deg']
    });

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Overlay */}
            <View style={styles.overlay} />

            {/* Product - NO CENTERING, pure translateX/Y */}
            <Animated.View
                style={[
                    styles.product,
                    {
                        opacity,
                        transform: [
                            { translateX },
                            { translateY },
                            { scale },
                            { rotate: rotateInterpolate },
                        ],
                    }
                ]}
            >
                {productImage ? (
                    <Image
                        source={{ uri: productImage }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                ) : (
                    <LinearGradient
                        colors={[tokens.colors.primary, tokens.colors.primaryDark]}
                        style={[styles.image, styles.placeholder]}
                    >
                        <Ionicons name="gift" size={50} color="#FFF" />
                    </LinearGradient>
                )}
            </Animated.View>

            {/* Sparkles */}
            <Animated.View
                style={[
                    styles.sparkle,
                    {
                        opacity: sparkleOpacity,
                        transform: [
                            { translateX: endX },
                            { translateY: endY },
                            { scale: sparkleScale },
                        ],
                    }
                ]}
            >
                <Ionicons name="sparkles" size={50} color={tokens.colors.primary} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        elevation: 999999,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    product: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 130,
        height: 130,
        borderRadius: 20,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
        elevation: 20,
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sparkle: {
        position: 'absolute',
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
