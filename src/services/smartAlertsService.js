/**
 * Smart Alerts Service - Kataraa
 * تنبيهات ذكية للداشبورد
 * 🔐 Admin only
 */

import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    getCountFromServer,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Get Smart Alerts for Dashboard
 * Returns prioritized alerts based on business health
 */
export const getSmartAlerts = async () => {
    try {
        const alerts = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Check Pending Orders (High Priority)
        const pendingQuery = query(
            collection(db, 'orders'),
            where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingCount = pendingSnapshot.size;

        if (pendingCount > 0) {
            alerts.push({
                id: 'pending_orders',
                type: pendingCount >= 5 ? 'critical' : 'warning',
                icon: '⏳',
                title: `${pendingCount} طلبات معلّقة`,
                message: pendingCount >= 5
                    ? 'عندك طلبات كثيرة بحاجة معالجة فورية!'
                    : 'طلبات جديدة بانتظار التأكيد',
                action: '/admin/orders',
                actionLabel: 'عرض الطلبات',
                color: pendingCount >= 5 ? '#EF4444' : '#F59E0B',
            });
        }

        // 2. Check Today's Orders
        const todayOrdersQuery = query(
            collection(db, 'orders'),
            where('createdAt', '>=', today),
            orderBy('createdAt', 'desc')
        );
        const todaySnapshot = await getDocs(todayOrdersQuery);
        const todayOrders = todaySnapshot.size;

        // Calculate today's revenue
        let todayRevenue = 0;
        todaySnapshot.docs.forEach(doc => {
            todayRevenue += parseFloat(doc.data().total || 0);
        });

        if (todayOrders > 0) {
            alerts.push({
                id: 'today_orders',
                type: 'success',
                icon: '🎉',
                title: `${todayOrders} طلبات اليوم`,
                message: `إيرادات اليوم: ${todayRevenue.toFixed(2)} د.ك`,
                action: '/admin/orders',
                actionLabel: 'التفاصيل',
                color: '#10B981',
            });
        }

        // 3. Check Low Stock Products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        let lowStockCount = 0;
        let outOfStockCount = 0;

        productsSnapshot.docs.forEach(doc => {
            const stock = doc.data().stock || doc.data().quantity || 0;
            if (stock === 0) outOfStockCount++;
            else if (stock <= 5) lowStockCount++;
        });

        if (outOfStockCount > 0) {
            alerts.push({
                id: 'out_of_stock',
                type: 'critical',
                icon: '❌',
                title: `${outOfStockCount} منتجات نفذت`,
                message: 'منتجات غير متوفرة تحتاج إعادة تخزين',
                action: '/admin/products',
                actionLabel: 'إدارة المخزون',
                color: '#EF4444',
            });
        } else if (lowStockCount > 0) {
            alerts.push({
                id: 'low_stock',
                type: 'warning',
                icon: '📦',
                title: `${lowStockCount} منتجات مخزونها منخفض`,
                message: 'أقل من 5 وحدات متبقية',
                action: '/admin/products',
                actionLabel: 'عرض المنتجات',
                color: '#F59E0B',
            });
        }

        // 4. Check New Customers Today
        const newUsersQuery = query(
            collection(db, 'users'),
            where('createdAt', '>=', today)
        );
        const newUsersSnapshot = await getDocs(newUsersQuery);
        const newCustomers = newUsersSnapshot.size;

        if (newCustomers > 0) {
            alerts.push({
                id: 'new_customers',
                type: 'info',
                icon: '👤',
                title: `${newCustomers} عملاء جدد`,
                message: 'تسجيلات جديدة اليوم',
                action: '/admin/customers',
                actionLabel: 'عرض العملاء',
                color: '#6366F1',
            });
        }

        // 5. Check Cancelled Orders (Last 7 days)
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const cancelledQuery = query(
                collection(db, 'orders'),
                where('status', '==', 'cancelled'),
                where('createdAt', '>=', weekAgo)
            );
            const cancelledSnapshot = await getDocs(cancelledQuery);
            const cancelledCount = cancelledSnapshot.size;

            if (cancelledCount >= 3) {
                alerts.push({
                    id: 'cancelled_orders',
                    type: 'warning',
                    icon: '⚠️',
                    title: `${cancelledCount} طلبات ملغية`,
                    message: 'خلال آخر 7 أيام - راجع الأسباب',
                    action: '/admin/orders',
                    actionLabel: 'مراجعة',
                    color: '#F59E0B',
                });
            }
        } catch (err) {
            console.warn('Skipping cancelled orders check (Index missing):', err.message);
        }

        // Sort by priority: critical > warning > info > success
        const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
        alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

        return alerts;
    } catch (error) {
        console.error('Error fetching smart alerts:', error);
        return [];
    }
};

/**
 * Get Critical Alert Count (for badge)
 */
export const getCriticalAlertCount = async () => {
    try {
        const alerts = await getSmartAlerts();
        return alerts.filter(a => a.type === 'critical' || a.type === 'warning').length;
    } catch (error) {
        console.error('Error getting alert count:', error);
        return 0;
    }
};
