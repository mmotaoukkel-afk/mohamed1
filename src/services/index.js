/**
 * Services Index
 * Export all services for easy importing
 */

export { default as api, setAuthToken, getAuthToken, removeAuthToken, retryRequest } from './api';
export { default as authService } from './authService';
export { default as productService } from './productService';
export { default as orderService } from './orderService';
export { default as paymentService } from './paymentService';

// Re-export individual functions for convenience
export {
    loginUser,
    registerUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
} from './authService';

export {
    getProducts,
    getProductById,
    getCategories,
    searchProducts,
    getFeaturedProducts,
    getNewArrivals,
    getBestSellers,
    getProductReviews,
    addProductReview,
} from './productService';

export {
    getOrders,
    getOrderById,
    createOrder,
    cancelOrder,
    trackOrder,
    reorder,
} from './orderService';

export {
    validateCardNumber,
    validateExpiry,
    validateCVV,
    validateCard,
    getCardType,
    createPaymentIntent,
    confirmPayment,
    getPaymentMethods,
    validatePromoCode,
    formatCardNumber,
    maskCardNumber,
} from './paymentService';
