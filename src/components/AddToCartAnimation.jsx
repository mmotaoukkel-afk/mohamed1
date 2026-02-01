/**
 * Add To Cart Animation - Simplified Logic 📉
 * Based on user-provided snippet for maximum visibility
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
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Sparkle Component for additional flair
const Sparkle = ({ delay = 0, size = 10, style }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(1, { duration: 400 }),
                withTiming(0, { duration: 400 })
            ),
            -1,
            true
        ));
        opacity.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(1, { duration: 400 }),
                withTiming(0, { duration: 400 })
            ),
            -1,
            true
        ));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
        zIndex: 10,
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            <Ionicons name="sparkles" size={size} color="#D4AF76" />
        </Animated.View>
    );
};

export default function AddToCartAnimation({
    state, // { productImage, sourcePosition }
    onComplete
}) {
    const insets = useSafeAreaInsets();

    // Animation Values - Dynamic Start
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(1);
    const rotate = useSharedValue(0);

    // Dynamic Target Calculation:
    const targetY = height - insets.bottom - 84 + 5;
    const cartIconX = (width / 5) * 2.5 - 40;

    useEffect(() => {
        if (state) {
            runPolishedAnimation();
        }
    }, [state]);

    const runPolishedAnimation = () => {
        const { sourcePosition } = state;

        // Initial setup from source if available
        if (sourcePosition) {
            translateX.value = sourcePosition.x - (width / 2 - 40); // Offset from center
            translateY.value = sourcePosition.y;
        } else {
            translateX.value = 0;
            translateY.value = -100;
        }

        scale.value = 0.5;
        opacity.value = 1;
        rotate.value = 0;

        // 1. Pop In
        scale.value = withTiming(1.1, { duration: 200 });

        // 2. Drop with Gravity (Accelerate) & Rotate
        translateY.value = withTiming(targetY, {
            duration: 1000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        }, (finished) => {
            if (finished) {
                runOnJS(onComplete)();
            }
        });

        // Move horizontally towards the cart tab
        translateX.value = withTiming(cartIconX - (width / 2 - 40), {
            duration: 1000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });

        rotate.value = withTiming(15, { duration: 1000 });

        // 3. "Enter" Cart Effect (Suck in)
        scale.value = withDelay(800, withTiming(0, { duration: 250 }));
        opacity.value = withDelay(900, withTiming(0, { duration: 150 }));
    };

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 0,
        left: width / 2 - 40,
        width: 80,
        height: 80,
        opacity: opacity.value,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
            { rotate: `${rotate.value}deg` }
        ],
        zIndex: 99999,
        elevation: 99999,
    }));

    if (!state) return null;

    // Robust source derivation
    let source = null;
    if (state.productImage) {
        if (typeof state.productImage === 'string') {
            source = { uri: state.productImage };
        } else if (state.productImage.uri) {
            source = state.productImage;
        } else if (state.productImage.src) {
            source = { uri: state.productImage.src };
        }
    }

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View style={animatedStyle}>
                {/* Decorative Sparkles */}
                <Sparkle delay={0} size={20} style={{ top: -15, right: -15 }} />
                <Sparkle delay={200} size={16} style={{ top: -25, left: 10 }} />
                <Sparkle delay={400} size={24} style={{ bottom: 10, left: -20 }} />
                <Sparkle delay={100} size={14} style={{ bottom: -10, right: 10 }} />

                {source && source.uri ? (
                    <Image
                        source={source}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="cart" size={40} color="#fff" />
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2147483647,
        elevation: 2147483647,
        pointerEvents: "none"
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#F5B5C8',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    placeholder: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        backgroundColor: '#F5B5C8', // Standard color
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    }
});
