import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const AppBackground = () => {
    const { isDark } = useTheme();

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ImageBackground
                source={require('../../../assets/background-pattern.png')} // We'll save the image here
                style={styles.background}
                imageStyle={{
                    opacity: isDark ? 0.08 : 0.03, // Adjusted for subtlety
                    resizeMode: 'repeat', // Tile the image
                }}
            >
                {/* Dark mode overlay to make it blend well with dark theme */}
                {isDark && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 12, 18, 0.85)' }]} />
                )}
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});

export default React.memo(AppBackground);
