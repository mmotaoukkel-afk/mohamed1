/**
 * Admin Coupon Service - Kataraa
 * Service for managing discount coupons
 * 🔐 Admin & Checkout integration
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    increment
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const COUPONS_COLLECTION = 'coupons';

/**
 * Get all coupons
 * @returns {Promise<Array>}
 */
export const getAllCoupons = async () => {
    try {
        const q = query(collection(db, COUPONS_COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error fetching coupons:', error);
        throw error;
    }
};

/**
 * Validate a coupon code
 * @param {string} code 
 * @param {number} cartTotal 
 * @returns {Promise<Object>} Result with success/error and discount details
 */
export const validateCoupon = async (code, cartTotal) => {
    try {
        const q = query(
            collection(db, COUPONS_COLLECTION),
            where('code', '==', code.toUpperCase().trim()),
            where('isActive', '==', true)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { valid: false, message: 'الكود غير صحيح أو منتهي الصلاحية' };
        }

        const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

        // Check Expiry
        if (coupon.expiryDate) {
            const now = new Date();
            const expiry = coupon.expiryDate.toDate();
            if (now > expiry) {
                return { valid: false, message: 'هذا الكود منتهي الصلاحية' };
            }
        }

        // Check Usage Limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return { valid: false, message: 'تم استهلاك هذا الكود بالكامل' };
        }

        // Check Min Order
        if (coupon.minOrder && cartTotal < coupon.minOrder) {
            return {
                valid: false,
                message: `هذا الكود يتطلب طلباً بحد أدنى ${coupon.minOrder} درهم`
            };
        }

        // Calculate Discount
        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = (cartTotal * coupon.value) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.value;
        }

        return {
            valid: true,
            couponId: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discountAmount: Math.min(discountAmount, cartTotal),
        };
    } catch (error) {
        console.error('Error validating coupon:', error);
        throw error;
    }
};

/**
 * Increment coupon usage count
 * @param {string} couponId 
 */
export const recordCouponUsage = async (couponId) => {
    try {
        const docRef = doc(db, COUPONS_COLLECTION, couponId);
        await updateDoc(docRef, {
            usageCount: increment(1)
        });
    } catch (error) {
        console.error('Error recording coupon usage:', error);
    }
};

/**
 * Create new coupon
 * @param {Object} couponData 
 */
export const createCoupon = async (couponData) => {
    try {
        const data = {
            ...couponData,
            code: couponData.code.toUpperCase().trim(),
            usageCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, COUPONS_COLLECTION), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error creating coupon:', error);
        throw error;
    }
};

/**
 * Update coupon
 */
export const updateCoupon = async (couponId, updates) => {
    try {
        const docRef = doc(db, COUPONS_COLLECTION, couponId);
        const data = {
            ...updates,
            updatedAt: serverTimestamp(),
        };
        if (updates.code) data.code = updates.code.toUpperCase().trim();
        await updateDoc(docRef, data);
        return true;
    } catch (error) {
        console.error('Error updating coupon:', error);
        throw error;
    }
};

/**
 * Delete coupon
 */
export const deleteCoupon = async (couponId) => {
    try {
        await deleteDoc(doc(db, COUPONS_COLLECTION, couponId));
        return true;
    } catch (error) {
        console.error('Error deleting coupon:', error);
        throw error;
    }
};
