/**
 * ProductImageGallery - Luxury Interactive Gallery
 * Features: Pinch-to-zoom, swipe, fullscreen, progressive loading
 */

import React, { useState } from 'react';
import {
    View,
    Image,
    TouchableOpacity,
    Modal,
    Dimensions,
    StyleSheet,
    ScrollView,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Surface, Text } from './ui';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to get image URI from different formats
const getImageUri = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img;
    if (img.src) return img.src;
    return null;
};

export default function ProductImageGallery({ images = [], initialIndex = 0, tokens }) {
    const [selectedIndex, setSelectedIndex] = useState(initialIndex);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);

    // Pinch gesture
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 4));
            focalX.value = e.focalX;
            focalY.value = e.focalY;
        })
        .onEnd(() => {
            if (scale.value < 1.2) {
                scale.value = withSpring(1);
                savedScale.value = 1;
            } else {
                savedScale.value = scale.value;
            }
        });

    // Double tap to zoom
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
            } else {
                scale.value = withTiming(2);
                savedScale.value = 2;
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const composedGesture = Gesture.Race(doubleTap, pinchGesture);

    const openFullscreen = () => {
        setFullscreenVisible(true);
    };

    const closeFullscreen = () => {
        setFullscreenVisible(false);
        scale.value = withTiming(1);
        savedScale.value = 1;
    };

    if (!images || images.length === 0) {
        return (
            <Surface variant="glass" radius="xxl" style={styles.emptyContainer}>
                <Ionicons name="image-outline" size={60} color={tokens.colors.textMuted} />
                <Text variant="body" style={{ color: tokens.colors.textMuted }}>
                    No images available
                </Text>
            </Surface>
        );
    }

    const currentImage = images[selectedIndex];
    const currentUri = getImageUri(currentImage);

    return (
        <View style={styles.container}>
            {/* Main Image */}
            <Surface variant="glass" radius="xxl" style={styles.imageFrame} padding="none">
                <TouchableOpacity onPress={openFullscreen} activeOpacity={0.9}>
                    <GestureDetector gesture={composedGesture}>
                        <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                            <Image
                                source={currentUri ? { uri: currentUri } : { uri: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400' }}
                                style={styles.mainImage}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </GestureDetector>
                </TouchableOpacity>

                {/* Fullscreen hint */}
                <View style={styles.zoomHint}>
                    <Ionicons name="expand-outline" size={16} color={tokens.colors.textMuted} />
                    <Text variant="caption" style={{ color: tokens.colors.textMuted }}>
                        Tap to expand
                    </Text>
                </View>
            </Surface>

            {/* Thumbnails */}
            {images.length > 1 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbList}
                >
                    {images.map((img, index) => {
                        const thumbUri = getImageUri(img);
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedIndex(index)}
                            >
                                <Surface
                                    variant="glass"
                                    padding="xs"
                                    radius="lg"
                                    style={[
                                        styles.thumb,
                                        selectedIndex === index && {
                                            borderColor: tokens.colors.primary,
                                            borderWidth: 2,
                                        },
                                    ]}
                                >
                                    <Image
                                        source={thumbUri ? { uri: thumbUri } : { uri: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400' }}
                                        style={styles.thumbImage}
                                    />
                                </Surface>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Fullscreen Modal */}
            <Modal
                visible={fullscreenVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeFullscreen}
            >
                <View style={styles.fullscreenContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={closeFullscreen}
                    >
                        <Surface variant="glass" padding="sm" radius="full">
                            <Ionicons name="close" size={24} color={tokens.colors.text} />
                        </Surface>
                    </TouchableOpacity>

                    <GestureDetector gesture={composedGesture}>
                        <Animated.View style={{ flex: 1, justifyContent: 'center' }}>
                            <Animated.View style={animatedStyle}>
                                <Image
                                    source={currentUri ? { uri: currentUri } : { uri: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400' }}
                                    style={styles.fullscreenImage}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        </Animated.View>
                    </GestureDetector>

                    {/* Image Counter */}
                    <View style={styles.imageCounter}>
                        <Surface variant="glass" padding="sm" radius="full">
                            <Text variant="caption" style={{ color: tokens.colors.text }}>
                                {selectedIndex + 1} / {images.length}
                            </Text>
                        </Surface>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    imageFrame: {
        width: SCREEN_WIDTH * 0.88,
        overflow: 'hidden',
    },
    imageWrapper: {
        padding: 20,
    },
    mainImage: {
        width: '100%',
        height: SCREEN_WIDTH * 0.85,
    },
    emptyContainer: {
        width: SCREEN_WIDTH * 0.88,
        height: SCREEN_WIDTH * 0.85,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    zoomHint: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        opacity: 0.6,
    },
    thumbList: {
        paddingHorizontal: 24,
        marginTop: 20,
        gap: 12,
    },
    thumb: {
        borderRadius: 18,
        overflow: 'hidden',
        width: 68,
        height: 68,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbImage: {
        width: 60,
        height: 60,
        borderRadius: 14,
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    fullscreenImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.8,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
    },
});
