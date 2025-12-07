import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');

const PremiumBackground = ({ children, style }) => {
    const { theme } = useTheme();

    // Define gradient colors based on theme
    // Light mode: Premium vibrant gradient
    // Dark mode: Deep dark gradient with subtle purple tones
    const gradientColors = theme === 'dark'
        ? ['#1a1a2e', '#16213e', '#0f3460'] // Deep blue/purple for dark mode
        : ['#667eea', '#764ba2', '#f093fb']; // Vibrant premium gradient for light mode

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Animated Background Circles */}
            <Animated.View
                entering={FadeInUp.delay(200).springify()}
                style={[styles.floatingCircle, styles.circle1]}
            />
            <Animated.View
                entering={FadeInUp.delay(400).springify()}
                style={[styles.floatingCircle, styles.circle2]}
            />

            {/* Content Container - Z-index ensures content is above background */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
    floatingCircle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    circle1: {
        width: width * 0.8,
        height: width * 0.8,
        top: -width * 0.2,
        right: -width * 0.2,
    },
    circle2: {
        width: width * 0.6,
        height: width * 0.6,
        bottom: -width * 0.1,
        left: -width * 0.1,
    },
});

export default PremiumBackground;
