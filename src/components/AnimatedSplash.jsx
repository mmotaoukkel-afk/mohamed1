/**
 * Animated Splash Screen - Kataraa
 * Premium loading experience with cosmic luxury theme
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useTranslation } from '../hooks/useTranslation';
import { Text } from './ui';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ onFinish }) => {
    const { t } = useTranslation();
    const logoScale = useSharedValue(0.8);
    const logoOpacity = useSharedValue(0);
    const shimmerPosition = useSharedValue(-width);
    const textOpacity = useSharedValue(0);
    const dotsOpacity = useSharedValue(0);

    useEffect(() => {
        // Logo fade in and scale
        logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
        logoScale.value = withSequence(
            withTiming(1.1, { duration: 600, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.cubic) })
        );

        // Shimmer effect
        shimmerPosition.value = withRepeat(
            withTiming(width, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
            -1,
            false
        );

        // Text fade in
        textOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));

        // Loading dots
        dotsOpacity.value = withDelay(800, withRepeat(
            withSequence(
                withTiming(1, { duration: 400 }),
                withTiming(0.3, { duration: 400 })
            ),
            -1,
            true
        ));

        // Auto finish after 2.5 seconds
        const timer = setTimeout(() => {
            onFinish?.();
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerPosition.value }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const dotsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: dotsOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0D0D0D', '#1A1A2E', '#16213E']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />
            <View style={[styles.orb, styles.orb3]} />

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                <Image
                    source={{ uri: 'https://kataraa.com/wp-content/uploads/2023/10/logo-gold.webp' }}
                    style={styles.logo}
                    contentFit="contain"
                />

                {/* Shimmer overlay */}
                <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(255,215,0,0.3)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.shimmer}
                    />
                </Animated.View>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                <Text style={styles.tagline}>{t('splash.tagline')}</Text>
                <Animated.View style={dotsAnimatedStyle}>
                    <Text style={styles.loading}>{t('loadingMagic', 'جاري تحميل السحر ✨')}</Text>
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D0D0D',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
    },
    orb1: {
        width: 300,
        height: 300,
        top: -100,
        right: -100,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    orb2: {
        width: 200,
        height: 200,
        bottom: 100,
        left: -80,
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
    },
    orb3: {
        width: 150,
        height: 150,
        top: height * 0.3,
        left: width * 0.6,
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
    },
    logoContainer: {
        width: 200,
        height: 100,
        overflow: 'hidden',
        marginBottom: 40,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    shimmerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    shimmer: {
        width: 100,
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
        gap: 12,
    },
    tagline: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '300',
        letterSpacing: 2,
    },
    loading: {
        fontSize: 14,
        color: 'rgba(255, 215, 0, 0.8)',
        fontWeight: '500',
    },
});

export default AnimatedSplash;
