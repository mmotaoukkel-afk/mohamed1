/**
 * Admin Notification Service - Kataraa
 * Logic for Broadcasts (Customers) and Alerts (Admins)
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const TOKENS_COLLECTION = 'user_tokens';
const BROADCASTS_COLLECTION = 'broadcasts';
const ADMIN_ALERTS_COLLECTION = 'admin_alerts';

/**
 * Save/Update user push token in Firestore
 */
export const saveUserPushToken = async (userId, token, deviceInfo = {}) => {
    if (!userId || !token) return;
    try {
        const docRef = doc(db, TOKENS_COLLECTION, userId);
        await setDoc(docRef, {
            token,
            userId,
            ...deviceInfo,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error('Error saving push token:', error);
    }
};

/**
 * Fetch all available push tokens for a broadcast
 */
export const getAllPushTokens = async () => {
    try {
        const snapshot = await getDocs(collection(db, TOKENS_COLLECTION));
        return snapshot.docs.map(doc => doc.data().token).filter(t => !!t);
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return [];
    }
};

/**
 * Fetch push tokens for all users with admin roles
 */
export const getAdminPushTokens = async () => {
    try {
        // 1. Try querying tokens directly by role (since we now save it there)
        const tokensRef = collection(db, TOKENS_COLLECTION);
        const qRole = query(tokensRef, where('role', 'in', ['admin', 'super_admin', 'manager', 'support']));
        const roleSnapshot = await getDocs(qRole);

        if (!roleSnapshot.empty) {
            return roleSnapshot.docs.map(doc => doc.data().token).filter(t => !!t);
        }

        // 2. Fallback: Check users collection and match IDs
        const usersRef = collection(db, 'users');
        const qUsers = query(usersRef, where('role', '!=', 'customer'));
        const userSnapshot = await getDocs(qUsers);
        const adminIds = userSnapshot.docs.map(doc => doc.id);

        if (adminIds.length === 0) return [];

        const tokensSnapshot = await getDocs(collection(db, TOKENS_COLLECTION));
        return tokensSnapshot.docs
            .filter(doc => adminIds.includes(doc.id))
            .map(doc => doc.data().token)
            .filter(t => !!t);
    } catch (error) {
        console.error('Error fetching admin tokens:', error);
        return [];
    }
};

/**
 * Send a Broadcast (Mocking the server-side push logic)
 * In a real app, this would call a Cloud Function or Backend API
 */
export const sendBroadcast = async ({ title, body, data = {} }) => {
    try {
        // 1. Save record of broadcast
        const broadcastRecord = {
            title,
            body,
            data: { ...data, type: 'broadcast' },
            sentAt: serverTimestamp(),
            status: 'pending',
        };
        const docRef = await addDoc(collection(db, BROADCASTS_COLLECTION), broadcastRecord);

        // 2. Fetch tokens
        const tokens = await getAllPushTokens();

        // 3. Trigger Push (Using Expo Push API via HTTP)
        // Note: For large lists (thousands), this should be done in batches
        if (tokens.length > 0) {
            const messages = tokens.map(token => ({
                to: token,
                sound: 'default',
                title: title,
                body: body,
                data: { ...data, type: 'broadcast', isRemote: true },
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

        // Update status
        await setDoc(docRef, { status: 'sent' }, { merge: true });
        return { success: true, count: tokens.length };
    } catch (error) {
        console.error('Broadcast failed:', error);
        throw error;
    }
};

/**
 * Trigger an Administrative Alert (New Order, New User)
 */
export const triggerAdminAlert = async ({ type, title, body, data = {} }) => {
    try {
        const adminTitle = `🚨 [نظام الإدارة] ${title}`;

        const alert = {
            type, // 'order', 'user', 'system'
            title: adminTitle,
            body,
            data,
            readBy: [],
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, ADMIN_ALERTS_COLLECTION), alert);

        // 📲 Send Push Notification to all Admins
        const adminTokens = await getAdminPushTokens();
        if (adminTokens.length > 0) {
            const messages = adminTokens.map(token => ({
                to: token,
                sound: 'default',
                title: adminTitle,
                body: body,
                priority: 'high',
                data: { ...data, type: 'admin_alert', isRemote: true },
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
    } catch (error) {
        console.error('Admin alert trigger error:', error);
    }
};

/**
 * Fetch recent admin alerts
 */
export const getAdminAlerts = async (limitCount = 50) => {
    try {
        const q = query(
            collection(db, ADMIN_ALERTS_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error fetching admin alerts:', error);
        return [];
    }
};
