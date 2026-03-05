import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Send Push Notification to Target Audience
 * @param {Object} campaign - { title, body, data, target, imageUrl }
 * @returns {Promise<Object>}
 */
export const sendCampaign = async (campaign) => {
    try {
        console.log('🚀 Starting Campaign:', campaign.title);

        // 1. Fetch Target Tokens
        const tokens = await getTargetTokens(campaign.target);

        if (tokens.length === 0) {
            return { success: false, message: 'No users found for this target.' };
        }

        console.log(`📨 Sending to ${tokens.length} devices...`);

        // 2. Prepare Messages (Expo Batch Limit: 100)
        const chunks = [];
        const chunkSize = 100;

        for (let i = 0; i < tokens.length; i += chunkSize) {
            chunks.push(tokens.slice(i, i + chunkSize));
        }

        let successCount = 0;
        let failureCount = 0;

        // 3. Send Batches
        for (const chunk of chunks) {
            const messages = chunk.map(token => ({
                to: token,
                sound: 'default',
                title: campaign.title,
                body: campaign.body,
                data: campaign.data || {},
                // Image support for iOS/Android (Expo limitation: mostly works on Android)
                ...(campaign.imageUrl && { image: campaign.imageUrl })
            }));

            try {
                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(messages),
                });

                const data = await response.json();
                if (data.data) {
                    // Count successes based on 'status': 'ok'
                    data.data.forEach(ticket => {
                        if (ticket.status === 'ok') successCount++;
                        else failureCount++;
                    });
                }
            } catch (error) {
                console.error('Batch send error:', error);
                failureCount += chunk.length;
            }
        }

        // 4. Log Campaign to History
        await addDoc(collection(db, 'notifications_history'), {
            ...campaign,
            sentAt: serverTimestamp(),
            totalSent: successCount,
            totalFailed: failureCount,
            audienceSize: tokens.length
        });

        return {
            success: true,
            sent: successCount,
            failed: failureCount
        };

    } catch (error) {
        console.error('Campaign Error:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Get Tokens based on Target Filter
 */
const getTargetTokens = async (target) => {
    try {
        const usersRef = collection(db, 'users');
        let q = query(usersRef);

        const now = new Date();

        switch (target) {
            case 'new_users': // Registered in last 7 days
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                q = query(usersRef, where('createdAt', '>=', Timestamp.fromDate(lastWeek)));
                break;

            case 'inactive_users': // No implementation for lastLogin yet, mocking logic or skipping
                // For now, return all or implement if lastLogin added
                break;

            case 'all_users':
            default:
                q = query(usersRef); // Limit if needed, but for "All" we need all
                break;
        }

        const snapshot = await getDocs(q);

        // Filter users with push tokens
        const tokens = snapshot.docs
            .map(doc => doc.data().pushToken)
            .filter(token => token && token.startsWith('ExponentPushToken'));

        // Remove duplicates
        return [...new Set(tokens)];
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return [];
    }
};

/**
 * Get Push Tokens for all Administrators
 */
export const getAdminTokens = async () => {
    try {
        const usersRef = collection(db, 'users');
        // Include all administrative roles
        const q = query(usersRef, where('role', 'in', ['admin', 'super_admin', 'manager', 'support']));
        const snapshot = await getDocs(q);

        const tokens = snapshot.docs
            .map(doc => doc.data().pushToken)
            .filter(token => token && token.startsWith('ExponentPushToken'));

        return [...new Set(tokens)];
    } catch (error) {
        console.error('Error fetching admin tokens:', error);
        return [];
    }
};

/**
 * Notify all Admins via Push Notification
 * @param {string} title 
 * @param {string} body 
 * @param {Object} data 
 */
export const notifyAdmins = async (title, body, data = {}) => {
    try {
        const tokens = await getAdminTokens();
        if (tokens.length === 0) {
            console.log('⚠️ [Push Service] No admin tokens found to notify.');
            return { success: false, error: 'No admin tokens found in Firestore.' };
        }

        console.log(`🔔 Notifying ${tokens.length} admins (Broadcast)...`);

        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data: { ...data, scope: 'admin' },
            priority: 'high',
            channelId: 'default', // Essential for Android banners
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json();
        console.log(`📡 [Push Service] Response for ${tokens.length} tokens:`, JSON.stringify(result));

        // Correct check: Expo returns an object with a 'data' array
        const isSuccess = result.data && result.data.every(d => d.status === 'ok');
        return { success: isSuccess, ...result };
    } catch (error) {
        console.error('❌ [Push Service] Error notifying admins:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get Campaign History
 */
export const getCampaignHistory = async () => {
    try {
        const q = query(
            collection(db, 'notifications_history'),
            orderBy('sentAt', 'desc'),
            limit(20)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            sentAt: doc.data().sentAt?.toDate() || new Date()
        }));
    } catch (error) {
        console.error('Error fetching history:', error);
        return [];
    }
};

/**
 * Notify users who requested back-in-stock alerts for a product
 * Called when admin updates product stock_status to 'instock'
 * @param {string|number} productId
 * @param {string} productName
 */
export const notifyBackInStock = async (productId, productName) => {
    try {
        // 1. Get all pending requests for this product
        const requestsRef = collection(db, 'backInStockRequests');
        const q = query(
            requestsRef,
            where('productId', '==', Number(productId)),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('📦 No back-in-stock requests for product:', productId);
            return { success: true, notified: 0 };
        }

        // 2. Get push tokens for those users
        const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
        const usersRef = collection(db, 'users');
        const tokens = [];

        for (const userId of userIds) {
            const userQuery = query(usersRef, where('uid', '==', userId), limit(1));
            const userSnap = await getDocs(userQuery);
            if (!userSnap.empty) {
                const pushToken = userSnap.docs[0].data().pushToken;
                if (pushToken && pushToken.startsWith('ExponentPushToken')) {
                    tokens.push(pushToken);
                }
            }
        }

        if (tokens.length > 0) {
            // 3. Send push notifications
            const messages = tokens.map(token => ({
                to: token,
                sound: 'default',
                title: 'منتج متوفر الآن! ✨',
                body: `المنتج ${productName} متوفر الآن! اطلبيه قبل نفاذ الكمية 🎉`,
                data: { productId: String(productId), type: 'back_in_stock' },
                priority: 'high',
                channelId: 'default',
            }));

            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });
        }

        // 4. Mark all requests as notified
        const { doc, updateDoc } = await import('firebase/firestore');
        for (const docSnap of snapshot.docs) {
            await updateDoc(doc(db, 'backInStockRequests', docSnap.id), {
                status: 'notified',
                notifiedAt: serverTimestamp()
            });
        }

        console.log(`✅ Notified ${tokens.length} users about ${productName} back in stock`);
        return { success: true, notified: tokens.length };

    } catch (error) {
        console.error('❌ Error notifying back-in-stock:', error);
        return { success: false, error: error.message };
    }
};

