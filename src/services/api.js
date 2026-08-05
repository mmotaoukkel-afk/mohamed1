/**
 * API Service - Kataraa
 * Fetches products DIRECTLY from kataraa.com via WooCommerce API
 * Optimized with server-side pagination to prevent Network Errors.
 * Orders are still stored in Firestore.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import wooCommerceApi from './wooCommerceApi';

// Cache for categories (they don't change often)
let _categoriesCache = null;
let _categoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL = 1000 * 60 * 60; // 1 hour

const api = {
  /**
   * Get Products from WooCommerce (kataraa.com)
   * Uses server-side pagination and filtering for maximum performance.
   */
  async getProducts(page = 1, perPage = 20, category = null, options = {}) {
    try {
      console.log(`🌐 Fetching products from kataraa.com (Page: ${page})`, { category, ...options });

      // 1. Resolve Category ID if name/slug was passed
      let wcCategoryId = null;
      if (category) {
        const catMap = {
          'haircare': 'hair',
          'sunscreen': 'suncare',
          'antiaging': 'anti-aging',
          'cleanser': 'cleansers',
          'mask': 'masks',
          'moisturizer': 'skincare'
        };
        const mappedCategory = catMap[category.toLowerCase()] || category;

        // If it's already a number/ID, use it. Otherwise find it.
        if (!isNaN(mappedCategory)) {
          wcCategoryId = mappedCategory;
        } else {
          const categories = await this.getCategories();
          const matched = categories.find(c =>
            c.slug === mappedCategory ||
            c.name === mappedCategory ||
            c.slug === category ||
            c.name === category
          );
          wcCategoryId = matched?.id || null;
        }
      }

      // 2. Fetch directly from WooCommerce with pagination
      // This is MUCH faster than fetching all products at once.
      const products = await wooCommerceApi.getProducts(page, perPage, wcCategoryId, options);

      // 3. Client-side secondary filtering (e.g. skin type if not supported by API yet)
      let filteredProducts = products;
      if (options.skin) {
        const skinType = options.skin.toLowerCase();
        filteredProducts = products.filter(p =>
          p.tags && p.tags.some(tag =>
            (tag.name || tag).toString().toLowerCase() === skinType
          )
        );
      }

      console.log(`✅ Loaded ${filteredProducts.length} products from website.`);
      return filteredProducts;

    } catch (error) {
      console.error('❌ API Error (getProducts):', error.message);
      return [];
    }
  },

  /**
   * Get Single Product from WooCommerce
   */
  async getProduct(id) {
    try {
      console.log(`🌐 Fetching product ${id} from kataraa.com`);
      return await wooCommerceApi.getProduct(id);
    } catch (error) {
      console.error('❌ API Error (getProduct):', error.message);
      return null;
    }
  },

  /**
   * Get Categories from WooCommerce (kataraa.com)
   * Cached for 1 hour as they change rarely.
   */
  async getCategories() {
    try {
      const now = Date.now();
      if (_categoriesCache && (now - _categoriesCacheTime) < CATEGORIES_CACHE_TTL) {
        return _categoriesCache;
      }

      console.log('🌐 Fetching categories from kataraa.com');
      const categories = await wooCommerceApi.getCategories();

      // Filter out empty or hidden categories if needed
      _categoriesCache = categories;
      _categoriesCacheTime = now;

      return categories;
    } catch (error) {
      console.error('❌ API Error (getCategories):', error.message);
      return _categoriesCache || []; // Return stale cache if error
    }
  },

  /**
   * Search Products on WooCommerce
   */
  async searchProducts(query, page = 1, perPage = 20) {
    try {
      console.log(`🔍 Searching kataraa.com: "${query}"`);
      return await wooCommerceApi.searchProducts(query, page, perPage);
    } catch (error) {
      console.error('❌ API Error (searchProducts):', error.message);
      return [];
    }
  },

  /**
   * Create Order (stored in Firestore)
   */
  async createOrder(orderData) {
    try {
      console.log('📝 Creating order in Firestore...');
      const ordersRef = collection(db, 'orders');

      const randomId = Math.floor(10000 + Math.random() * 90000);
      const orderNumber = `KAT-${randomId}`;

      const docRef = await addDoc(ordersRef, {
        ...orderData,
        orderNumber,
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      return { id: docRef.id, orderNumber, ...orderData };
    } catch (error) {
      console.error('❌ API Error (createOrder):', error.message);
      throw error;
    }
  },

  /**
   * Clear cache
   */
  clearCache() {
    _categoriesCache = null;
    _categoriesCacheTime = 0;
    console.log('🗑️ API Cache cleared');
  },
};

export default api;
