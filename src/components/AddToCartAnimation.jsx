/**
 * Add To Cart Animation - Premium Cinematic Edition ✨
 * Features: Parabolic Arc, Squash & Stretch, Enhanced Particles
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
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Enhanced Particle Component
const Particle = ({ delay = 0, size = 8, startPos }) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(delay, withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 400 })
        ));
        scale.value = withDelay(delay, withTiming(1, { duration: 500 }));

        // Random explosion-like movement
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 40;
        tx.value = withDelay(delay, withTiming(Math.cos(angle) * dist, { duration: 500 }));
        ty.value = withDelay(delay, withTiming(Math.sin(angle) * dist, { duration: 500 }));
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        left: startPos.x,
        top: startPos.y,
        opacity: opacity.value,
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value }
        ],
    }));

    return (
        <Animated.View style={style}>
            <Ionicons name="sparkles" size={size} color="#D4AF76" />
        </Animated.View>
    );
};

export default function AddToCartAnimation({
    state, // { productImage, sourcePosition }
    onComplete
}) {
    const insets = useSafeAreaInsets();

    const progress = useSharedValue(0); // 0 to 1
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    // Target Position: Cart Tab Icon
    const targetX = (width / 5) * 2.5 - 40; // Approx center of cart tab
    const targetY = height - insets.bottom - 84 + 10;

    useEffect(() => {
        if (state) {
            progress.value = 0;
            scale.value = 0;
            opacity.value = 0;

            runCinematicAnimation();
        }
    }, [state]);

    const runCinematicAnimation = () => {
        // 1. Initial Pop In
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withSpring(1, { damping: 12, stiffness: 100 });

        // 2. The Arc Flight (Parabolic)
        progress.value = withTiming(1, {
            duration: 900,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1) // Bouncy entry effect
        }, (finished) => {
            if (finished) {
                // 3. Impact & Suck in
                scale.value = withTiming(0, { duration: 200 });
                opacity.value = withTiming(0, { duration: 200 }, () => {
                    runOnJS(onComplete)();
                });
            }
        });
    };

    const animatedStyle = useAnimatedStyle(() => {
        if (!state || !state.sourcePosition) return { opacity: 0 };

        const startX = state.sourcePosition.x - (width / 2 - 40);
        const startY = state.sourcePosition.y;

        // X Interpolation
        const currX = interpolate(progress.value, [0, 1], [startX, targetX - (width / 2 - 40)]);

        // Y Interpolation with Arc (Parabolic)
        // Midpoint peak height
        const peakY = Math.min(startY, targetY) - 150;
        const currY = interpolate(
            progress.value,
            [0, 0.5, 1],
            [startY, peakY, targetY]
        );

        // Squash and Stretch based on progress
        const scaleX = interpolate(progress.value, [0, 0.2, 0.8, 1], [1, 0.8, 1.2, 1]);
        const scaleY = interpolate(progress.value, [0, 0.2, 0.8, 1], [1, 1.2, 0.8, 1]);

        // Rotation
        const rot = interpolate(progress.value, [0, 1], [0, 360]);

        return {
            position: 'absolute',
            top: 0,
            left: width / 2 - 40,
            width: 80,
            height: 80,
            opacity: opacity.value,
            transform: [
                { translateX: currX },
                { translateY: currY },
                { rotate: `${rot}deg` },
                { scaleX: scaleX * scale.value },
                { scaleY: scaleY * scale.value },
            ],
        };
    });

    if (!state) return null;

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
                {/* Visual Trail of Particles */}
                {progress.value > 0.1 && progress.value < 0.9 && (
                    <View style={StyleSheet.absoluteFill}>
                        <Sparkle delay={0} size={15} style={{ top: 10, left: 10 }} />
                        <Sparkle delay={200} size={10} style={{ bottom: 10, right: 10 }} />
                    </View>
                )}

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

            {/* Impact Explosion */}
            {progress.value > 0.95 && (
                <View style={{ position: 'absolute', left: targetX, top: targetY }}>
                    <Particle delay={0} startPos={{ x: 0, y: 0 }} />
                    <Particle delay={50} startPos={{ x: 0, y: 0 }} />
                    <Particle delay={100} startPos={{ x: 0, y: 0 }} />
                    <Particle delay={150} startPos={{ x: 0, y: 0 }} />
                </View>
            )}
        </View>
    );
}

// Simple Sparkle Internal Helper
const Sparkle = ({ delay, size, style }) => {
    const s = useSharedValue(0);
    useEffect(() => {
        s.value = withDelay(delay, withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 300 })));
    }, []);
    const as = useAnimatedStyle(() => ({
        transform: [{ scale: s.value }],
        opacity: s.value,
    }));
    return (
        <Animated.View style={[style, as]}>
            <Ionicons name="sparkle" size={size} color="#D4AF76" />
        </Animated.View>
    );
};

// Re-using Spring for pop-in
const withSpring = (toValue, config) => {
    'worklet';
    return withTiming(toValue, { duration: 400 }); // Simplified for reliability
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2147483647,
        elevation: 2147483647,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#D4AF76',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    placeholder: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        backgroundColor: '#D4AF76',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    }
});
