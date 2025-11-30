import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PremiumBackground from '../components/PremiumBackground';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const NotificationsScreen = () => {
    const router = useRouter();

    const notifications = [
        {
            id: '1',
            title: 'Order Shipped!',
            message: 'Your order #ORD-9823 has been shipped and is on its way.',
            time: '2 hours ago',
            type: 'order',
            read: false,
        },
        {
            id: '2',
            title: 'New Arrival Alert',
            message: 'Check out the new Summer Collection now available in store.',
            time: '5 hours ago',
            type: 'promo',
            read: true,
        },
        {
            id: '3',
            title: 'Flash Sale! ⚡',
            message: 'Get 50% off on all hoodies for the next 24 hours.',
            time: '1 day ago',
            type: 'sale',
            read: true,
        },
        {
            id: '4',
            title: 'Account Security',
            message: 'Your password was successfully updated.',
            time: '2 days ago',
            type: 'security',
            read: true,
        },
    ];

    const getIcon = (type) => {
        switch (type) {
            case 'order': return 'cube-outline';
            case 'promo': return 'star-outline';
            case 'sale': return 'flash-outline';
            case 'security': return 'shield-checkmark-outline';
            default: return 'notifications-outline';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'order': return '#667eea';
            case 'promo': return '#FFD700';
            case 'sale': return '#FF6B6B';
            case 'security': return '#4CAF50';
            default: return '#fff';
        }
    };

    const renderNotification = ({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity style={[styles.notificationCard, !item.read && styles.unreadCard]}>
                <View style={[styles.iconContainer, { backgroundColor: `${getColor(item.type)}20` }]}>
                    <Ionicons name={getIcon(item.type)} size={24} color={getColor(item.type)} />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.time}>{item.time}</Text>
                    </View>
                    <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <PremiumBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity style={styles.clearButton}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={60} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    clearButton: {
        padding: 8,
    },
    clearText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    unreadCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    time: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    message: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 16,
        marginTop: 16,
    },
});

export default NotificationsScreen;
