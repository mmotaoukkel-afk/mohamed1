/**
 * Admin Product Service - Kataraa
 * Service for managing products (CRUD operations)
 * 🔐 Admin only
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const PRODUCTS_COLLECTION = 'products';

// Product categories from kataraa.com
export const PRODUCT_CATEGORIES = [
    { id: 'skincare', name: 'عناية بالبشرة', icon: '✨', slug: 'العناية-بالبشرة' },
    { id: 'serum', name: 'سيروم', icon: '💧', slug: 'سيروم' },
    { id: 'sunscreen', name: 'واقي الشمس', icon: '☀️', slug: 'واقي-الشمس' },
    { id: 'moisturizer', name: 'مرطب للبشرة', icon: '✨', slug: 'مرطب-للبشرة' },
    { id: 'cleanser', name: 'غسول', icon: '🧼', slug: 'غسول' },
    { id: 'toner', name: 'تونر', icon: '💦', slug: 'تونر' },
    { id: 'mask', name: 'ماسك للوجه', icon: '🎭', slug: 'ماسك-للوجه' },
    { id: 'eyecare', name: 'العناية بالعين', icon: '👁️', slug: 'العناية-بالعين' },
    { id: 'haircare', name: 'العناية بالشعر', icon: '💇', slug: 'العناية-بالشعر' },
    { id: 'acne', name: 'حب الشباب', icon: '🎯', slug: 'حب-الشباب-والبثور' },
    { id: 'antiaging', name: 'التجاعيد', icon: '⏳', slug: 'تجاعيد-البشره' },
    { id: 'pads', name: 'مسحات', icon: '🧴', slug: 'مسحات' },
    { id: 'makeup', name: 'المكياج', icon: '💄', slug: 'المكياج' },
];

// Product status options
export const PRODUCT_STATUS = {
    ACTIVE: 'active',
    DRAFT: 'draft',
    OUT_OF_STOCK: 'out_of_stock',
    LOW_STOCK: 'low_stock',
    ARCHIVED: 'archived',
};

// Default product template
export const DEFAULT_PRODUCT = {
    name: '',
    description: '',
    price: 0,
    compareAtPrice: 0,
    cost: 0,
    stock: 0,
    lowStockThreshold: 5,
    category: '',
    tags: [],
    images: [],
    variants: [],
    status: PRODUCT_STATUS.ACTIVE,
    sku: '',
    barcode: '',
    weight: 0,
    isPublished: false,
};

/**
 * Get all products
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
export const getAllProducts = async (options = {}) => {
    try {
        const { category, status, limitCount = 50 } = options;

        let q = collection(db, PRODUCTS_COLLECTION);
        const constraints = [];

        // IMPORTANT: Categories is an array of OBJECTS, not strings!
        // Structure: [{ id: 112, name: "حيونة جروه", slug: "..." }, ...]
        // Firestore doesn't support querying nested object properties in arrays
        // So we fetch products and filter client-side

        // Only filter by status in Firestore query
        if (status) {
            constraints.push(where('status', '==', status));
        }

        constraints.push(limit(limitCount));

        q = query(q, ...constraints);
        const snapshot = await getDocs(q);

        // Map documents
        let products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // CLIENT-SIDE category filtering
        if (category) {
            const categoryDef = PRODUCT_CATEGORIES.find(c => c.id === category || c.slug === category);

            products = products.filter(product => {
                if (!product.categories || !Array.isArray(product.categories)) {
                    return false;
                }

                // Check if any category object in the array matches
                return product.categories.some(cat => {
                    if (typeof cat === 'string') {
                        // Fallback: if it's somehow a string, match directly
                        return cat === category || cat === categoryDef?.slug || cat === categoryDef?.name;
                    } else if (cat && typeof cat === 'object') {
                        // Match by slug (Arabic name) or name
                        return cat.slug === categoryDef?.slug ||
                            cat.name === categoryDef?.name ||
                            cat.name === categoryDef?.slug ||
                            cat.slug === category ||
                            cat.name === category;
                    }
                    return false;
                });
            });
        }

        // Sort by createdAt descending (client-side)
        products.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            const timeDiff = dateB - dateA;

            if (timeDiff !== 0) return timeDiff;

            // Secondary sort by ID if timestamps are equal
            return a.id.localeCompare(b.id);
        });

        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/**
 * Get single product by ID
 * @param {string} productId
 * @returns {Promise<Object|null>}
 */
export const getProductById = async (productId) => {
    if (!productId) {
        console.warn('⚠️ getProductById called with null/undefined ID');
        return null;
    }

    // Coerce to string if it's a number (common for WooCommerce IDs)
    const id = String(productId);

    try {
        const docRef = doc(db, PRODUCTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching product by ID:', id, error);
        throw error;
    }
};

/**
 * Create new product
 * @param {Object} productData
 * @returns {Promise<Object>}
 */
export const createProduct = async (productData) => {
    try {
        const product = {
            ...DEFAULT_PRODUCT,
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Auto-set status based on stock
        if (product.stock === 0) {
            product.status = PRODUCT_STATUS.OUT_OF_STOCK;
        } else if (product.stock <= product.lowStockThreshold) {
            product.status = PRODUCT_STATUS.LOW_STOCK;
        } else if (product.isPublished) {
            product.status = PRODUCT_STATUS.ACTIVE;
        }

        const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), product);

        return { id: docRef.id, ...product };
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

/**
 * Update existing product
 * @param {string} productId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export const updateProduct = async (productId, updates) => {
    if (!productId || typeof productId !== 'string') {
        throw new Error('Invalid product ID for update');
    }
    try {
        const docRef = doc(db, PRODUCTS_COLLECTION, productId);

        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        // Auto-update status based on stock changes
        if ('stock' in updates) {
            const product = await getProductById(productId);
            const threshold = updates.lowStockThreshold || product?.lowStockThreshold || 5;

            if (updates.stock === 0) {
                updateData.status = PRODUCT_STATUS.OUT_OF_STOCK;
            } else if (updates.stock <= threshold) {
                updateData.status = PRODUCT_STATUS.LOW_STOCK;
            } else if (product?.isPublished) {
                updateData.status = PRODUCT_STATUS.ACTIVE;
            }
        }

        await updateDoc(docRef, updateData);

        return { id: productId, ...updateData };
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

/**
 * Delete product
 * @param {string} productId
 * @returns {Promise<boolean>}
 */
export const deleteProduct = async (productId) => {
    try {
        const docRef = doc(db, PRODUCTS_COLLECTION, productId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

/**
 * Update stock for a product
 * @param {string} productId
 * @param {number} newStock
 * @returns {Promise<Object>}
 */
export const updateStock = async (productId, newStock) => {
    return updateProduct(productId, { stock: newStock });
};

/**
 * Get low stock products
 * @param {number} threshold - Default 5
 * @returns {Promise<Array>}
 */
export const getLowStockProducts = async (threshold = 5) => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('stock', '<=', threshold),
            where('stock', '>', 0),
            orderBy('stock', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        throw error;
    }
};

/**
 * Get out of stock products
 * @returns {Promise<Array>}
 */
export const getOutOfStockProducts = async () => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('stock', '==', 0)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error fetching out of stock products:', error);
        throw error;
    }
};

/**
 * Toggle product publish status
 * @param {string} productId
 * @returns {Promise<Object>}
 */
export const togglePublish = async (productId) => {
    const product = await getProductById(productId);
    if (!product) throw new Error('Product not found');

    const isPublished = !product.isPublished;
    const status = isPublished
        ? (product.stock > 0 ? PRODUCT_STATUS.ACTIVE : PRODUCT_STATUS.OUT_OF_STOCK)
        : PRODUCT_STATUS.DRAFT;

    return updateProduct(productId, { isPublished, status });
};

/**
 * Batch delete products
 * @param {Array<string>} productIds
 * @returns {Promise<number>} - Number of deleted products
 */
export const batchDeleteProducts = async (productIds) => {
    try {
        let deletedCount = 0;
        for (const id of productIds) {
            await deleteProduct(id);
            deletedCount++;
        }
        return deletedCount;
    } catch (error) {
        console.error('Error batch deleting products:', error);
        throw error;
    }
};

/**
 * Generate SKU for product
 * @param {string} category
 * @param {string} name
 * @returns {string}
 */
export const generateSKU = (category, name) => {
    const catPrefix = category?.substring(0, 3).toUpperCase() || 'PRD';
    const namePrefix = name?.substring(0, 3).toUpperCase() || 'XXX';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${catPrefix}-${namePrefix}-${random}`;
};
