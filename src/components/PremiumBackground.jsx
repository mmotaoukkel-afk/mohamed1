
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

const PremiumBackground = ({ isDark }) => {
    return (
        <LinearGradient
            colors={isDark ? ['#000', '#1a1a1a'] : ['#FFFDF5', '#F5F0E1']}
            style={StyleSheet.absoluteFill}
        />
    );
};

export default PremiumBackground;
