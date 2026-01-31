/**
 * Admin Settings Service - Kataraa
 * Service for store settings, coupons, taxes, and shipping
 * 🔐 Admin only
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Admin roles
export const ADMIN_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    SUPPORT: 'support',
};

export const ADMIN_ROLE_CONFIG = {
    super_admin: {
        label: 'مشرف رئيسي',
        color: '#EF4444',
        icon: 'shield',
        permissions: ['all'],
    },
    admin: {
        label: 'مشرف',
        color: '#F59E0B',
        icon: 'shield-checkmark',
        permissions: ['products', 'orders', 'customers', 'analytics', 'coupons'],
    },
    manager: {
        label: 'مدير',
        color: '#3B82F6',
        icon: 'person-circle',
        permissions: ['products', 'orders', 'customers'],
    },
    support: {
        label: 'دعم',
        color: '#10B981',
        icon: 'chatbubbles',
        permissions: ['orders', 'customers'],
    },
};

// Coupon types
export const COUPON_TYPES = {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
    FREE_SHIPPING: 'free_shipping',
};

export const COUPON_TYPE_CONFIG = {
    percentage: { label: 'نسبة مئوية', icon: 'pricetag', color: '#10B981', suffix: '%' },
    fixed: { label: 'مبلغ ثابت', icon: 'cash', color: '#8B5CF6', suffix: 'MAD' }, // suffix will be updated by currencyService
    free_shipping: { label: 'شحن مجاني', icon: 'car', color: '#3B82F6', suffix: '' },
};

// Mock admins data
export const MOCK_ADMINS = [
    { id: '1', name: 'أحمد المشرف', email: 'admin@kataraa.com', role: 'super_admin', lastActive: '2026-01-17T13:00:00', status: 'active' },
    { id: '2', name: 'سارة المديرة', email: 'sara@kataraa.com', role: 'admin', lastActive: '2026-01-17T12:30:00', status: 'active' },
    { id: '3', name: 'محمد الدعم', email: 'support@kataraa.com', role: 'support', lastActive: '2026-01-16T18:00:00', status: 'active' },
];

// Mock coupons data
export const MOCK_COUPONS = [
    { id: '1', code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 100, maxUses: 1000, usedCount: 234, validUntil: '2026-03-31', status: 'active' },
    { id: '2', code: 'SAVE50', type: 'fixed', value: 50, minOrder: 300, maxUses: 500, usedCount: 89, validUntil: '2026-02-28', status: 'active' },
    { id: '3', code: 'FREESHIP', type: 'free_shipping', value: 0, minOrder: 200, maxUses: 200, usedCount: 156, validUntil: '2026-01-31', status: 'active' },
    { id: '4', code: 'SUMMER20', type: 'percentage', value: 20, minOrder: 150, maxUses: 100, usedCount: 100, validUntil: '2025-09-30', status: 'expired' },
];

// Generic delivery zones for international shipping fallback
export const DELIVERY_ZONES = [
    { id: 'standard', city: 'شحن قياسي', price: 5, freeAbove: 50, estimatedDays: '3-7' },
    { id: 'express', city: 'شحن سريع', price: 10, freeAbove: 100, estimatedDays: '1-3' },
    { id: 'other', city: 'مدن أخرى', price: 7, freeAbove: 70, estimatedDays: '5-10' },
];

// Tax configuration
export const TAX_CONFIG = {
    enabled: true,
    rate: 0, // Default to 0, can be set per country
    name: 'Tax',
    includedInPrice: true,
};

// Default store settings
export const DEFAULT_STORE_SETTINGS = {
    name: 'Kataraa Beauty',
    currency: 'KWD',
    language: 'ar',
    timezone: 'Asia/Kuwait',
    email: 'contact@kataraa.com',
    phone: '+965 0000 0000',
    address: 'مدينة الكويت، الكويت',
};

// Arab Countries Suggestions for Checkout
export const ARAB_COUNTRIES = [
    { id: 'kuwait', name: 'الكويت', code: 'KW', currency: 'KWD', flag: '🇰🇼' },
    { id: 'saudi', name: 'السعودية', code: 'SA', currency: 'SAR', flag: '🇸🇦' },
    { id: 'uae', name: 'الإمارات', code: 'AE', currency: 'AED', flag: '🇦🇪' },
    { id: 'qatar', name: 'قطر', code: 'QA', currency: 'QAR', flag: '🇶🇦' },
    { id: 'bahrain', name: 'البحرين', code: 'BH', currency: 'BHD', flag: '🇧🇭' },
    { id: 'oman', name: 'عمان', code: 'OM', currency: 'OMR', flag: '🇴🇲' },
    { id: 'syria', name: 'سوريا', code: 'SY', currency: 'SYP', flag: '🇸🇾' },
];

// Mutable store settings (loaded from Firestore)
export let STORE_SETTINGS = { ...DEFAULT_STORE_SETTINGS };

// ==========================================
// 🔥 FIRESTORE STORE SETTINGS FUNCTIONS
// ==========================================

const SETTINGS_DOC_PATH = 'settings/store';

/**
 * Get store settings from Firestore
 * @returns {Promise<Object>} Store settings
 */
export async function getStoreSettings() {
    try {
        const docRef = doc(db, 'settings', 'store');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            STORE_SETTINGS = { ...DEFAULT_STORE_SETTINGS, ...data };
            return STORE_SETTINGS;
        } else {
            // Initialize with defaults if not exists
            await initializeStoreSettings();
            return STORE_SETTINGS;
        }
    } catch (error) {
        console.error('Error fetching store settings:', error);
        return STORE_SETTINGS;
    }
}

/**
 * Update store settings in Firestore
 * @param {Object} updates - Partial settings to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateStoreSettings(updates) {
    try {
        const docRef = doc(db, 'settings', 'store');
        await setDoc(docRef, { ...STORE_SETTINGS, ...updates, updatedAt: new Date() }, { merge: true });
        STORE_SETTINGS = { ...STORE_SETTINGS, ...updates };
        console.log('✅ Store settings updated:', updates);
        return true;
    } catch (error) {
        console.error('Error updating store settings:', error);
        return false;
    }
}

/**
 * Initialize store settings in Firestore (first time setup)
 * @returns {Promise<void>}
 */
export async function initializeStoreSettings() {
    try {
        const docRef = doc(db, 'settings', 'store');
        await setDoc(docRef, { ...DEFAULT_STORE_SETTINGS, createdAt: new Date() });
        STORE_SETTINGS = { ...DEFAULT_STORE_SETTINGS };
        console.log('✅ Store settings initialized in Firestore');
    } catch (error) {
        console.error('Error initializing store settings:', error);
    }
}

// ==========================================
// 🎟️ FIRESTORE COUPON FUNCTIONS
// ==========================================

import { addDoc, collection, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Get all coupons from Firestore
 * @returns {Promise<Array>} List of coupons
 */
export async function getAllCoupons() {
    try {
        const couponsRef = collection(db, 'coupons');
        const snapshot = await getDocs(couponsRef);

        const coupons = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to string
                validUntil: data.validUntil?.toDate ? data.validUntil.toDate().toISOString().split('T')[0] : data.validUntil,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            };
        });

        console.log('✅ Loaded', coupons.length, 'coupons from Firestore');
        return coupons;
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return MOCK_COUPONS; // Fallback to mock data
    }
}

/**
 * Create a new coupon in Firestore
 * @param {Object} couponData - Coupon data
 * @returns {Promise<Object>} Created coupon
 */
export async function createCoupon(couponData) {
    try {
        const couponsRef = collection(db, 'coupons');

        const newCoupon = {
            code: couponData.code.toUpperCase(),
            type: couponData.type,
            value: parseInt(couponData.value) || 0,
            minOrder: parseInt(couponData.minOrder) || 0,
            maxUses: parseInt(couponData.maxUses) || 100,
            usedCount: 0,
            validUntil: couponData.validUntil || null,
            status: 'active',
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(couponsRef, newCoupon);
        console.log('✅ Coupon created:', newCoupon.code);

        return { id: docRef.id, ...newCoupon };
    } catch (error) {
        console.error('Error creating coupon:', error);
        throw error;
    }
}

/**
 * Delete a coupon from Firestore
 * @param {string} couponId - Coupon document ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCoupon(couponId) {
    try {
        if (!couponId || typeof couponId !== 'string') {
            console.error('Invalid couponId for deletion:', couponId);
            return false;
        }

        console.log('🗑️ Attempting to delete coupon:', couponId);
        const couponRef = doc(db, 'coupons', couponId);
        await deleteDoc(couponRef);
        console.log('✅ Coupon deleted from Firestore:', couponId);
        return true;
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return false;
    }
}

/**
 * Update coupon usage count
 * @param {string} couponId - Coupon document ID
 * @returns {Promise<boolean>} Success status
 */
export async function updateCouponUsage(couponId) {
    try {
        const couponRef = doc(db, 'coupons', couponId);
        const couponSnap = await getDoc(couponRef);

        if (couponSnap.exists()) {
            const currentCount = couponSnap.data().usedCount || 0;
            await setDoc(couponRef, { usedCount: currentCount + 1 }, { merge: true });
            console.log('✅ Coupon usage updated');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating coupon usage:', error);
        return false;
    }
}

/**
 * Initialize coupons collection with mock data (first time setup)
 * @returns {Promise<void>}
 */
export async function initializeCoupons() {
    try {
        const couponsRef = collection(db, 'coupons');
        const snapshot = await getDocs(couponsRef);

        // Only initialize if empty
        if (snapshot.empty) {
            console.log('Initializing coupons collection with mock data...');
            for (const coupon of MOCK_COUPONS) {
                await addDoc(couponsRef, {
                    ...coupon,
                    createdAt: Timestamp.now(),
                });
            }
            console.log('✅ Coupons collection initialized');
        }
    } catch (error) {
        console.error('Error initializing coupons:', error);
    }
}

/**
 * Validate coupon code (now works with Firestore)
 * @param {string} code
 * @param {number} orderTotal
 * @param {Array} coupons - Array of coupons from Firestore
 * @returns {Object}
 */
export const validateCoupon = (code, orderTotal, coupons = []) => {
    const coupon = coupons.find(c => c.code === code.toUpperCase()) ||
        MOCK_COUPONS.find(c => c.code === code.toUpperCase());

    if (!coupon) {
        return { valid: false, error: 'كود غير صالح' };
    }

    if (coupon.status !== 'active') {
        return { valid: false, error: 'انتهت صلاحية هذا الكود' };
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
        return { valid: false, error: 'انتهت صلاحية هذا الكود' };
    }

    if (coupon.usedCount >= coupon.maxUses) {
        return { valid: false, error: 'تم استخدام الحد الأقصى لهذا الكود' };
    }

    if (orderTotal < coupon.minOrder) {
        return { valid: false, error: `الحد الأدنى للطلب ${coupon.minOrder} MAD` };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = (orderTotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
    }

    return {
        valid: true,
        coupon,
        discount,
        freeShipping: coupon.type === 'free_shipping',
    };
};

// ==========================================
// 🌍 FIRESTORE SHIPPING FUNCTIONS
// ==========================================

/**
 * Get all shipping countries from Firestore
 * @returns {Promise<Array>} List of countries
 */
export async function getAllCountries() {
    try {
        const shippingRef = collection(db, 'shipping_zones');
        const snapshot = await getDocs(shippingRef);

        const countries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('✅ Loaded', countries.length, 'countries from Firestore');
        return countries;
    } catch (error) {
        console.error('Error fetching shipping countries:', error);
        return [];
    }
}

/**
 * Add a new country for shipping
 * @param {string} countryName 
 * @param {string} countryCode (e.g., 'MA', 'KW')
 * @returns {Promise<Object>}
 */
export async function addCountry(countryName, countryCode) {
    try {
        const countryId = countryCode.toLowerCase();
        const docRef = doc(db, 'shipping_zones', countryId);
        const countryData = {
            name: countryName,
            code: countryCode.toUpperCase(),
            zones: [], // Array of { id, city, price, freeAbove, estimatedDays }
            active: true,
            createdAt: Timestamp.now()
        };
        await setDoc(docRef, countryData);
        return { id: countryId, ...countryData };
    } catch (error) {
        console.error('Error adding country:', error);
        throw error;
    }
}

/**
 * Add or Update a shipping zone (city) within a country
 * @param {string} countryId 
 * @param {Object} zoneData 
 */
export async function addUpdateZone(countryId, zoneData) {
    try {
        const docRef = doc(db, 'shipping_zones', countryId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) throw new Error('Country not found');

        const data = docSnap.data();
        let zones = data.zones || [];

        const existingIndex = zones.findIndex(z => z.id === zoneData.id);
        if (existingIndex > -1) {
            zones[existingIndex] = { ...zones[existingIndex], ...zoneData };
        } else {
            zones.push({
                ...zoneData,
                id: zoneData.id || Date.now().toString()
            });
        }

        await updateDoc(docRef, { zones, updatedAt: Timestamp.now() });
        return true;
    } catch (error) {
        console.error('Error updating shipping zone:', error);
        return false;
    }
}

/**
 * Delete a country from shipping
 */
export async function deleteCountry(countryId) {
    try {
        await deleteDoc(doc(db, 'shipping_zones', countryId));
        return true;
    } catch (error) {
        console.error('Error deleting country:', error);
        return false;
    }
}

/**
 * Calculate delivery price (supports dynamic data)
 * @param {string} cityId
 * @param {number} orderTotal
 * @param {Array} dynamicZones - Optional zones from Firestore
 * @returns {Object}
 */
export const getDeliveryPrice = (cityId, orderTotal, dynamicZones = null) => {
    const zones = dynamicZones || DELIVERY_ZONES;
    const zone = zones.find(z => z.id === cityId) || zones.find(z => z.id === 'other') || zones[0];

    if (!zone) return { price: 0, isFree: true };

    const isFree = orderTotal >= (zone.freeAbove || 0);

    return {
        price: isFree ? 0 : (zone.price || 0),
        originalPrice: zone.price || 0,
        isFree,
        freeAbove: zone.freeAbove,
        estimatedDays: zone.estimatedDays,
    };
};

/**
 * Calculate tax for amount
 * @param {number} amount
 * @returns {Object}
 */
export const calculateTax = (amount) => {
    if (!TAX_CONFIG.enabled) {
        return { taxAmount: 0, beforeTax: amount, afterTax: amount };
    }

    if (TAX_CONFIG.includedInPrice) {
        const beforeTax = amount / (1 + TAX_CONFIG.rate / 100);
        const taxAmount = amount - beforeTax;
        return { taxAmount: Math.round(taxAmount), beforeTax: Math.round(beforeTax), afterTax: amount };
    } else {
        const taxAmount = (amount * TAX_CONFIG.rate) / 100;
        return { taxAmount: Math.round(taxAmount), beforeTax: amount, afterTax: Math.round(amount + taxAmount) };
    }
};

/**
 * Generate coupon code
 * @param {number} length
 * @returns {string}
 */
export const generateCouponCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Check admin permission
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
    const config = ADMIN_ROLE_CONFIG[role];
    if (!config) return false;
    return config.permissions.includes('all') || config.permissions.includes(permission);
};
