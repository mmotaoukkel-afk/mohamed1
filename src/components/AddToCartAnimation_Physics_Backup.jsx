/**
 * Drop-to-Cart Animation - Kataraa 🛍️✨
 * Physics-based drop animation with squash & stretch impact
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    View,
} from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
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

    // Animation values
    const productX = useSharedValue(0);
    const productY = useSharedValue(0);
    const productScale = useSharedValue(0);
    const productRotate = useSharedValue(0);
    const productOpacity = useSharedValue(0);

    // Impact Interaction (Cart Icon Squash)
    const cartScaleX = useSharedValue(1);
    const cartScaleY = useSharedValue(1);

    // Start coordinates
    const startX = sourcePosition?.x ? sourcePosition.x - 40 : width / 2 - 40;
    const startY = sourcePosition?.y ? sourcePosition.y - 40 : height * 0.4;

    // Target coordinates (default to bottom center-right)
    const endX = targetPosition?.x ? targetPosition.x - 40 : width * 0.65;
    const endY = targetPosition?.y ? targetPosition.y - 40 : height - 80;

    console.log(`[Animation] Visible: ${visible}, Start: (${startX}, ${startY}), End: (${endX}, ${endY})`);

    useEffect(() => {
        if (visible) {
            runAnimation();
        } else {
            resetAnimation();
        }
    }, [visible]);

    const runAnimation = () => {
        // Reset
        productX.value = startX;
        productY.value = startY;
        productScale.value = 0.5;
        productRotate.value = 0;
        productOpacity.value = 1;

        cartScaleX.value = 1;
        cartScaleY.value = 1;

        // 1. Pop In & Up (Toss effect)
        productScale.value = withSpring(1, { damping: 15 });

        // 2. Drop to Cart (Simulate Gravity)
        const duration = 800;

        // Horizontal movement - slightly eased
        productX.value = withTiming(endX, {
            duration: duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });

        // Vertical movement - Arc (Up then Down)
        // We simulate this by setting initial Y velocity? No, easier to sequence.
        // Actually, let's just use a bezier that overshoots backwards?
        // Or better: Sequence a small Up then a Big Down.
        // But timing needs to be synced. Functional bezier is best for single-prop.
        // Easing.bezier(0.3, -0.5, 0.7, 0) starts by going backwards (up).

        productY.value = withTiming(endY, {
            duration: duration,
            easing: Easing.bezier(0.35, -0.3, 1, 1), // Arc effect: Backwards (Up) then Fast Down
        }, (finished) => {
            if (finished) {
                // 3. Impact & Squash
                runOnJS(triggerImpact)();
            }
        });

        // Spin while falling
        productRotate.value = withTiming(360, { duration: duration });

        // Shrink slightly at end
        productScale.value = withDelay(duration - 200, withTiming(0.2, { duration: 200 }));
        productOpacity.value = withDelay(duration - 100, withTiming(0, { duration: 100 }));
    };

    const triggerImpact = () => {
        // Squash & Stretch Effect on the invisible target marker
        cartScaleX.value = withSequence(
            withTiming(1.4, { duration: 100 }),
            withSpring(1, { damping: 10 })
        );
        cartScaleY.value = withSequence(
            withTiming(0.6, { duration: 100 }),
            withSpring(1, { damping: 10 })
        );

        // Complete callback
        if (onComplete) {
            setTimeout(onComplete, 100);
        }
    };

    const resetAnimation = () => {
        productOpacity.value = 0;
        productScale.value = 0;
    };

    const productStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 0,
        left: 0,
        width: 80,
        height: 80,
        opacity: productOpacity.value,
        transform: [
            { translateX: productX.value },
            { translateY: productY.value },
            { scale: productScale.value },
            { rotate: `${productRotate.value}deg` }
        ],
        zIndex: 9999,
        elevation: 10000,
    }));

    // Optional: Visual Ripple at target
    const targetStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 0,
        left: 0,
        width: 80,
        height: 80, // Target hit area size
        opacity: 0, // Keep invisible, just for calculating transforms if we wanted to show it
        transform: [
            { translateX: endX },
            { translateY: endY },
            { scaleX: cartScaleX.value },
            { scaleY: cartScaleY.value }
        ]
    }));

    // if (!visible) return null; // Removed to ensure component is always mounted for layout readiness

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Falling Product */}
            <Animated.View style={productStyle}>
                {productImage ? (
                    <Image
                        source={{ uri: productImage }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={[styles.placeholder, { backgroundColor: tokens?.colors?.primary || '#F5B5C8' }]}>
                        <Ionicons name="cart" size={30} color="#fff" />
                    </View>
                )}
            </Animated.View>

            {/* Target Interaction Marker (Invisible but handles logic logic logic for now, 
                could add a ripple here if desired) */}
            <Animated.View style={targetStyle} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#fff',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});
