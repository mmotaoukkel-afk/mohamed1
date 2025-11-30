import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumBackground from '../../components/PremiumBackground';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const OrderTrackingScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [currentStep, setCurrentStep] = useState(2); // 0: Placed, 1: Processing, 2: Shipped, 3: Delivered

    // Mock Data based on params or default
    const order = {
        id: params.id || '#ORD-9823',
        date: params.date || '2023-11-25',
        total: params.price || '$129.99',
        items: [
            { id: 1, name: params.name || 'Premium T-Shirt', price: '$45.00', qty: 1, image: params.img },
            { id: 2, name: 'Designer Cap', price: '$25.00', qty: 1, image: 'https://via.placeholder.com/150' }
        ],
        status: 'Shipped',
        trackingNumber: 'TRK-88293829'
    };

    const steps = [
        { title: 'Order Placed', date: 'Nov 25, 10:30 AM', icon: 'receipt-outline' },
        { title: 'Processing', date: 'Nov 25, 02:00 PM', icon: 'cube-outline' },
        { title: 'Shipped', date: 'Nov 26, 09:15 AM', icon: 'airplane-outline' },
        { title: 'Delivered', date: 'Expected Nov 28', icon: 'home-outline' },
    ];

    return (
        <PremiumBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Track Order</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Order Summary Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
                    <View style={styles.orderHeader}>
                        <View>
                            <Text style={styles.orderId}>Order {order.id}</Text>
                            <Text style={styles.orderDate}>{order.date}</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{order.status}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Tracking Number</Text>
                        <Text style={styles.value}>{order.trackingNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Amount</Text>
                        <Text style={styles.totalPrice}>{order.total}</Text>
                    </View>
                </Animated.View>

                {/* Tracking Timeline */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.timelineContainer}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    <View style={styles.timeline}>
                        {steps.map((step, index) => {
                            const isActive = index <= currentStep;
                            const isLast = index === steps.length - 1;

                            return (
                                <View key={index} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineIcon, isActive && styles.timelineIconActive]}>
                                            <Ionicons name={step.icon} size={20} color={isActive ? '#fff' : 'rgba(255,255,255,0.3)'} />
                                        </View>
                                        {!isLast && (
                                            <View style={[styles.timelineLine, isActive && index < currentStep && styles.timelineLineActive]} />
                                        )}
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}</Text>
                                        <Text style={styles.stepDate}>{step.date}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Items List */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.itemsContainer}>
                    <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
                    {order.items.map((item, index) => (
                        <View key={index} style={styles.itemCard}>
                            <Image
                                source={item.image ? { uri: item.image } : { uri: 'https://via.placeholder.com/150' }}
                                style={styles.itemImage}
                            />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>Qty: {item.qty}</Text>
                                <Text style={styles.itemPrice}>{item.price}</Text>
                            </View>
                        </View>
                    ))}
                </Animated.View>

                {/* Action Buttons */}
                <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
                    <TouchableOpacity style={styles.outlineButton}>
                        <Text style={styles.outlineButtonText}>Report Issue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>Confirm Delivery</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
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
    card: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    orderId: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
    statusBadge: {
        backgroundColor: '#667eea',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    value: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    totalPrice: {
        color: '#667eea',
        fontSize: 18,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 15,
    },
    timelineContainer: {
        marginBottom: 30,
    },
    timeline: {
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 15,
        width: 30,
    },
    timelineIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        zIndex: 1,
    },
    timelineIconActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    timelineLine: {
        width: 2,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 4,
    },
    timelineLineActive: {
        backgroundColor: '#667eea',
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 30,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 4,
    },
    stepTitleActive: {
        color: '#fff',
    },
    stepDate: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    itemsContainer: {
        marginBottom: 100,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
        alignItems: 'center',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 15,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    itemQty: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#667eea',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        gap: 15,
    },
    outlineButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#fff',
        alignItems: 'center',
    },
    outlineButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    primaryButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        backgroundColor: '#667eea',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default OrderTrackingScreen;
