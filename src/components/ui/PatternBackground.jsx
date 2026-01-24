import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const PatternBackground = () => {
    const { tokens, isDark } = useTheme();

    // Memoize icons to prevent re-calculations
    // We place them irregularly to create a "natural" texture
    // Opacity MAXIMIZED for visibility (0.45 - 0.5) & Larger Sizes
    const icons = useMemo(() => [
        { name: 'sparkles-outline', size: 32, top: '10%', left: '5%', opacity: 0.5, rotate: '15deg' },
        { name: 'leaf-outline', size: 48, top: '25%', right: '8%', opacity: 0.45, rotate: '-20deg' },
        { name: 'diamond-outline', size: 40, top: '40%', left: '15%', opacity: 0.4, rotate: '45deg' },
        { name: 'flower-outline', size: 56, top: '60%', right: '-5%', opacity: 0.45, rotate: '10deg' },
        { name: 'heart-outline', size: 30, top: '75%', left: '10%', opacity: 0.4, rotate: '-15deg' },
        { name: 'star-outline', size: 24, top: '15%', right: '20%', opacity: 0.5, rotate: '30deg' },
        { name: 'water-outline', size: 42, top: '85%', right: '15%', opacity: 0.45, rotate: '0deg' },
        { name: 'color-palette-outline', size: 50, top: '50%', left: '-5%', opacity: 0.4, rotate: '90deg' },
    ], []);

    const color = isDark ? '#FFFFFF' : tokens.colors.primary;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {icons.map((icon, index) => (
                <View
                    key={index}
                    style={{
                        position: 'absolute',
                        top: icon.top,
                        left: icon.left,
                        right: icon.right,
                        opacity: icon.opacity,
                        transform: [{ rotate: icon.rotate }],
                    }}
                >
                    <Ionicons name={icon.name} size={icon.size} color={color} />
                </View>
            ))}
        </View>
    );
};

export default React.memo(PatternBackground);
