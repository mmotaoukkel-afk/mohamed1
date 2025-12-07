/**
 * Product Service
 * Handles all product-related API calls
 */
import api, { retryRequest } from './api';

// API Endpoints
const ENDPOINTS = {
    PRODUCTS: '/products',
    PRODUCT_DETAIL: '/products/:id',
    CATEGORIES: '/categories',
    SEARCH: '/products/search',
    FEATURED: '/products/featured',
    NEW_ARRIVALS: '/products/new-arrivals',
    BEST_SELLERS: '/products/best-sellers',
    REVIEWS: '/products/:id/reviews',
};

/**
 * Get all products with optional filters
 */
export const getProducts = async (params = {}) => {
    const {
        page = 1,
        limit = 20,
        category = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minPrice = null,
        maxPrice = null,
        inStock = null,
    } = params;

    try {
        const queryParams = {
            page,
            limit,
            sortBy,
            sortOrder,
        };

        if (category) queryParams.category = category;
        if (minPrice !== null) queryParams.minPrice = minPrice;
        if (maxPrice !== null) queryParams.maxPrice = maxPrice;
        if (inStock !== null) queryParams.inStock = inStock;

        const response = await retryRequest(() =>
            api.get(ENDPOINTS.PRODUCTS, { params: queryParams })
        );

        return {
            success: true,
            products: response.data.products || response.data,
            pagination: response.data.pagination || {
                page,
                limit,
                total: response.data.total || 0,
                hasMore: response.data.hasMore || false,
            },
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch products',
            code: error.code || 'PRODUCTS_ERROR',
        };
    }
};

/**
 * Get single product by ID
 */
export const getProductById = async (productId) => {
    if (!productId) {
        throw { code: 'VALIDATION_ERROR', message: 'Product ID is required' };
    }

    try {
        const response = await retryRequest(() =>
            api.get(ENDPOINTS.PRODUCT_DETAIL.replace(':id', productId))
        );

        return {
            success: true,
            product: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch product',
            code: error.code || 'PRODUCT_ERROR',
        };
    }
};

/**
 * Get all categories
 */
export const getCategories = async () => {
    try {
        const response = await retryRequest(() => api.get(ENDPOINTS.CATEGORIES));

        return {
            success: true,
            categories: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch categories',
            code: error.code || 'CATEGORIES_ERROR',
        };
    }
};

/**
 * Search products
 */
export const searchProducts = async (query, params = {}) => {
    if (!query || query.trim().length < 2) {
        return { success: true, products: [], total: 0 };
    }

    const {
        page = 1,
        limit = 20,
        category = null,
    } = params;

    try {
        const response = await api.get(ENDPOINTS.SEARCH, {
            params: {
                q: query.trim(),
                page,
                limit,
                category,
            },
        });

        return {
            success: true,
            products: response.data.products || response.data,
            total: response.data.total || 0,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Search failed',
            code: error.code || 'SEARCH_ERROR',
        };
    }
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (limit = 10) => {
    try {
        const response = await retryRequest(() =>
            api.get(ENDPOINTS.FEATURED, { params: { limit } })
        );

        return {
            success: true,
            products: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch featured products',
            code: error.code || 'FEATURED_ERROR',
        };
    }
};

/**
 * Get new arrivals
 */
export const getNewArrivals = async (limit = 10) => {
    try {
        const response = await retryRequest(() =>
            api.get(ENDPOINTS.NEW_ARRIVALS, { params: { limit } })
        );

        return {
            success: true,
            products: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch new arrivals',
            code: error.code || 'NEW_ARRIVALS_ERROR',
        };
    }
};

/**
 * Get best sellers
 */
export const getBestSellers = async (limit = 10) => {
    try {
        const response = await retryRequest(() =>
            api.get(ENDPOINTS.BEST_SELLERS, { params: { limit } })
        );

        return {
            success: true,
            products: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch best sellers',
            code: error.code || 'BEST_SELLERS_ERROR',
        };
    }
};

/**
 * Get product reviews
 */
export const getProductReviews = async (productId, params = {}) => {
    if (!productId) {
        throw { code: 'VALIDATION_ERROR', message: 'Product ID is required' };
    }

    const { page = 1, limit = 10 } = params;

    try {
        const response = await api.get(
            ENDPOINTS.REVIEWS.replace(':id', productId),
            { params: { page, limit } }
        );

        return {
            success: true,
            reviews: response.data.reviews || response.data,
            averageRating: response.data.averageRating || 0,
            totalReviews: response.data.totalReviews || 0,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch reviews',
            code: error.code || 'REVIEWS_ERROR',
        };
    }
};

/**
 * Add product review
 */
export const addProductReview = async (productId, reviewData) => {
    if (!productId) {
        throw { code: 'VALIDATION_ERROR', message: 'Product ID is required' };
    }

    const { rating, comment } = reviewData;

    if (!rating || rating < 1 || rating > 5) {
        throw { code: 'VALIDATION_ERROR', message: 'Rating must be between 1 and 5' };
    }

    try {
        const response = await api.post(
            ENDPOINTS.REVIEWS.replace(':id', productId),
            { rating, comment: comment?.trim() }
        );

        return {
            success: true,
            review: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to add review',
            code: error.code || 'ADD_REVIEW_ERROR',
        };
    }
};

export default {
    getProducts,
    getProductById,
    getCategories,
    searchProducts,
    getFeaturedProducts,
    getNewArrivals,
    getBestSellers,
    getProductReviews,
    addProductReview,
};
