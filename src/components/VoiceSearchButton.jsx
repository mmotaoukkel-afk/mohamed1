/**
 * Voice Search Button Component
 * Floating microphone button for voice search
 * Dark Mode Supported 🌙
 */

import React, { useState } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import VoiceSearchModal from './VoiceSearchModal';

export default function VoiceSearchButton() {
    const { theme } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.9);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        setModalVisible(true);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <>
            <Animated.View style={[styles.container, animatedStyle]}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                >
                    <LinearGradient
                        colors={[theme.accent, theme.accentDark || theme.accent]}
                        style={styles.button}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="mic" size={28} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Pulse Ring */}
                <View style={styles.pulseRing} />
            </Animated.View>

            <VoiceSearchModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        zIndex: 1000,
    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    pulseRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        top: 0,
        left: 0,
    },
});
