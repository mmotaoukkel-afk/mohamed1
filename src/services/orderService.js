/**
 * Order Service
 * Handles all order-related API calls
 */
import api, { retryRequest } from './api';

// API Endpoints
const ENDPOINTS = {
    ORDERS: '/orders',
    ORDER_DETAIL: '/orders/:id',
    CREATE_ORDER: '/orders',
    CANCEL_ORDER: '/orders/:id/cancel',
    TRACK_ORDER: '/orders/:id/track',
    REORDER: '/orders/:id/reorder',
};

/**
 * Get all orders for current user
 */
export const getOrders = async (params = {}) => {
    const {
        page = 1,
        limit = 10,
        status = null,
    } = params;

    try {
        const queryParams = { page, limit };
        if (status) queryParams.status = status;

        const response = await retryRequest(() =>
            api.get(ENDPOINTS.ORDERS, { params: queryParams })
        );

        return {
            success: true,
            orders: response.data.orders || response.data,
            pagination: response.data.pagination || {
                page,
                limit,
                total: response.data.total || 0,
            },
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch orders',
            code: error.code || 'ORDERS_ERROR',
        };
    }
};

/**
 * Get single order by ID
 */
export const getOrderById = async (orderId) => {
    if (!orderId) {
        throw { code: 'VALIDATION_ERROR', message: 'Order ID is required' };
    }

    try {
        const response = await retryRequest(() =>
            api.get(ENDPOINTS.ORDER_DETAIL.replace(':id', orderId))
        );

        return {
            success: true,
            order: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to fetch order',
            code: error.code || 'ORDER_ERROR',
        };
    }
};

/**
 * Create new order
 */
export const createOrder = async (orderData) => {
    const {
        items,
        shippingAddress,
        paymentMethod,
        promoCode = null,
    } = orderData;

    // Validate required fields
    if (!items || items.length === 0) {
        throw { code: 'VALIDATION_ERROR', message: 'Order must contain at least one item' };
    }

    if (!shippingAddress) {
        throw { code: 'VALIDATION_ERROR', message: 'Shipping address is required' };
    }

    if (!paymentMethod) {
        throw { code: 'VALIDATION_ERROR', message: 'Payment method is required' };
    }

    try {
        const response = await api.post(ENDPOINTS.CREATE_ORDER, {
            items: items.map(item => ({
                productId: item.id || item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
            shippingAddress,
            paymentMethod,
            promoCode,
        });

        return {
            success: true,
            order: response.data,
            message: 'Order placed successfully',
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to create order',
            code: error.code || 'CREATE_ORDER_ERROR',
        };
    }
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId, reason = '') => {
    if (!orderId) {
        throw { code: 'VALIDATION_ERROR', message: 'Order ID is required' };
    }

    try {
        const response = await api.post(
            ENDPOINTS.CANCEL_ORDER.replace(':id', orderId),
            { reason }
        );

        return {
            success: true,
            order: response.data,
            message: 'Order cancelled successfully',
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to cancel order',
            code: error.code || 'CANCEL_ORDER_ERROR',
        };
    }
};

/**
 * Track order
 */
export const trackOrder = async (orderId) => {
    if (!orderId) {
        throw { code: 'VALIDATION_ERROR', message: 'Order ID is required' };
    }

    try {
        const response = await retryRequest(() =>
            api.get(ENDPOINTS.TRACK_ORDER.replace(':id', orderId))
        );

        return {
            success: true,
            tracking: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to track order',
            code: error.code || 'TRACK_ORDER_ERROR',
        };
    }
};

/**
 * Reorder - Create new order from previous order
 */
export const reorder = async (orderId) => {
    if (!orderId) {
        throw { code: 'VALIDATION_ERROR', message: 'Order ID is required' };
    }

    try {
        const response = await api.post(
            ENDPOINTS.REORDER.replace(':id', orderId)
        );

        return {
            success: true,
            order: response.data,
            message: 'Reorder successful',
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to reorder',
            code: error.code || 'REORDER_ERROR',
        };
    }
};

export default {
    getOrders,
    getOrderById,
    createOrder,
    cancelOrder,
    trackOrder,
    reorder,
};
