import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const COLLECTION_NAME = 'coupons';

/**
 * Get All Coupons (Active & Inactive)
 */
export const getCoupons = async () => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            expiresAt: doc.data().expiresAt?.toDate() || null,
            createdAt: doc.data().createdAt?.toDate() || null
        }));
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return [];
    }
};

/**
 * Create New Coupon
 * @param {Object} couponData 
 */
export const createCoupon = async (couponData) => {
    try {
        // Check for duplicate code (Client-side check, ideally use unique index or transaction)
        const q = query(collection(db, COLLECTION_NAME), where('code', '==', couponData.code.toUpperCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return { success: false, message: 'هذا الرمز موجود بالفعل!' };
        }

        await addDoc(collection(db, COLLECTION_NAME), {
            ...couponData,
            code: couponData.code.toUpperCase(),
            isActive: true,
            usedCount: 0,
            createdAt: serverTimestamp(),
            // Ensure expiresAt is a Date object if passed
        });

        return { success: true, message: 'تم إضافة الكوبون بنجاح' };
    } catch (error) {
        console.error('Error creating coupon:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Toggle Coupon Status (Active/Inactive)
 */
export const toggleCouponStatus = async (id, currentStatus) => {
    try {
        const couponRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(couponRef, { isActive: !currentStatus });
        return { success: true };
    } catch (error) {
        console.error('Error toggling coupon:', error);
        return { success: false };
    }
};

/**
 * Delete Coupon
 */
export const deleteCoupon = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true };
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return { success: false };
    }
};

/**
 * Validate Coupon (For future use in Cart)
 */
export const validateCoupon = async (code, cartTotal) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('code', '==', code.toUpperCase()),
            where('isActive', '==', true),
            limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { valid: false, message: 'الكوبون غير موجود أو غير فعال' };
        }

        const coupon = snapshot.docs[0].data();
        const couponId = snapshot.docs[0].id;

        // Check Expiry
        if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
            return { valid: false, message: 'انتهت صلاحية الكوبون' };
        }

        // Check Usage Limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return { valid: false, message: 'تم استنفاد عدد استخدامات الكوبون' };
        }

        // Check Minimum Order
        if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
            return { valid: false, message: `يجب أن تكون قيمة الطلب أكثر من ${coupon.minOrderAmount}` };
        }

        // Calculate Discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (cartTotal * coupon.value) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
            }
        } else {
            discountAmount = coupon.value;
        }

        return {
            valid: true,
            discountAmount,
            coupon: { id: couponId, ...coupon }
        };

    } catch (error) {
        console.error('Error validating coupon:', error);
        return { valid: false, message: 'خطأ في التحقق من الكوبون' };
    }
};
