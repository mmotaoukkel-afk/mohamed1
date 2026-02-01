/**
 * User Profile Service - Kataraa
 * Manages user addresses and personal orders in Firestore
 * 🔐 Security: Bound to User UID
 */

import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const userProfileService = {
    // --- ADDRESSES ---

    /**
     * Get all saved addresses for a user
     */
    async getUserAddresses(userId) {
        if (!userId) return [];
        try {
            const q = query(
                collection(db, 'users', userId.toString(), 'addresses'),
                orderBy('updatedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching addresses:', error);
            return [];
        }
    },

    /**
     * Save or update a user address
     */
    async saveUserAddress(userId, address) {
        if (!userId || !address) return null;
        try {
            const addressId = address.id?.toString() || `addr_${Date.now()}`;
            const addressRef = doc(db, 'users', userId.toString(), 'addresses', addressId);

            const addressData = {
                ...address,
                id: addressId,
                updatedAt: serverTimestamp()
            };

            await setDoc(addressRef, addressData, { merge: true });
            return addressData;
        } catch (error) {
            console.error('Error saving address:', error);
            throw error;
        }
    },

    /**
     * Delete a saved address
     */
    async deleteUserAddress(userId, addressId) {
        if (!userId || !addressId) return false;
        try {
            await deleteDoc(doc(db, 'users', userId.toString(), 'addresses', addressId.toString()));
            return true;
        } catch (error) {
            console.error('Error deleting address:', error);
            return false;
        }
    },

    // --- ORDERS ---

    /**
     * Get all personal orders for a user
     */
    async getUserOrders(userId) {
        if (!userId) return [];
        try {
            const q = query(
                collection(db, 'users', userId.toString(), 'orders'),
                orderBy('date', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore timestamp to Date if needed
                date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : doc.data().date
            }));
        } catch (error) {
            console.error('Error fetching user orders:', error);
            return [];
        }
    },

    /**
     * Add a new order to user's personal history
     */
    async saveUserOrder(userId, order) {
        if (!userId || !order) return null;
        try {
            const orderId = order.id?.toString() || `order_${Date.now()}`;
            const orderRef = doc(db, 'users', userId.toString(), 'orders', orderId);

            const orderData = {
                ...order,
                id: orderId,
                date: serverTimestamp()
            };

            await setDoc(orderRef, orderData);
            return orderData;
        } catch (error) {
            console.error('Error saving user order:', error);
            throw error;
        }
    },

    // --- FAVORITES ---

    /**
     * Get user favorites from Firestore
     */
    async getUserFavorites(userId) {
        if (!userId) return [];
        try {
            const docRef = doc(db, 'users', userId.toString(), 'profile_data', 'favorites');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().items || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching favorites:', error);
            return [];
        }
    },

    /**
     * Sync favorites to Firestore
     */
    async saveUserFavorites(userId, favorites) {
        if (!userId) return;
        try {
            const docRef = doc(db, 'users', userId.toString(), 'profile_data', 'favorites');
            await setDoc(docRef, {
                items: favorites,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }
};

export default userProfileService;
