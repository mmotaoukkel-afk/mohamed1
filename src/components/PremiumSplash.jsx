/**
 * Premium Splash Screen - Kataraa
 * Clean white design with the new kataraa floral logo.
 * Features: White background, logo breathing animation, elegant progress bar.
 */

import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { typography } from '../theme/tokens';
import { Text } from './ui';

const { width, height } = Dimensions.get('window');

const PremiumSplash = ({ onFinish }) => {
    const { t } = useLanguage();
    // Animation Values
    const logoScale = useRef(new Animated.Value(0.85)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(20)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Logo Sequence
        Animated.sequence([
            // Fade In + Scale Up
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.ease),
                }),
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.ease),
                }),
            ]),
            // Breathing Motion (Loop)
            Animated.loop(
                Animated.sequence([
                    Animated.timing(logoScale, {
                        toValue: 1.05,
                        duration: 1500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    Animated.timing(logoScale, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ])
            )
        ]).start();

        // 2. Text Reveal (Slightly delayed)
        Animated.parallel([
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 800,
                delay: 400,
                useNativeDriver: true,
            }),
            Animated.timing(textTranslateY, {
                toValue: 0,
                duration: 800,
                delay: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
        ]).start();

        // 3. Progress Bar Animation
        Animated.timing(progressWidth, {
            toValue: 100,
            duration: 3200,
            useNativeDriver: false,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }).start();

        // 4. Auto Finish
        const timer = setTimeout(() => {
            onFinish?.();
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    const progressInterp = progressWidth.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {/* Center Content */}
            <View style={styles.contentContainer}>

                {/* Logo Image */}
                <Animated.View style={[
                    styles.logoWrapper,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }]
                    }
                ]}>
                    <Image
                        source={require('../../assets/images/splash_kataraa.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </Animated.View>

                {/* Text Section */}
                <Animated.View style={[
                    styles.textWrapper,
                    {
                        opacity: textOpacity,
                        transform: [{ translateY: textTranslateY }]
                    }
                ]}>
                    <Text style={styles.tagline}>عناية كورية فاخرة</Text>
                    <Text style={styles.subtext}>اكتشفي سر الجمال</Text>
                </Animated.View>
            </View>

            {/* Bottom Section: Progress Bar & Copyright */}
            <View style={styles.footer}>
                {/* Progress Bar Container */}
                <View style={styles.progresBarContainer}>
                    <Animated.View
                        style={[
                            styles.progressBarFill,
                            { width: progressInterp }
                        ]}
                    />
                </View>

                <Text style={styles.copyright}>© 2025 KATARAA</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoWrapper: {
        width: width * 0.55,
        height: width * 0.55,
        marginBottom: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textWrapper: {
        alignItems: 'center',
        gap: 8,
    },
    tagline: {
        fontSize: 22,
        color: '#8B6F5E',
        fontWeight: '300',
        letterSpacing: 1.5,
        fontFamily: typography.fontFamilies.heading,
    },
    subtext: {
        fontSize: 14,
        color: 'rgba(139, 111, 94, 0.6)',
        letterSpacing: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        width: width * 0.6,
        alignItems: 'center',
        gap: 15,
    },
    progresBarContainer: {
        width: '100%',
        height: 2,
        backgroundColor: 'rgba(139, 111, 94, 0.15)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#C4956A',
        borderRadius: 1,
    },
    copyright: {
        fontSize: 10,
        color: 'rgba(139, 111, 94, 0.4)',
        letterSpacing: 2,
    }
});

export default PremiumSplash;
