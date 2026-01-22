/**
 * WooCommerce API Service
 * Connects to kataraa.com WooCommerce REST API
 */

import axios from 'axios';

const WOOCOMMERCE_URL = process.env.EXPO_PUBLIC_WOOCOMMERCE_URL || 'https://kataraa.com';
const CONSUMER_KEY = process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || 'ck_5a4adf731227ef0c6352525aba64c523cb48ec55c';
const CONSUMER_SECRET = process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || 'cs_c81c240df13a827084d3a4cd5ed6318657c8b009';

// Create axios instance for WooCommerce
// Using query parameters for authentication (required for some WC setups)
const wooCommerceClient = axios.create({
    baseURL: `${WOOCOMMERCE_URL}/wp-json/wc/v3`,
    timeout: 15000,
    params: {
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
    },
});

const wooCommerceApi = {
    /**
     * Get Products with pagination
     * @param {number} page - Page number
     * @param {number} perPage - Products per page
     * @param {string} category - Category slug or ID
     * @returns {Promise<Array>} Products array
     */
    async getProducts(page = 1, perPage = 20, category = null) {
        try {
            console.log(`🛒 Fetching products from WooCommerce (Page: ${page})`);

            const params = {
                page,
                per_page: perPage,
                status: 'publish', // Only published products
                orderby: 'date',
                order: 'desc',
            };

            if (category) {
                params.category = category;
            }

            const response = await wooCommerceClient.get('/products', { params });
            console.log(`✅ Loaded ${response.data.length} products from WooCommerce`);

            return response.data;
        } catch (error) {
            console.error('❌ WooCommerce API Error (getProducts):', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            return [];
        }
    },

    /**
     * Get Single Product
     * @param {string|number} id - Product ID
     * @returns {Promise<Object|null>} Product object
     */
    async getProduct(id) {
        try {
            console.log(`🛒 Fetching product ${id} from WooCommerce`);
            const response = await wooCommerceClient.get(`/products/${id}`);
            console.log(`✅ Product loaded: ${response.data.name}`);
            return response.data;
        } catch (error) {
            console.error(`❌ WooCommerce API Error (getProduct ${id}):`, error.message);
            if (error.response?.status === 404) {
                console.error('Product not found');
            }
            return null;
        }
    },

    /**
     * Get Categories
     * @returns {Promise<Array>} Categories array
     */
    async getCategories() {
        try {
            console.log('🛒 Fetching categories from WooCommerce');
            const response = await wooCommerceClient.get('/products/categories', {
                params: {
                    per_page: 100,
                    orderby: 'name',
                    order: 'asc',
                },
            });
            console.log(`✅ Loaded ${response.data.length} categories`);
            return response.data;
        } catch (error) {
            console.error('❌ WooCommerce API Error (getCategories):', error.message);
            return [];
        }
    },

    /**
     * Search Products
     * @param {string} query - Search query
     * @param {number} page - Page number
     * @param {number} perPage - Products par page
     * @returns {Promise<Array>} Products array
     */
    async searchProducts(query, page = 1, perPage = 20) {
        try {
            console.log(`🔍 Searching WooCommerce: "${query}"`);
            const response = await wooCommerceClient.get('/products', {
                params: {
                    search: query,
                    page,
                    per_page: perPage,
                    status: 'publish',
                },
            });
            console.log(`✅ Found ${response.data.length} products`);
            return response.data;
        } catch (error) {
            console.error('❌ WooCommerce API Error (searchProducts):', error.message);
            return [];
        }
    },

    /**
     * Get Product Reviews
     * @param {string|number} productId - Product ID
     * @returns {Promise<Array>} Reviews array
     */
    async getProductReviews(productId) {
        try {
            console.log(`🛒 Fetching reviews for product ${productId}`);
            const response = await wooCommerceClient.get('/products/reviews', {
                params: {
                    product: productId,
                    per_page: 100,
                },
            });
            return response.data;
        } catch (error) {
            console.error(`❌ WooCommerce API Error (getProductReviews):`, error.message);
            return [];
        }
    },
};

export default wooCommerceApi;
