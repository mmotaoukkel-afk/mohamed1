/**
 * Admin Customer Service - Kataraa
 * Service for customer intelligence and management
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
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const CUSTOMERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';

// Customer segments
export const CUSTOMER_SEGMENTS = {
    NEW: 'new',
    RETURNING: 'returning',
    VIP: 'vip',
    AT_RISK: 'at_risk',
    INACTIVE: 'inactive',
};

// Segment configuration
export const SEGMENT_CONFIG = {
    new: {
        label: 'جديد',
        color: '#3B82F6',
        icon: 'person-add',
        description: 'زبون جديد (أقل من طلبين)',
    },
    returning: {
        label: 'عائد',
        color: '#10B981',
        icon: 'refresh',
        description: 'زبون عائد (2-4 طلبات)',
    },
    vip: {
        label: 'VIP',
        color: '#F59E0B',
        icon: 'star',
        description: 'زبون مميز (5+ طلبات أو 2000+ MAD)',
    },
    at_risk: {
        label: 'في خطر',
        color: '#EF4444',
        icon: 'warning',
        description: 'لم يشترِ منذ 60+ يوم',
    },
    inactive: {
        label: 'غير نشط',
        color: '#6B7280',
        icon: 'time',
        description: 'لم يشترِ منذ 90+ يوم',
    },
};

// Customer scoring weights
const SCORING_WEIGHTS = {
    orderCount: 10,      // Points per order
    totalSpent: 0.01,    // Points per MAD spent
    recency: 20,         // Points for recent activity
    avgOrderValue: 0.05, // Points per MAD avg order
};

/**
 * Calculate customer segment based on behavior
 * @param {Object} customer
 * @returns {string}
 */
export const calculateSegment = (customer) => {
    const { orderCount = 0, totalSpent = 0, lastOrderDate } = customer;

    // Check activity
    const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

    if (daysSinceLastOrder > 90) return CUSTOMER_SEGMENTS.INACTIVE;
    if (daysSinceLastOrder > 60) return CUSTOMER_SEGMENTS.AT_RISK;

    // Check VIP status
    if (orderCount >= 5 || totalSpent >= 2000) return CUSTOMER_SEGMENTS.VIP;

    // Check returning
    if (orderCount >= 2) return CUSTOMER_SEGMENTS.RETURNING;

    return CUSTOMER_SEGMENTS.NEW;
};

/**
 * Calculate customer score (0-100)
 * @param {Object} customer
 * @returns {number}
 */
export const calculateCustomerScore = (customer) => {
    const { orderCount = 0, totalSpent = 0, lastOrderDate, avgOrderValue = 0 } = customer;

    let score = 0;

    // Order count score
    score += Math.min(orderCount * SCORING_WEIGHTS.orderCount, 30);

    // Total spent score
    score += Math.min(totalSpent * SCORING_WEIGHTS.totalSpent, 30);

    // Recency score
    const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

    if (daysSinceLastOrder < 7) score += SCORING_WEIGHTS.recency;
    else if (daysSinceLastOrder < 30) score += SCORING_WEIGHTS.recency * 0.7;
    else if (daysSinceLastOrder < 60) score += SCORING_WEIGHTS.recency * 0.3;

    // Average order value score
    score += Math.min(avgOrderValue * SCORING_WEIGHTS.avgOrderValue, 20);

    return Math.round(Math.min(score, 100));
};

/**
 * Get AI product recommendations for customer
 * @param {Object} customer
 * @param {Array} allProducts
 * @returns {Array}
 */
export const getAIRecommendations = (customer, allProducts = []) => {
    const { purchaseHistory = [], preferredCategories = [] } = customer;

    // Get purchased product IDs
    const purchasedIds = new Set(purchaseHistory.map(p => p.productId));

    // Filter unpurchased products
    let recommendations = allProducts.filter(p => !purchasedIds.has(p.id));

    // Prioritize by preferred categories
    if (preferredCategories.length > 0) {
        recommendations.sort((a, b) => {
            const aInPref = preferredCategories.includes(a.category) ? 1 : 0;
            const bInPref = preferredCategories.includes(b.category) ? 1 : 0;
            return bInPref - aInPref;
        });
    }

    // Add recommendation reasons
    return recommendations.slice(0, 5).map(product => ({
        ...product,
        reason: getRecommendationReason(product, customer),
    }));
};

/**
 * Get recommendation reason text
 * @param {Object} product
 * @param {Object} customer
 * @returns {string}
 */
const getRecommendationReason = (product, customer) => {
    const { preferredCategories = [], purchaseHistory = [] } = customer;

    if (preferredCategories.includes(product.category)) {
        return 'بناءً على مشترياتك السابقة';
    }

    if (product.isPopular) {
        return 'الأكثر مبيعاً';
    }

    if (product.isNew) {
        return 'منتج جديد';
    }

    return 'قد يعجبك';
};

/**
 * Get all customers with enriched data
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export const getAllCustomers = async (options = {}) => {
    try {
        const { segment, orderByField = 'createdAt', limitCount = 50 } = options;

        let q = collection(db, CUSTOMERS_COLLECTION);
        const constraints = [];

        constraints.push(orderBy(orderByField, 'desc'));
        constraints.push(limit(limitCount));

        q = query(q, ...constraints);
        const snapshot = await getDocs(q);

        const customers = snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            return {
                ...data,
                segment: calculateSegment(data),
                score: calculateCustomerScore(data),
            };
        });

        // Filter by segment if specified
        if (segment && segment !== 'all') {
            return customers.filter(c => c.segment === segment);
        }

        return customers;
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
};

/**
 * Get customer by ID with full profile
 * @param {string} customerId
 * @returns {Promise<Object|null>}
 */
export const getCustomerById = async (customerId) => {
    try {
        const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            return {
                ...data,
                segment: calculateSegment(data),
                score: calculateCustomerScore(data),
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching customer:', error);
        throw error;
    }
};

/**
 * Get customer's purchase history
 * @param {string} customerId
 * @returns {Promise<Array>}
 */
export const getCustomerPurchaseHistory = async (customerId) => {
    try {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('customerId', '==', customerId),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        throw error;
    }
};

/**
 * Get customer statistics
 * @returns {Promise<Object>}
 */
export const getCustomerStats = async () => {
    try {
        const customers = await getAllCustomers({ limitCount: 1000 });

        const stats = {
            total: customers.length,
            new: 0,
            returning: 0,
            vip: 0,
            atRisk: 0,
            inactive: 0,
            avgScore: 0,
            totalRevenue: 0,
        };

        customers.forEach(customer => {
            stats[customer.segment] = (stats[customer.segment] || 0) + 1;
            stats.avgScore += customer.score || 0;
            stats.totalRevenue += customer.totalSpent || 0;
        });

        stats.avgScore = customers.length > 0
            ? Math.round(stats.avgScore / customers.length)
            : 0;

        return stats;
    } catch (error) {
        console.error('Error getting customer stats:', error);
        throw error;
    }
};

/**
 * Update customer notes
 * @param {string} customerId
 * @param {string} notes
 * @returns {Promise<void>}
 */
export const updateCustomerNotes = async (customerId, notes) => {
    try {
        const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
        await updateDoc(docRef, {
            notes,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating customer notes:', error);
        throw error;
    }
};

/**
 * Tag customer as VIP manually
 * @param {string} customerId
 * @param {boolean} isVip
 * @returns {Promise<void>}
 */
export const setCustomerVIP = async (customerId, isVip = true) => {
    try {
        const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
        await updateDoc(docRef, {
            isManualVIP: isVip,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error setting VIP status:', error);
        throw error;
    }
};

/**
 * Get customer lifetime value
 * @param {Object} customer
 * @returns {Object}
 */
export const getCustomerLTV = (customer) => {
    const { totalSpent = 0, orderCount = 0, createdAt } = customer;

    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    const monthsSinceJoin = createdAt
        ? Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
        : 1;

    const monthlyValue = totalSpent / monthsSinceJoin;
    const projectedAnnualValue = monthlyValue * 12;

    return {
        totalSpent,
        avgOrderValue: Math.round(avgOrderValue),
        monthlyValue: Math.round(monthlyValue),
        projectedAnnualValue: Math.round(projectedAnnualValue),
    };
};

/**
 * Format customer join date
 * @param {string|Date} date
 * @returns {string}
 */
export const formatJoinDate = (date) => {
    if (!date) return 'غير معروف';
    const d = new Date(date);
    return d.toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });
};
