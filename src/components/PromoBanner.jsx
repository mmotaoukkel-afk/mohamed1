/**
 * Video Promo Banner - Kataraa
 * Banner with video/image support and "Shop Now" button
 * Uses expo-video for video playback
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme/colors';

import { useTranslation } from '../hooks/useTranslation';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.3;

export default function PromoBanner({
    title,
    subtitle,
    buttonText,
    videoUrl,
    imageUrl,
    onPress,
    badge,
    overlayColor = 'rgba(0,0,0,0.3)',
}) {
    const { t } = useTranslation();
    const activeTitle = title || t('newLaunch');
    const activeSubtitle = subtitle || t('discoverLatest');
    const activeButtonText = buttonText || t('shopNow');
    const activeBadge = badge || t('fresh');
    const [isMuted, setIsMuted] = useState(true);

    // expo-video player hook
    const player = useVideoPlayer(videoUrl || null, (player) => {
        if (videoUrl) {
            player.loop = true;
            player.muted = true;
            player.play();
        }
    });

    const toggleMute = () => {
        if (player) {
            player.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.95}
        >
            {/* Background Video or Image */}
            {videoUrl && player ? (
                <VideoView
                    player={player}
                    style={styles.media}
                    contentFit="cover"
                    nativeControls={false}
                />
            ) : imageUrl ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.media}
                    resizeMode="cover"
                />
            ) : (
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.media}
                />
            )}

            {/* Overlay Gradient */}
            <LinearGradient
                colors={['transparent', overlayColor]}
                style={styles.overlay}
            />

            {/* Content */}
            <View style={styles.content}>
                {/* Badge */}
                {activeBadge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{activeBadge}</Text>
                    </View>
                )}

                {/* Title */}
                <Text style={styles.title}>{activeTitle}</Text>

                {/* Subtitle */}
                {activeSubtitle && (
                    <Text style={styles.subtitle}>{activeSubtitle}</Text>
                )}

                {/* Shop Now Button */}
                <TouchableOpacity style={styles.button} onPress={onPress}>
                    <Text style={styles.buttonText}>{activeButtonText}</Text>
                </TouchableOpacity>
            </View>

            {/* Video Controls */}
            {videoUrl && player && (
                <View style={styles.videoControls}>
                    {/* Play Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar} />
                    </View>

                    {/* Mute Toggle */}
                    <TouchableOpacity
                        style={styles.muteBtn}
                        onPress={toggleMute}
                    >
                        <Ionicons
                            name={isMuted ? 'volume-mute' : 'volume-high'}
                            size={18}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: BANNER_HEIGHT,
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
    },
    media: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.lg,
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: SPACING.md,
        paddingVertical: 4,
        borderRadius: RADIUS.xl,
        marginBottom: SPACING.sm,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.xl,
        marginTop: SPACING.md,
    },
    buttonText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    videoControls: {
        position: 'absolute',
        bottom: SPACING.md,
        left: SPACING.md,
        right: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressContainer: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginRight: SPACING.sm,
    },
    progressBar: {
        width: '50%',
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    muteBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
