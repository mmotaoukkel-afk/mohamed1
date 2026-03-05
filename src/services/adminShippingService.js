/**
 * Admin Shipping Service - Kataraa
 * Service for managing shipping zones, rates, and countries
 * 🔐 Admin only
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const SHIPPING_ZONES_COLLECTION = 'shipping_zones';

// Default Kuwait Data to seed if empty
const DEFAULT_KUWAIT_ZONES = [
    { name: 'الأحمدي', nameEn: 'Al Ahmadi', country: 'KW', fee: 2, active: true },
    { name: 'العاصمة', nameEn: 'Al Asimah', country: 'KW', fee: 2, active: true },
    { name: 'الفروانية', nameEn: 'Al Farwaniyah', country: 'KW', fee: 2, active: true },
    { name: 'الجهراء', nameEn: 'Al Jahra', country: 'KW', fee: 2, active: true },
    { name: 'حولي', nameEn: 'Hawalli', country: 'KW', fee: 2, active: true },
    { name: 'مبارك الكبير', nameEn: 'Mubarak Al-Kabeer', country: 'KW', fee: 2, active: true },
    // Special areas
    { name: 'صباح الأحمد', nameEn: 'Sabah Al Ahmad', country: 'KW', fee: 5, active: true },
    { name: 'الخيران', nameEn: 'Al Khairan', country: 'KW', fee: 5, active: true },
    { name: 'المطلاع', nameEn: 'Al Mutlaa', country: 'KW', fee: 5, active: true },
];

/**
 * Get all shipping zones
 * @returns {Promise<Array>}
 */
export const getShippingZones = async () => {
    try {
        // Simply fetch all zones without sorting first to avoid index requirement
        const q = query(collection(db, SHIPPING_ZONES_COLLECTION));
        const snapshot = await getDocs(q);

        let zones = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort client-side: Country -> Name
        zones.sort((a, b) => {
            if (a.country < b.country) return -1;
            if (a.country > b.country) return 1;
            // If countries are same, sort by name
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        // Seed if empty (First time use)
        if (zones.length === 0) {
            console.log('🌱 Seeding default Kuwait zones...');
            await seedDefaultZones();
            return getShippingZones(); // Recursive call to get seeded data
        }

        return zones;
    } catch (error) {
        console.error('Error getting shipping zones:', error);
        throw error;
    }
};

/**
 * Seed default zones
 */
const seedDefaultZones = async () => {
    const promises = DEFAULT_KUWAIT_ZONES.map(async (zone) => {
        return addDoc(collection(db, SHIPPING_ZONES_COLLECTION), {
            ...zone,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });
    await Promise.all(promises);
};

/**
 * Add a new shipping zone
 * @param {Object} zoneData 
 */
export const addShippingZone = async (zoneData) => {
    try {
        const docRef = await addDoc(collection(db, SHIPPING_ZONES_COLLECTION), {
            ...zoneData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            active: true
        });
        return { id: docRef.id, ...zoneData };
    } catch (error) {
        console.error('Error adding shipping zone:', error);
        throw error;
    }
};

/**
 * Update a shipping zone
 * @param {string} id 
 * @param {Object} updates 
 */
export const updateShippingZone = async (id, updates) => {
    try {
        const docRef = doc(db, SHIPPING_ZONES_COLLECTION, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { id, ...updates };
    } catch (error) {
        console.error('Error updating shipping zone:', error);
        throw error;
    }
};

/**
 * Delete a shipping zone
 * @param {string} id 
 */
export const deleteShippingZone = async (id) => {
    try {
        await deleteDoc(doc(db, SHIPPING_ZONES_COLLECTION, id));
        return true;
    } catch (error) {
        console.error('Error deleting shipping zone:', error);
        throw error;
    }
};

/**
 * Toggle zone active status
 * @param {string} id 
 * @param {boolean} currentStatus 
 */
export const toggleZoneStatus = async (id, currentStatus) => {
    return updateShippingZone(id, { active: !currentStatus });
};
