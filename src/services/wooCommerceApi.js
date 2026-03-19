/**
 * WooCommerce API Service
 * Connects to kataraa.com WooCommerce REST API
 */

import axios from 'axios';

const CK_NEW = 'ck_edf482313734f69689ae197df73f7be4f6e843f3';
const CS_NEW = 'cs_d0393f595460f050fe5a986518fb4601371ca790';

const WOOCOMMERCE_URL = process.env.EXPO_PUBLIC_WOOCOMMERCE_URL || 'https://kataraa.com';
const CONSUMER_KEY = process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY && process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY.startsWith('ck_edf')
    ? process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY
    : CK_NEW;
const CONSUMER_SECRET = process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET && process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET.startsWith('cs_d03')
    ? process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET
    : CS_NEW;

console.log('🔑 WooCommerce Auth:', {
    ck: CONSUMER_KEY.slice(0, 10) + '...',
    len: CONSUMER_KEY.length,
    valid: CONSUMER_KEY.startsWith('ck_edf')
});

// WooCommerce client — uses both Basic Auth + query params for max compatibility
const wooCommerceClient = axios.create({
    baseURL: `${WOOCOMMERCE_URL}/wp-json/wc/v3`,
    timeout: 30000,
    // Basic Auth header (Username = CK, Password = CS)
    auth: {
        username: CONSUMER_KEY,
        password: CONSUMER_SECRET,
    },
    // Fallback for servers that only accept query params
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
    async getProducts(page = 1, perPage = 20, category = null, options = {}) {
        try {
            console.log(`🛒 Fetching products from WooCommerce (Page: ${page})`, { category, ...options });

            // Clamp per_page to max 100 to avoid API errors
            const safePerPage = Math.min(Math.max(1, perPage || 20), 100);

            const params = {
                page,
                per_page: safePerPage,
                status: 'publish',
            };

            if (category) {
                params.category = category;
            }

            // Server-side sorting
            if (options.sortBy) {
                switch (options.sortBy) {
                    case 'price-asc':
                        params.orderby = 'price';
                        params.order = 'asc';
                        break;
                    case 'price-desc':
                        params.orderby = 'price';
                        params.order = 'desc';
                        break;
                    case 'alphabetic':
                        params.orderby = 'title';
                        params.order = 'asc';
                        break;
                    case 'newest':
                    default:
                        params.orderby = 'date';
                        params.order = 'desc';
                        break;
                }
            } else {
                params.orderby = 'date';
                params.order = 'desc';
            }

            const response = await wooCommerceClient.get('/products', { params });
            console.log(`✅ Loaded ${response.data.length} products from WooCommerce`);

            return response.data;
        } catch (error) {
            console.error('❌ WooCommerce API Error (getProducts):', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                // Don't log full data to avoid cluttering, but specific messages are useful
                console.error('Response data:', error.response.data?.message || 'No message');
            }
            return [];
        }
    },

    /**
     * Get ALL Products (auto-pagination)
     * Fetches every single product from WooCommerce, page by page.
     * No product will be missed.
     * @param {string} category - Optional category ID to filter
     * @returns {Promise<Array>} All products
     */
    async getAllProducts(category = null) {
        try {
            console.log('🛒 Fetching ALL products from WooCommerce...');
            let allProducts = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const params = {
                    page,
                    per_page: 100, // Maximum allowed by WooCommerce
                    status: 'publish',
                    orderby: 'date',
                    order: 'desc',
                };

                if (category) {
                    params.category = category;
                }

                const response = await wooCommerceClient.get('/products', { params });
                const products = response.data;

                if (products.length === 0) {
                    hasMore = false;
                } else {
                    allProducts = [...allProducts, ...products];
                    console.log(`   📦 Page ${page}: ${products.length} products (Total: ${allProducts.length})`);

                    // If we got less than 100, we've reached the last page
                    if (products.length < 100) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                }
            }

            console.log(`✅ Total products fetched from WooCommerce: ${allProducts.length}`);
            return allProducts;
        } catch (error) {
            console.error('❌ WooCommerce API Error (getAllProducts):', error.message);
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

            // Clamp per_page to max 100 to avoid API errors
            const safePerPage = Math.min(Math.max(1, perPage || 20), 100);

            const response = await wooCommerceClient.get('/products', {
                params: {
                    search: query,
                    page,
                    per_page: safePerPage,
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
     * Update an existing product on WooCommerce
     */
    async updateProduct(id, data) {
        try {
            console.log(`🔼 Updating product ${id} on WooCommerce...`, data);
            const response = await wooCommerceClient.put(`/products/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`❌ WooCommerce API Error (updateProduct ${id}):`, error.message);
            throw error;
        }
    },

    /**
     * Create a new product on WooCommerce
     */
    async createProduct(data) {
        try {
            console.log('🆕 Creating new product on WooCommerce...', data.name);
            const response = await wooCommerceClient.post('/products', data);
            return response.data;
        } catch (error) {
            console.error('❌ WooCommerce API Error (createProduct):', error.message);
            throw error;
        }
    },

    /**
     * Delete a product from WooCommerce
     */
    async deleteProduct(id) {
        try {
            console.log(`🗑️ Deleting product ${id} from WooCommerce...`);
            const response = await wooCommerceClient.delete(`/products/${id}`, {
                params: { force: true } // true = permanent delete, false = trash
            });
            return response.data;
        } catch (error) {
            console.error(`❌ WooCommerce API Error (deleteProduct ${id}):`, error.message);
            throw error;
        }
    },

    /**
     * Get total product count from WooCommerce headers
     */
    async getTotalProductCount() {
        try {
            const response = await wooCommerceClient.get('/products', {
                params: { per_page: 1, status: 'publish' }
            });
            const total = response.headers['x-wp-total'];
            return parseInt(total) || 0;
        } catch (error) {
            console.error('❌ WooCommerce API Error (getTotalProductCount):', error.message);
            return 0;
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
