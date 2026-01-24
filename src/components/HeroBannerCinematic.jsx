/**
 * Cinematic Hero Banner - Kataraa 🎬✨
 * Premium animated hero section with parallax and luxury design
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Text,
    TouchableOpacity,
    Dimensions,
    FlatList,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.42;

// Kataraa Blush Pink Theme
const COLORS = {
    primary: '#F5B5C8',
    secondary: '#FFDAB9',
    accent: '#B76E79',
    background: '#FFF9F5',
    textPrimary: '#3D2314',
};

export default function HeroBannerCinematic({ onShopNow }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const fadeIn = useSharedValue(0);
    const buttonGlow = useSharedValue(0);
    const textSlide = useSharedValue(30);

    const slides = [
        {
            id: 1,
            image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
            title: 'كتارا للجمال',
            subtitle: 'سحر كوري لبشرتك ✨',
            gradient: ['rgba(245,181,200,0.1)', 'rgba(245,181,200,0.9)'],
        },
        {
            id: 2,
            image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
            title: 'عروض حصرية',
            subtitle: 'خصومات تصل إلى 50%',
            gradient: ['rgba(183,110,121,0.1)', 'rgba(183,110,121,0.85)'],
        },
        {
            id: 3,
            image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800',
            title: 'العناية بالبشرة',
            subtitle: 'منتجات طبيعية 100%',
            gradient: ['rgba(255,218,185,0.1)', 'rgba(245,181,200,0.9)'],
        },
    ];

    useEffect(() => {
        // Entrance animation
        fadeIn.value = withTiming(1, { duration: 800 });
        textSlide.value = withTiming(0, { duration: 600 });

        // Button glow effect
        buttonGlow.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500 }),
                withTiming(0, { duration: 1500 })
            ),
            -1,
            true
        );

        // Auto-scroll
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % slides.length;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: fadeIn.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: textSlide.value }],
        opacity: fadeIn.value,
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        shadowOpacity: interpolate(
            buttonGlow.value,
            [0, 1],
            [0.3, 0.7],
            Extrapolation.CLAMP
        ),
        transform: [
            {
                scale: interpolate(
                    buttonGlow.value,
                    [0, 1],
                    [1, 1.02],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    const renderSlide = ({ item }) => (
        <View style={styles.slide}>
            <Image source={{ uri: item.image }} style={styles.slideImage} />
            <LinearGradient
                colors={item.gradient}
                style={styles.slideOverlay}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
            <Animated.View style={[styles.slideContent, textStyle]}>
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </Animated.View>
        </View>
    );

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            {/* Dots Indicator */}
            <View style={styles.dotsContainer}>
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index && styles.dotActive,
                        ]}
                    />
                ))}
            </View>

            {/* Shop Now Button */}
            <Animated.View style={[styles.shopButtonContainer, buttonStyle]}>
                <TouchableOpacity onPress={onShopNow} activeOpacity={0.9}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.shopButton}
                    >
                        <Text style={styles.shopButtonText}>تسوقي الآن</Text>
                        <View style={styles.arrowCircle}>
                            <Ionicons name="arrow-forward" size={18} color={COLORS.accent} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* Decorative Elements */}
            <View style={styles.decorTop}>
                <View style={styles.decorCircle} />
                <View style={[styles.decorCircle, styles.decorCircle2]} />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: BANNER_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
    },
    slide: {
        width: width,
        height: BANNER_HEIGHT,
        position: 'relative',
    },
    slideImage: {
        width: '100%',
        height: '100%',
    },
    slideOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    slideContent: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    slideTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
        marginBottom: 8,
    },
    slideSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '500',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 70,
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        width: 28,
        backgroundColor: '#fff',
    },
    shopButtonContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 15,
    },
    shopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingLeft: 28,
        paddingRight: 8,
        borderRadius: 30,
        gap: 14,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    arrowCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    decorTop: {
        position: 'absolute',
        top: -20,
        right: -20,
    },
    decorCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        position: 'absolute',
    },
    decorCircle2: {
        width: 50,
        height: 50,
        borderRadius: 25,
        top: 40,
        left: -30,
    },
});
