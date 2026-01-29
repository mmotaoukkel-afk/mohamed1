/**
 * User Notification Service - Kataraa
 * Handles targeted notifications for customers (Order updates, etc.)
 */

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

const TOKENS_COLLECTION = 'user_tokens';

/**
 * Send a push notification to a specific user
 * @param {string} userId - The UID of the user to notify
 * @param {string} title 
 * @param {string} body 
 * @param {Object} data - Optional data payload
 */
export const sendUserNotification = async (userId, title, body, data = {}) => {
    try {
        if (!userId) {
            console.warn('⚠️ sendUserNotification called without userId');
            return;
        }

        // 1. Get the user's push token(s)
        // We query the user_tokens collection where docId matching userId might be the strategy,
        // OR if we stored tokens with userId as field. 
        // Based on NotificationContext, we save with `doc(db, 'user_tokens', userId)`.

        const tokenDocRef = doc(db, TOKENS_COLLECTION, userId);
        const tokenDoc = await getDoc(tokenDocRef);

        let pushToken = null;

        if (tokenDoc.exists()) {
            pushToken = tokenDoc.data().token;
        } else {
            console.warn(`⚠️ No push token found for user: ${userId}`);
            return; // No token, can't send
        }

        if (!pushToken) return;

        // 2. Send the notification via Expo Push API
        const message = {
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: { ...data, userId },
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();

        if (result.data?.status === 'ok') {
            console.log(`✅ Notification sent to user ${userId}`);
        } else {
            console.error('❌ Failed to send Expo notification:', result);
        }

    } catch (error) {
        console.error('Error sending user notification:', error);
    }
};

/**
 * Notify user about order status change
 * @param {string} userId 
 * @param {string} orderId 
 * @param {string} newStatus 
 */
export const notifyOrderStatusChange = async (userId, orderId, newStatus) => {
    // Map status to friendly messages (Arabic)
    const STATUS_MESSAGES = {
        confirmed: {
            title: 'تم تأكيد طلبك! 🎉',
            body: `طلبك رقم #${orderId.slice(-6)} تم تأكيده ويجري تجهيزه.`
        },
        processing: {
            title: 'طلبك قيد التجهيز 📦',
            body: `نقوم الآن بتجهيز طلبك #${orderId.slice(-6)} بعناية.`
        },
        shipped: {
            title: 'تم شحن طلبك! 🚚',
            body: `طلبك #${orderId.slice(-6)} في طريقه إليك الآن.`
        },
        out_for_delivery: {
            title: 'مندوب التوصيل في الطريق! 🛵',
            body: `طلبك #${orderId.slice(-6)} سيصلك قريباً جداً، يرجى الاستعداد.`
        },
        delivered: {
            title: 'تم التوصيل بنجاح ✅',
            body: `نتمنى أن تنال منتجاتنا إعجابك! شكراً لتسوقك معنا.`
        },
        cancelled: {
            title: 'تحديث بخصوص طلبك ❌',
            body: `عذراً، تم إلغاء الطلب #${orderId.slice(-6)}.`
        }
    };

    const msg = STATUS_MESSAGES[newStatus];
    if (msg) {
        await sendUserNotification(userId, msg.title, msg.body, {
            type: 'order_update',
            orderId,
            status: newStatus
        });
    }
};
