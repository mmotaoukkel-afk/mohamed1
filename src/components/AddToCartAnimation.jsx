/**
 * Fly-to-Cart Animation - Kataraa 🛍️✨
 * Product flies into bag, bag flies to cart - NO interruption!
 */

import React, { useEffect } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Dimensions,
    Text,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#F5B5C8',
    accent: '#B76E79',
};

export default function AddToCartAnimation({
    visible,
    productImage,
    productName,
    targetPosition,
    onComplete,
}) {
    // Animation values
    const overlayOpacity = useSharedValue(0);

    // Product animation
    const productScale = useSharedValue(0);
    const productY = useSharedValue(0);
    const productOpacity = useSharedValue(1);
    const productShake = useSharedValue(0);

    // Bag animation
    const bagScale = useSharedValue(0);
    const bagX = useSharedValue(0);
    const bagY = useSharedValue(0);
    const bagOpacity = useSharedValue(0);

    // Target position (cart icon) - default to top-right
    const cartX = targetPosition?.x || width - 50;
    const cartY = targetPosition?.y || 50;

    useEffect(() => {
        if (visible) {
            runAnimation();
        } else {
            resetAnimation();
        }
    }, [visible]);

    const runAnimation = () => {
        // Reset values
        overlayOpacity.value = 0;
        productScale.value = 0;
        productY.value = 0;
        productOpacity.value = 1;
        productShake.value = 0;
        bagScale.value = 0;
        bagX.value = 0;
        bagY.value = 0;
        bagOpacity.value = 0;

        // Phase 1: Light overlay (semi-transparent, not blocking)
        overlayOpacity.value = withTiming(0.3, { duration: 150 });

        // Phase 2: Product appears and shakes
        productScale.value = withSpring(1, { damping: 12 });
        productShake.value = withDelay(200, withSequence(
            withTiming(-8, { duration: 60 }),
            withTiming(8, { duration: 60 }),
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(0, { duration: 40 })
        ));

        // Phase 3: Bag appears below product
        bagScale.value = withDelay(400, withSpring(1, { damping: 14 }));
        bagOpacity.value = withDelay(400, withTiming(1, { duration: 150 }));

        // Phase 4: Product drops into bag
        productY.value = withDelay(600, withSpring(80, { damping: 10 }));
        productOpacity.value = withDelay(800, withTiming(0, { duration: 150 }));

        // Phase 5: Bag flies to cart
        const targetX = cartX - width / 2;
        const targetY = cartY - height / 2 - 100;

        bagX.value = withDelay(950, withTiming(targetX, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        }));
        bagY.value = withDelay(950, withTiming(targetY, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        }));
        bagScale.value = withDelay(950, withTiming(0.3, { duration: 500 }));

        // Phase 6: Bag disappears at cart
        bagOpacity.value = withDelay(1350, withTiming(0, { duration: 150 }));
        overlayOpacity.value = withDelay(1300, withTiming(0, { duration: 200 }));

        // Complete animation
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 1600);
    };

    const resetAnimation = () => {
        overlayOpacity.value = 0;
        productScale.value = 0;
        productY.value = 0;
        productOpacity.value = 1;
        productShake.value = 0;
        bagScale.value = 0;
        bagX.value = 0;
        bagY.value = 0;
        bagOpacity.value = 0;
    };

    // Animated styles
    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const productStyle = useAnimatedStyle(() => ({
        opacity: productOpacity.value,
        transform: [
            { scale: productScale.value },
            { translateY: productY.value },
            { translateX: productShake.value },
        ],
    }));

    const bagStyle = useAnimatedStyle(() => ({
        opacity: bagOpacity.value,
        transform: [
            { scale: bagScale.value },
            { translateX: bagX.value },
            { translateY: bagY.value },
        ],
    }));

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Light overlay - doesn't block interaction */}
            <Animated.View style={[styles.overlay, overlayStyle]} />

            {/* Product Image */}
            <Animated.View style={[styles.productContainer, productStyle]}>
                {productImage ? (
                    <Image
                        source={{ uri: productImage }}
                        style={styles.productImage}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.productPlaceholder}>
                        <Ionicons name="bag-add" size={40} color={COLORS.accent} />
                    </View>
                )}
            </Animated.View>

            {/* Gift Bag */}
            <Animated.View style={[styles.bagContainer, bagStyle]}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    style={styles.bag}
                >
                    <View style={styles.handles}>
                        <View style={styles.handle} />
                        <View style={styles.handle} />
                    </View>
                    <View style={styles.bagTop} />
                    <View style={styles.bagBody}>
                        <Text style={styles.bagText}>🌸</Text>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Sparkle at cart */}
            <Animated.View style={[styles.sparkleContainer, bagStyle]}>
                <Text style={styles.sparkle}>✨</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 249, 245, 0.5)',
    },
    productContainer: {
        position: 'absolute',
        top: height * 0.35,
        alignSelf: 'center',
        zIndex: 20,
    },
    productImage: {
        width: 100,
        height: 100,
        borderRadius: 18,
        backgroundColor: '#fff',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    productPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
    },
    bagContainer: {
        position: 'absolute',
        top: height * 0.45,
        alignSelf: 'center',
        zIndex: 15,
    },
    bag: {
        width: 80,
        height: 90,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    handles: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 40,
        position: 'absolute',
        top: -12,
    },
    handle: {
        width: 14,
        height: 18,
        borderRadius: 7,
        borderWidth: 2.5,
        borderColor: COLORS.accent,
    },
    bagTop: {
        width: '100%',
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    bagBody: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bagText: {
        fontSize: 24,
    },
    sparkleContainer: {
        position: 'absolute',
        top: height * 0.45 - 20,
        alignSelf: 'center',
        zIndex: 25,
    },
    sparkle: {
        fontSize: 28,
    },
});
