import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCheckout } from '../../../src/context/CheckoutContext';
import PremiumBackground from '../../components/PremiumBackground';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const OrderHistoryScreen = () => {
    const router = useRouter();
    const { orders } = useCheckout();

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return '#4CAF50';
            case 'shipped':
                return '#2196F3';
            case 'pending':
                return '#FF9800';
            case 'cancelled':
                return '#F44336';
            default:
                return '#9E9E9E';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'delivered':
                return 'Delivered';
            case 'shipped':
                return 'Shipped';
            case 'pending':
                return 'Pending';
            case 'cancelled':
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    };

    const renderOrderItem = ({ item, index }) => {
        const statusColor = getStatusColor(item.status);
        const orderDate = new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.orderCard}
            >
                <TouchableOpacity
                    onPress={() => router.push({
                        pathname: '/screens/orders/OrderTrackingScreen',
                        params: {
                            id: item.orderNumber,
                            status: item.status
                        }
                    })}
                    activeOpacity={0.7}
                >
                    {/* Order Header */}
                    <View style={styles.orderHeader}>
                        <View style={styles.orderHeaderLeft}>
                            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                            <Text style={styles.orderDate}>{orderDate}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '30' }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>
                    </View>

                    {/* Order Items Preview */}
                    <View style={styles.itemsPreview}>
                        {item.items && item.items.slice(0, 3).map((product, idx) => (
                            <Image
                                key={idx}
                                source={{ uri: product.image }}
                                style={[
                                    styles.itemImage,
                                    idx > 0 && { marginLeft: -15 }
                                ]}
                            />
                        ))}
                        {item.items && item.items.length > 3 && (
                            <View style={styles.moreItemsBadge}>
                                <Text style={styles.moreItemsText}>
                                    +{item.items.length - 3}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Order Footer */}
                    <View style={styles.orderFooter}>
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${item.total?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <TouchableOpacity style={styles.trackButton}>
                            <Text style={styles.trackButtonText}>Track Order</Text>
                            <Ionicons name="arrow-forward" size={18} color="#667eea" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
                Start shopping to see your order history here
            </Text>
            <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/(tabs)')}
            >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order History</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Stats */}
                {orders.length > 0 && (
                    <Animated.View
                        entering={FadeInDown.springify()}
                        style={styles.statsContainer}
                    >
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{orders.length}</Text>
                            <Text style={styles.statLabel}>Total Orders</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {orders.filter(o => o.status === 'delivered').length}
                            </Text>
                            <Text style={styles.statLabel}>Delivered</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {orders.filter(o => o.status === 'pending' || o.status === 'shipped').length}
                            </Text>
                            <Text style={styles.statLabel}>In Progress</Text>
                        </View>
                    </Animated.View>
                )}

                {/* Orders List */}
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.orderNumber}
                    contentContainerStyle={[
                        styles.listContent,
                        orders.length === 0 && styles.listContentEmpty
                    ]}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    orderCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderHeaderLeft: {},
    orderNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    itemsPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    moreItemsBadge: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(102,126,234,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -15,
        borderWidth: 2,
        borderColor: 'rgba(102,126,234,0.5)',
    },
    moreItemsText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    totalContainer: {},
    totalLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#667eea',
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(102,126,234,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    trackButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginTop: 24,
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 32,
    },
    shopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#667eea',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    shopButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default OrderHistoryScreen;
