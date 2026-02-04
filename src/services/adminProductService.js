/**
 * Admin Product Service - Kataraa
 * Service for managing products (CRUD operations)
 * 🔐 Admin only
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
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const PRODUCTS_COLLECTION = 'products';

// Product categories from kataraa.com
export const PRODUCT_CATEGORIES = [
    { id: 'serum', name: 'سيروم', icon: '💧', slug: 'سيروم', aliases: ['serum', 'سيروم', 'السيروم'] },
    { id: 'sunscreen', name: 'واقي الشمس', icon: '☀️', slug: 'واقي-الشمس', aliases: ['sunscreen', 'واقي الشمس', 'العناية من الشمس', 'sun-care', 'واقي شمسي'] },
    { id: 'moisturizer', name: 'مرطب للبشرة', icon: '✨', slug: 'مرطب-للبشرة', aliases: ['moisturizer', 'مرطب للبشرة', 'مرطب', 'كريم الترطيب', 'مستحلب مرطب'] },
    { id: 'cleanser', name: 'غسول', icon: '🧼', slug: 'غسول', aliases: ['cleanser', 'غسول', 'منظفات', 'ميسيلار'] },
    { id: 'toner', name: 'تونر', icon: '💦', slug: 'تونر', aliases: ['toner', 'تونر'] },
    { id: 'mask', name: 'ماسك للوجه', icon: '🎭', slug: 'ماسك-للوجه', aliases: ['mask', 'ماسك للوجه', 'ماسك', 'ماسكات', 'قناع'] },
    { id: 'eyecare', name: 'العناية بالعين', icon: '👁️', slug: 'العناية-بالعين', aliases: ['eyecare', 'العناية بالعين', 'العين', 'Revive Eye Serum', 'كريم العيون'] },
    { id: 'haircare', name: 'العناية بالشعر', icon: '💇', slug: 'العناية-بالشعر', aliases: ['haircare', 'العناية بالشعر', 'الشعر', 'الشامبو', 'بلسم'] },
    { id: 'acne', name: 'حب الشباب والبثور', icon: '🎯', slug: 'حب-الشباب-والبثور', aliases: ['acne', 'حب الشباب والبثور', 'حب الشباب'] },
    { id: 'antiaging', name: 'تجاعيد البشره', icon: '⏳', slug: 'تجاعيد-بالبشرة', aliases: ['antiaging', 'تجاعيد البشره', 'مكافحة الشيخوخة', 'مكافحة التجاعيد', 'anti-aging', 'ريتينول', 'ريتينال'] },
    { id: 'pads', name: 'مسحات', icon: '🧴', slug: 'مسحات', aliases: ['pads', 'مسحات', 'وسادات', 'ملصقات', 'لاصقات'] },
    { id: 'makeup', name: 'المكياج', icon: '💄', slug: 'المكياج', aliases: ['makeup', 'المكياج'] },
];

/**
 * Shared Normalization Logic
 * Ensures products have consistent category structures, prices, and image formats.
 * Implements "Smart Category Detection" based on names and database aliases.
 */
export const normalizeProduct = (p) => {
    if (!p) return null;

    // 1. Find category by ID or alias
    let categoryDetails = PRODUCT_CATEGORIES.find(c =>
        c.id === p.category || (c.aliases && c.aliases.includes(p.category))
    );

    // 2. Smart Detection Fallback: if not found, OR if it's a generic/skin category, try name detection
    const isGeneric = !categoryDetails ||
        ['uncategorized', 'جميع المنتجات', 'جميع الماركات', 'البشرة الجافة', 'البشرة الحساسة', 'الاحمرار وتهيج البشرة', 'anti-aging'].includes(p.category?.toLowerCase());

    if (isGeneric) {
        const name = (p.name || '').toLowerCase();

        // Ordered by specificity
        if (name.includes('سيروم') || name.includes('serum')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'serum');
        } else if (name.includes('شمس') || name.includes('sun') || name.includes('sunscreen') || name.includes('واقي شمسي')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'sunscreen');
        } else if (name.includes('غسول') || name.includes('cleanser') || name.includes('ميسيلار')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'cleanser');
        } else if (name.includes('مرطب') || name.includes('moisturizer') || name.includes('cream') || name.includes('كريم') || name.includes('مستحلب')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'moisturizer');
        } else if (name.includes('تونر') || name.includes('toner')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'toner');
        } else if (name.includes('ماسك') || name.includes('mask') || name.includes('قناع')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'mask');
        } else if (name.includes('عين') || name.includes('eye')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'eyecare');
        } else if (name.includes('شعر') || name.includes('hair') || name.includes('شامبو') || name.includes('بلسم')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'haircare');
        } else if (name.includes('حب') || name.includes('acne')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'acne');
        } else if (name.includes('تجاعيد') || name.includes('aging') || name.includes('ريتينول') || name.includes('ريتينال') || name.includes('توهج')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'antiaging');
        } else if (name.includes('مسحات') || name.includes('وسادات') || name.includes('pads') || name.includes('لاصقات') || name.includes('ملصقات')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'pads');
        } else if (name.includes('مكياج') || name.includes('makeup')) {
            categoryDetails = PRODUCT_CATEGORIES.find(c => c.id === 'makeup');
        }
    }

    // 3. Final fallback to the raw category value
    if (!categoryDetails) {
        categoryDetails = { id: p.category, name: p.category || 'غير مصنف' };
    }

    // 4. Ensure categories array is populated (supports multi-category matching)
    let finalCategories = Array.isArray(p.categories) && p.categories.length > 0
        ? p.categories.map(c => typeof c === 'string' ? { id: c, name: c } : (c || {}))
        : [];

    // Add detected category to list if missing
    if (categoryDetails && !finalCategories.some(c => c.id === categoryDetails.id)) {
        finalCategories.unshift(categoryDetails);
    }

    return {
        ...p,
        categories: finalCategories,
        // Formatting for display consistency
        regular_price: p.compareAtPrice || p.price || 0,
        sale_price: p.onSale ? (p.salePrice || p.price) : null,
        images: Array.isArray(p.images) && typeof p.images[0] === 'string'
            ? p.images.map(src => ({ src }))
            : (Array.isArray(p.images) ? p.images : [])
    };
};

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
    status: PRODUCT_STATUS.DRAFT,
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

        // Note: We remove the server-side category 'in' query to allow for 
        // name-based detection and alias matching via normalizeProduct.
        if (status && !category) {
            constraints.push(where('status', '==', status));
        }

        // Fetch a bit more if filtering client-side to ensure we have enough data
        constraints.push(limit(category ? 1000 : limitCount));

        q = query(q, ...constraints);
        const snapshot = await getDocs(q);

        // 1. Map and NORMALIZE documents
        let products = snapshot.docs.map(doc => {
            const data = doc.data();
            return normalizeProduct({ id: doc.id, ...data });
        });

        // 2. Client-Side Filtering (if category requested)
        if (category && category !== 'all') {
            const catObj = PRODUCT_CATEGORIES.find(c => c.id === category);
            products = products.filter(p => {
                // Match by ANY of the normalized IDs
                const matchesNormalized = p.categories.some(c => c.id === category);
                if (matchesNormalized) return true;

                // Fallback: match by aliases if the product still has raw data
                if (catObj && catObj.aliases) {
                    return catObj.aliases.includes(p.category);
                }
                return p.category === category;
            });
        }

        // 3. Client-Side Status Filtering (if both category and status were provided)
        if (status && category) {
            products = products.filter(p => p.status === status);
        }

        // 4. Sort by createdAt descending
        products.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            const timeDiff = dateB - dateA;
            if (timeDiff !== 0) return timeDiff;
            return a.id.localeCompare(b.id);
        });

        // Apply final limit after filtering
        if (category) {
            return products.slice(0, limitCount);
        }

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
