/**
 * Admin Banner Service - Kataraa
 * Manage Home Screen visuals and promotions
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const BANNERS_COLLECTION = 'banners';

/**
 * Fetch all banners
 * @param {boolean} onlyActive - If true, only fetch visible banners
 */
export const getAllBanners = async (onlyActive = false) => {
    try {
        let q = collection(db, BANNERS_COLLECTION);
        const snapshot = await getDocs(q);

        let banners = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filter in-memory if requested
        if (onlyActive) {
            banners = banners.filter(b => b.isActive === true);
        }

        // Sort in-memory by order
        return banners.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
        console.error('Error fetching banners:', error);
        return [];
    }
};

/**
 * Add a new banner
 */
export const addBanner = async (bannerData) => {
    try {
        const banners = await getAllBanners();
        const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order || 0)) + 1 : 0;

        const docRef = await addDoc(collection(db, BANNERS_COLLECTION), {
            ...bannerData,
            order: nextOrder,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...bannerData };
    } catch (error) {
        console.error('Error adding banner:', error);
        throw error;
    }
};

/**
 * Update a banner
 */
export const updateBanner = async (bannerId, updates) => {
    try {
        const docRef = doc(db, BANNERS_COLLECTION, bannerId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating banner:', error);
        throw error;
    }
};

/**
 * Delete a banner
 */
export const deleteBanner = async (bannerId) => {
    try {
        await deleteDoc(doc(db, BANNERS_COLLECTION, bannerId));
        return true;
    } catch (error) {
        console.error('Error deleting banner:', error);
        throw error;
    }
};

/**
 * Reorder banners
 */
export const reorderBanners = async (reorderedList) => {
    try {
        const batch = reorderedList.map((banner, index) => {
            const docRef = doc(db, BANNERS_COLLECTION, banner.id);
            return updateDoc(docRef, { order: index });
        });
        await Promise.all(batch);
        return true;
    } catch (error) {
        console.error('Error reordering banners:', error);
        throw error;
    }
};
