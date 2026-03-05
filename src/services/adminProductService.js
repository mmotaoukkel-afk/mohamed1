/**
 * Admin Product Service - Kataraa
 * Service for managing products (CRUD operations)
 * 🔐 Admin only
 */

import {
    collection,
    getDocs,
    orderBy,
    query,
    where
} from 'firebase/firestore';
import { notifyBackInStock } from './adminNotificationService';
import api from './api';
import { db } from './firebaseConfig';
import wooCommerceApi from './wooCommerceApi';

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
 * Now fetches from WooCommerce to match the app.
 */
export const getAllProducts = async (options = {}) => {
    try {
        console.log('📊 Admin: Fetching products from WooCommerce...');
        const page = options.page || 1;
        const perPage = options.limitCount || 20;
        const category = options.category !== 'all' ? options.category : null;

        // Use our central API which is already optimized for WooCommerce
        const products = await api.getProducts(page, perPage, category, {
            sortBy: 'newest'
        });

        return products;
    } catch (error) {
        console.error('Error fetching products for admin:', error);
        throw error;
    }
};

/**
 * Get single product by ID
 * Now fetches from WooCommerce for live data.
 */
export const getProductById = async (productId) => {
    if (!productId) return null;
    try {
        const id = String(productId);
        console.log(`📊 Admin: Fetching product ${id} from WooCommerce...`);
        const product = await wooCommerceApi.getProduct(id);
        return product;
    } catch (error) {
        console.error('Error fetching product by ID from WooCommerce:', error);
        throw error;
    }
};

/**
 * Create new product
 * Syncs directly to WooCommerce.
 */
export const createProduct = async (productData) => {
    try {
        console.log('📊 Admin: Creating product in WooCommerce...');

        const wcData = {
            name: productData.name,
            type: 'simple',
            regular_price: productData.price?.toString(),
            description: productData.description,
            short_description: productData.shortDescription || '',
            manage_stock: true,
            stock_quantity: productData.stock || 0,
            status: productData.isPublished ? 'publish' : 'draft',
            categories: productData.categories?.map(c => ({ id: c.id })) || [],
            images: productData.images?.map(img => ({ src: img })) || []
        };

        const result = await wooCommerceApi.createProduct(wcData);
        return result;
    } catch (error) {
        console.error('Error creating product on WooCommerce:', error);
        throw error;
    }
};


/**
 * Update existing product
 * Bridges to WooCommerce so changes reflect on the website.
 */
export const updateProduct = async (productId, updates, options = {}) => {
    try {
        console.log(`📊 Admin: Updating product ${productId} in WooCommerce...`);

        // Map updates to WooCommerce format if needed
        const wcData = {
            name: updates.name,
            regular_price: updates.price?.toString(),
            description: updates.description,
            stock_quantity: updates.stock,
            manage_stock: updates.stock !== undefined,
        };

        // Remove undefined fields
        Object.keys(wcData).forEach(key => wcData[key] === undefined && delete wcData[key]);

        const result = await wooCommerceApi.updateProduct(productId, wcData);

        // Check if product was restocked (stock went from 0 to positive)
        if (updates.stock !== undefined && updates.stock > 0 && options.previousStock === 0) {
            const productName = updates.name || result?.name || `#${productId}`;
            console.log(`📦 Product ${productName} is back in stock! Notifying users...`);
            notifyBackInStock(productId, productName).catch(err =>
                console.warn('Back-in-stock notification failed:', err)
            );
        }

        return { id: productId, ...result };
    } catch (error) {
        console.error('Error updating product on WooCommerce:', error);
        throw error;
    }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId) => {
    try {
        console.log(`📊 Admin: Deleting product ${productId} from WooCommerce...`);
        await wooCommerceApi.deleteProduct(productId);
        return true;
    } catch (error) {
        console.error('Error deleting product from WooCommerce:', error);
        throw error;
    }
};

/**
 * Update stock for a product
 */
export const updateStock = async (productId, newStock, previousStock = null) => {
    return updateProduct(productId, { stock: newStock }, { previousStock });
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
