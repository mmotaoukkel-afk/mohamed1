/**
 * Activity Log Service - Kataraa
 * 📋 Tracks all admin operations for audit trail
 * 
 * SAFE: All log calls are wrapped in try/catch.
 * If logging fails, the original operation is NOT affected.
 */

import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

const LOGS_COLLECTION = 'adminLogs';

// Action types for categorization
export const LOG_ACTIONS = {
    // Products
    PRODUCT_CREATED: 'product_created',
    PRODUCT_UPDATED: 'product_updated',
    PRODUCT_DELETED: 'product_deleted',
    PRODUCT_STOCK_UPDATED: 'product_stock_updated',

    // Orders
    ORDER_STATUS_UPDATED: 'order_status_updated',
    ORDER_CANCELLED: 'order_cancelled',
    ORDER_NOTES_UPDATED: 'order_notes_updated',

    // Discounts
    COUPON_CREATED: 'coupon_created',
    COUPON_TOGGLED: 'coupon_toggled',
    COUPON_DELETED: 'coupon_deleted',

    // Shipping
    SHIPPING_ZONE_ADDED: 'shipping_zone_added',
    SHIPPING_ZONE_UPDATED: 'shipping_zone_updated',
    SHIPPING_ZONE_DELETED: 'shipping_zone_deleted',
    SHIPPING_ZONE_TOGGLED: 'shipping_zone_toggled',

    // Settings
    SETTINGS_UPDATED: 'settings_updated',

    // Users
    USER_ROLE_CHANGED: 'user_role_changed',
};

// Human-readable labels (Arabic)
export const LOG_ACTION_LABELS = {
    [LOG_ACTIONS.PRODUCT_CREATED]: 'إضافة منتج',
    [LOG_ACTIONS.PRODUCT_UPDATED]: 'تعديل منتج',
    [LOG_ACTIONS.PRODUCT_DELETED]: 'حذف منتج',
    [LOG_ACTIONS.PRODUCT_STOCK_UPDATED]: 'تحديث المخزون',
    [LOG_ACTIONS.ORDER_STATUS_UPDATED]: 'تغيير حالة طلب',
    [LOG_ACTIONS.ORDER_CANCELLED]: 'إلغاء طلب',
    [LOG_ACTIONS.ORDER_NOTES_UPDATED]: 'تحديث ملاحظات طلب',
    [LOG_ACTIONS.COUPON_CREATED]: 'إنشاء كوبون',
    [LOG_ACTIONS.COUPON_TOGGLED]: 'تغيير حالة كوبون',
    [LOG_ACTIONS.COUPON_DELETED]: 'حذف كوبون',
    [LOG_ACTIONS.SHIPPING_ZONE_ADDED]: 'إضافة منطقة شحن',
    [LOG_ACTIONS.SHIPPING_ZONE_UPDATED]: 'تعديل منطقة شحن',
    [LOG_ACTIONS.SHIPPING_ZONE_DELETED]: 'حذف منطقة شحن',
    [LOG_ACTIONS.SHIPPING_ZONE_TOGGLED]: 'تغيير حالة منطقة شحن',
    [LOG_ACTIONS.SETTINGS_UPDATED]: 'تعديل الإعدادات',
    [LOG_ACTIONS.USER_ROLE_CHANGED]: 'تغيير صلاحية مستخدم',
};

// Icons for each action category
export const LOG_ACTION_ICONS = {
    product_created: { icon: 'add-circle', color: '#10B981' },
    product_updated: { icon: 'create', color: '#3B82F6' },
    product_deleted: { icon: 'trash', color: '#EF4444' },
    product_stock_updated: { icon: 'cube', color: '#F59E0B' },
    order_status_updated: { icon: 'swap-horizontal', color: '#8B5CF6' },
    order_cancelled: { icon: 'close-circle', color: '#EF4444' },
    order_notes_updated: { icon: 'document-text', color: '#06B6D4' },
    coupon_created: { icon: 'pricetag', color: '#10B981' },
    coupon_toggled: { icon: 'toggle', color: '#F59E0B' },
    coupon_deleted: { icon: 'trash', color: '#EF4444' },
    shipping_zone_added: { icon: 'location', color: '#10B981' },
    shipping_zone_updated: { icon: 'location', color: '#3B82F6' },
    shipping_zone_deleted: { icon: 'location', color: '#EF4444' },
    shipping_zone_toggled: { icon: 'toggle', color: '#F59E0B' },
    settings_updated: { icon: 'settings', color: '#64748B' },
    user_role_changed: { icon: 'person', color: '#8B5CF6' },
};

/**
 * Log an admin activity
 * 🛡️ SAFE: Never throws — failures are silently logged to console
 * 
 * @param {string} action - One of LOG_ACTIONS
 * @param {Object} details - Additional context (e.g. { productName, productId })
 */
export const logAdminActivity = async (action, details = {}) => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.warn('⚠️ Activity Log: No authenticated user, skipping log');
            return;
        }

        await addDoc(collection(db, LOGS_COLLECTION), {
            action,
            details,
            uid: currentUser.uid,
            email: currentUser.email || 'unknown',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin',
            timestamp: serverTimestamp(),
        });

        console.log(`📋 Activity logged: ${action}`);
    } catch (error) {
        // NEVER throw — logging failure must not break the original operation
        console.warn('⚠️ Activity log failed (non-critical):', error.message);
    }
};

/**
 * Get recent activity logs
 * @param {Object} options
 * @param {number} options.limitCount - Max logs to fetch (default 50)
 * @param {string} options.actionFilter - Filter by action type
 * @returns {Promise<Array>}
 */
export const getActivityLogs = async (options = {}) => {
    try {
        const { limitCount = 50, actionFilter } = options;
        
        const constraints = [];

        if (actionFilter && actionFilter !== 'all') {
            constraints.push(where('action', '==', actionFilter));
        }

        constraints.push(orderBy('timestamp', 'desc'));
        constraints.push(limit(limitCount));

        const q = query(collection(db, LOGS_COLLECTION), ...constraints);
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamp to JS Date for display
            timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        }));
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return [];
    }
};

/**
 * Get activity log categories with counts
 * @returns {Promise<Object>}
 */
export const getLogStats = async () => {
    try {
        const logs = await getActivityLogs({ limitCount: 200 });

        const stats = {
            total: logs.length,
            today: 0,
            byAction: {},
        };

        const today = new Date().toISOString().split('T')[0];

        logs.forEach(log => {
            // Count by action
            stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

            // Count today
            if (log.timestamp instanceof Date) {
                const logDate = log.timestamp.toISOString().split('T')[0];
                if (logDate === today) stats.today++;
            }
        });

        return stats;
    } catch (error) {
        console.error('Error fetching log stats:', error);
        return { total: 0, today: 0, byAction: {} };
    }
};
