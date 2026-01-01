/**
 * Search Header Component - Kataraa
 * Cosmic Luxury Minimal Style
 * Dark Mode Supported 🌙
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../utils/storage';
import { useRouter } from 'expo-router';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from '../hooks/useTranslation';
import { IconButton, Input, Text } from './ui'; // Import from UI Kit

export default function SearchHeader({
    onSearch,
    onCartPress,
    onMenuPress,
    onNotificationPress,
    cartCount = 0,
    notificationCount = 2,
    showSearch = false,
    title = 'KATARAA',
    placeholder = null,
}) {
    const { tokens, isDark } = useTheme();
    const { user } = useAuth();
    const { unreadCount } = useNotifications();
    const { t } = useTranslation();
    const router = useRouter();
    const styles = getStyles(tokens, isDark);
    const [searchQuery, setSearchQuery] = useState('');
    const [profileImage, setProfileImage] = useState(null);

    const activePlaceholder = placeholder || t('searchPlaceholder');

    useEffect(() => {
        const loadProfileImage = async () => {
            if (!user) {
                setProfileImage(null);
                return;
            }
            try {
                const userImageKey = `profile_image_${user.id}`;
                const savedUri = await storage.getItem(userImageKey);
                if (savedUri) {
                    setProfileImage(savedUri);
                } else if (user?.photoURL) {
                    setProfileImage(user.photoURL);
                }
            } catch (error) {
                console.error('Error loading profile image:', error);
            }
        };
        loadProfileImage();
    }, [user]);

    const handleSearch = () => {
        onSearch?.(searchQuery);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    {/* Left Icons */}
                    <View style={styles.leftIcons}>
                        <IconButton
                            icon="search"
                            size="md"
                            variant="ghost"
                            onPress={() => router.push('/search')}
                        />
                        <IconButton
                            icon="mic"
                            size="md"
                            variant="ghost"
                            onPress={() => router.push('/voice-search')}
                        />
                    </View>

                    {/* Logo */}
                    <Image
                        source={require('../../assets/images/logo_premium.jpg')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />

                    {/* Right Side Actions */}
                    <View style={styles.rightActions}>
                        <IconButton
                            icon="notifications-outline"
                            size="md"
                            variant="ghost"
                            onPress={onNotificationPress}
                            badge={unreadCount > 0 ? unreadCount : undefined}
                        />

                        {/* Profile Avatar */}
                        <TouchableOpacity
                            style={styles.profileBtn}
                            onPress={onMenuPress}
                            activeOpacity={0.8}
                        >
                            {profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text variant="label" style={{ color: tokens.colors.primary }}>
                                        {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar - only shown if showSearch prop is true */}
                {showSearch && (
                    <View style={styles.searchContainer}>
                        <Input
                            variant="search"
                            placeholder={activePlaceholder}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                            size="md"
                            style={{ flex: 1 }}
                        />
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const getStyles = (tokens, isDark) => StyleSheet.create({
    container: {
        backgroundColor: tokens.colors.background,
        paddingBottom: tokens.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'transparent' : tokens.colors.borderLight,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.sm,
        height: 56,
    },
    leftIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing.xs,
        width: 80, // Fixed width for center alignment of logo
    },
    logoImage: {
        width: 110,
        height: 48,
        // tintColor removed - maintaining original logo colors
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing.xs,
        width: 80, // Fixed width for balance
        justifyContent: 'flex-end',
    },
    profileBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: tokens.colors.border,
        overflow: 'hidden',
        marginLeft: 4,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: tokens.colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: tokens.spacing.md,
        marginTop: tokens.spacing.sm,
    },
});
