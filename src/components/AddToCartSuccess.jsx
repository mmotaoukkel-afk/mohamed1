import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    withTiming,
    interpolate,
    Extrapolate,
    runOnJS
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const Particle = ({ delay, angle, distance }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(delay, withTiming(1, { duration: 800 }));
    }, []);

    const style = useAnimatedStyle(() => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * distance * progress.value;
        const y = Math.sin(rad) * distance * progress.value;

        return {
            transform: [{ translateX: x }, { translateY: y }, { scale: 1 - progress.value }],
            opacity: 1 - progress.value,
        };
    });

    return <Animated.View style={[styles.particle, style]} />;
};

export default function AddToCartSuccess({ visible, onClose }) {
    const { theme, isDark } = useTheme();
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = 0;
            opacity.value = 0;

            // Entrance
            scale.value = withSpring(1, { damping: 12 });
            opacity.value = withTiming(1, { duration: 200 });

            // Auto-hide
            const timeout = setTimeout(() => {
                opacity.value = withTiming(0, { duration: 300 }, (finished) => {
                    if (finished) runOnJS(onClose)();
                });
                scale.value = withTiming(0.8, { duration: 300 });
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    if (!visible) return null;

    return (
        <View style={styles.overlay} pointerEvents="none">
            <Animated.View style={[styles.container, containerStyle]}>
                <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={styles.glass}>
                    {/* Particles Burst */}
                    {[...Array(8)].map((_, i) => (
                        <Particle
                            key={i}
                            delay={100}
                            angle={i * 45}
                            distance={60}
                        />
                    ))}

                    <View style={styles.iconCircle}>
                        <Ionicons name="cart" size={32} color="#FFF" />
                        <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={12} color="#10B981" />
                        </View>
                    </View>

                    <Text style={[styles.title, { color: isDark ? '#FFF' : '#2D1F28' }]}>
                        تمت الإضافة!
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#CCC' : '#666' }]}>
                        المنتج أصبح في سلتك الآن
                    </Text>
                </BlurView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 1000,
    },
    container: {
        width: 220,
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    glass: {
        padding: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10B981', // Success Green
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    checkBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#FFF',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
    },
    particle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F5B5C8', // Pink particle
        top: '35%',
        left: '50%',
        marginLeft: -4,
        marginTop: -30,
    }
});
