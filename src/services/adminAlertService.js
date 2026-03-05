/**
 * Admin Alert Service - Kataraa
 * Manages real-time listeners for critical admin events
 */

import {
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const ORDERS_COLLECTION = 'orders';
const REVIEWS_COLLECTION = 'reviews';
const PRODUCTS_COLLECTION = 'products';
const ALERTS_COLLECTION = 'admin_alerts'; // We can use this to persist dismissed alerts if needed

/**
 * Listen for new orders
 * @param {Function} callback - Called when a new order is detected
 */
export const listenForNewOrders = (callback) => {
    // 🕒 Calculate cutoff for "Recent" (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch a larger batch initially to populate the center
    const q = query(
        collection(db, ORDERS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    let isInitialLoad = true;
    const startTime = Date.now();

    return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
        if (snapshot.metadata.fromCache) return;

        console.log(`[OrderListener] Snapshot at ${new Date().toLocaleTimeString()}, docs: ${snapshot.size}`);

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const orderDate = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : 0;

                // On initial load, we only "Alert" (trigger callback for popup/badge)
                // if it's very recent. Otherwise, we just send it to fill the history list.
                const isVeryRecent = orderDate > (startTime - 60000); // 1 minute window
                const isWithin24h = orderDate > twentyFourHoursAgo.getTime();

                // If initial load, only include if within 24h
                if (isInitialLoad && !isWithin24h) return;

                const order = { id: change.doc.id, ...data };
                const customerName = order.customerName ||
                    order.billing?.first_name ||
                    order.shipping?.first_name ||
                    order.shippingAddress?.fullName ||
                    'زبون';

                callback({
                    type: 'order',
                    title: 'طلب جديد! 🛍️',
                    body: `تم استلام طلب جديد من ${customerName}`,
                    data: order,
                    timestamp: data.createdAt?.toDate() || new Date(),
                    isInitial: isInitialLoad,
                    isSilent: isInitialLoad // Dashboard shouldn't make noise/popup for old 24h orders
                });
            }
        });

        if (isInitialLoad) isInitialLoad = false;
    }, (error) => {
        console.error('Error listening for new orders:', error.message);
    });
};

/**
 * Listen for new reviews
 * @param {Function} callback 
 */
export const listenForNewReviews = (callback) => {
    const q = query(
        collection(db, REVIEWS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(1)
    );

    let isInitialLoad = true;
    return onSnapshot(q, (snapshot) => {
        if (isInitialLoad) {
            isInitialLoad = false;
            return;
        }

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const review = { id: change.doc.id, ...change.doc.data() };
                callback({
                    type: 'review',
                    title: 'تقييم جديد ⭐',
                    body: `قام أحد الزبائن بتقييم منتج بـ ${review.rating} نجوم`,
                    data: review,
                    timestamp: new Date()
                });
            }
        });
    }, (error) => {
        console.warn('Error listening for new reviews:', error.message);
    });
};

/**
 * Listen for low stock items
 * @param {number} threshold - Stock limit to trigger alert
 * @param {Function} callback 
 */
export const listenForLowStock = (callback, threshold = 5) => {
    const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('stock_quantity', '<=', threshold),
        where('stock_quantity', '>', 0)
    );

    return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
                const product = { id: change.doc.id, ...change.doc.data() };
                // Only alert if it's a significant drop or new entry in "low stock" list
                callback({
                    type: 'stock',
                    title: 'مخزون منخفض 📦',
                    body: `المنتج "${product.name}" قارب على النفاد (${product.stock} قطع متبقية)`,
                    data: product,
                    timestamp: new Date()
                });
            }
        });
    }, (error) => {
        console.warn('Error listening for low stock:', error.message);
    });
};
