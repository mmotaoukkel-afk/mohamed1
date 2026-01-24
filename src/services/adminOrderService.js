/**
 * Admin Order Service - Kataraa
 * Service for managing orders
 * 🔐 Admin only
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const ORDERS_COLLECTION = 'orders';

// Order status workflow
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
};

// Status configuration with colors and labels
export const ORDER_STATUS_CONFIG = {
    pending: {
        label: 'في الانتظار',
        color: '#F59E0B',
        icon: 'time-outline',
        nextStatus: 'confirmed',
        canCancel: true,
    },
    confirmed: {
        label: 'مؤكد',
        color: '#3B82F6',
        icon: 'checkmark-circle-outline',
        nextStatus: 'processing',
        canCancel: true,
    },
    processing: {
        label: 'قيد التجهيز',
        color: '#8B5CF6',
        icon: 'cube-outline',
        nextStatus: 'shipped',
        canCancel: true,
    },
    shipped: {
        label: 'تم الشحن',
        color: '#0EA5E9',
        icon: 'airplane-outline',
        nextStatus: 'out_for_delivery',
        canCancel: false,
    },
    out_for_delivery: {
        label: 'جارٍ التوصيل',
        color: '#14B8A6',
        icon: 'car-outline',
        nextStatus: 'delivered',
        canCancel: false,
    },
    delivered: {
        label: 'تم التوصيل',
        color: '#10B981',
        icon: 'checkmark-done-circle',
        nextStatus: null,
        canCancel: false,
    },
    cancelled: {
        label: 'ملغي',
        color: '#EF4444',
        icon: 'close-circle-outline',
        nextStatus: null,
        canCancel: false,
    },
    refunded: {
        label: 'مسترجع',
        color: '#6B7280',
        icon: 'refresh-circle-outline',
        nextStatus: null,
        canCancel: false,
    },
};

// Moroccan cities for distribution
export const MOROCCAN_CITIES = [
    { id: 'casablanca', name: 'الدار البيضاء', region: 'وسط' },
    { id: 'rabat', name: 'الرباط', region: 'وسط' },
    { id: 'marrakech', name: 'مراكش', region: 'جنوب' },
    { id: 'fes', name: 'فاس', region: 'شمال' },
    { id: 'tangier', name: 'طنجة', region: 'شمال' },
    { id: 'agadir', name: 'أكادير', region: 'جنوب' },
    { id: 'meknes', name: 'مكناس', region: 'وسط' },
    { id: 'oujda', name: 'وجدة', region: 'شرق' },
    { id: 'kenitra', name: 'القنيطرة', region: 'وسط' },
    { id: 'tetouan', name: 'تطوان', region: 'شمال' },
];

/**
 * Get all orders with optional filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
export const getAllOrders = async (options = {}) => {
    try {
        const { status, startDate, endDate, limitCount = 50 } = options;

        let q = collection(db, ORDERS_COLLECTION);
        const constraints = [];

        if (status && status !== 'all') {
            constraints.push(where('status', '==', status));
        }

        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(limitCount));

        q = query(q, ...constraints);
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

/**
 * Get order by ID
 * @param {string} orderId
 * @returns {Promise<Object|null>}
 */
export const getOrderById = async (orderId) => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
};

/**
 * Update order status
 * @param {string} orderId
 * @param {string} newStatus
 * @param {string} note - Optional note
 * @returns {Promise<Object>}
 */
export const updateOrderStatus = async (orderId, newStatus, note = '') => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        const order = await getOrderById(orderId);

        if (!order) throw new Error('Order not found');

        // Add to status history
        const statusHistory = order.statusHistory || [];
        statusHistory.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            note,
        });

        await updateDoc(docRef, {
            status: newStatus,
            statusHistory,
            updatedAt: serverTimestamp(),
        });

        return { id: orderId, status: newStatus, statusHistory };
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

/**
 * Cancel order
 * @param {string} orderId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
export const cancelOrder = async (orderId, reason = '') => {
    const order = await getOrderById(orderId);
    const config = ORDER_STATUS_CONFIG[order?.status];

    if (!config?.canCancel) {
        throw new Error('لا يمكن إلغاء هذا الطلب في حالته الحالية');
    }

    return updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, reason);
};

/**
 * Get orders by city - DYNAMIC from real orders
 * @returns {Promise<Array>} - City distribution from actual order data
 */
export const getOrdersByCity = async () => {
    try {
        const orders = await getAllOrders({ limitCount: 500 });

        // Dynamically build city stats from actual orders
        const cityStats = {};

        orders.forEach(order => {
            // Get city from shipping address - handle different formats
            let cityName = order.shippingAddress?.city
                || order.shipping?.city
                || order.address?.city
                || 'غير محدد';

            // Normalize city name
            cityName = cityName.trim();
            const cityKey = cityName.toLowerCase();

            if (!cityStats[cityKey]) {
                cityStats[cityKey] = {
                    id: cityKey,
                    name: cityName,
                    count: 0,
                    revenue: 0
                };
            }

            cityStats[cityKey].count++;
            cityStats[cityKey].revenue += order.total || 0;
        });

        // Sort by count descending and return top cities
        return Object.values(cityStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    } catch (error) {
        console.error('Error getting city stats:', error);
        return [];
    }
};

/**
 * Get daily performance stats
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Array>}
 */
export const getDailyPerformance = async (days = 7) => {
    try {
        const orders = await getAllOrders({ limitCount: 500 });

        const ARABIC_DAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

        const dailyStats = {};
        const today = new Date();

        // Initialize days with Arabic day names
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const dayName = ARABIC_DAYS[date.getDay()];

            dailyStats[dateKey] = {
                date: dateKey,
                day: dayName,
                orders: 0,
                revenue: 0,
                delivered: 0,
                cancelled: 0,
            };
        }

        orders.forEach(order => {
            let orderDate;
            if (order.createdAt?.toDate) {
                orderDate = order.createdAt.toDate();
            } else if (order.createdAt) {
                orderDate = new Date(order.createdAt);
            } else {
                return;
            }

            const dateKey = orderDate.toISOString().split('T')[0];

            if (dailyStats[dateKey]) {
                dailyStats[dateKey].orders++;
                dailyStats[dateKey].revenue += order.total || 0;

                if (order.status === ORDER_STATUS.DELIVERED) {
                    dailyStats[dateKey].delivered++;
                }
                if (order.status === ORDER_STATUS.CANCELLED) {
                    dailyStats[dateKey].cancelled++;
                }
            }
        });

        return Object.values(dailyStats);
    } catch (error) {
        console.error('Error getting daily performance:', error);
        return [];
    }
};

/**
 * Get order stats summary
 * @returns {Promise<Object>}
 */
export const getOrderStats = async () => {
    try {
        const orders = await getAllOrders({ limitCount: 1000 });

        const stats = {
            total: orders.length,
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            totalRevenue: 0,
            todayOrders: 0,
            todayRevenue: 0,
        };

        const today = new Date().toISOString().split('T')[0];

        orders.forEach(order => {
            stats[order.status] = (stats[order.status] || 0) + 1;
            stats.totalRevenue += order.total || 0;

            const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
            if (orderDate.toISOString().split('T')[0] === today) {
                stats.todayOrders++;
                stats.todayRevenue += order.total || 0;
            }
        });

        return stats;
    } catch (error) {
        console.error('Error getting order stats:', error);
        throw error;
    }
};

/**
 * Format order ID for display
 * @param {string} id
 * @returns {string}
 */
export const formatOrderId = (id) => {
    if (!id) return '';
    return `ORD-${id.substring(0, 6).toUpperCase()}`;
};

/**
 * Get status flow steps
 * @param {string} currentStatus
 * @returns {Array}
 */
export const getStatusFlow = (currentStatus) => {
    const flow = [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.OUT_FOR_DELIVERY,
        ORDER_STATUS.DELIVERED,
    ];

    const currentIndex = flow.indexOf(currentStatus);

    return flow.map((status, index) => ({
        status,
        ...ORDER_STATUS_CONFIG[status],
        isCompleted: index < currentIndex,
        isCurrent: index === currentIndex,
        isUpcoming: index > currentIndex,
    }));
};
