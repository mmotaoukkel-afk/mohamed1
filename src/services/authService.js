/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
import api, { setAuthToken, removeAuthToken, retryRequest } from './api';
import { validateEmail, validatePassword, validateName } from '../utils/validation';

// API Endpoints
const ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    REFRESH_TOKEN: '/auth/refresh',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    DELETE_ACCOUNT: '/auth/delete-account',
};

/**
 * Login user with email and password
 */
export const loginUser = async (email, password) => {
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw { code: 'VALIDATION_ERROR', message: emailValidation.error };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        throw { code: 'VALIDATION_ERROR', message: passwordValidation.error };
    }

    try {
        const response = await api.post(ENDPOINTS.LOGIN, {
            email: email.toLowerCase().trim(),
            password,
        });

        const { token, refreshToken, user } = response.data;

        // Store tokens securely
        if (token) {
            await setAuthToken(token);
        }

        return {
            success: true,
            user,
            token,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Login failed',
            code: error.code || 'LOGIN_ERROR',
        };
    }
};

/**
 * Register new user
 */
export const registerUser = async (name, email, password, confirmPassword) => {
    // Validate inputs
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
        throw { code: 'VALIDATION_ERROR', message: nameValidation.error };
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw { code: 'VALIDATION_ERROR', message: emailValidation.error };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        throw { code: 'VALIDATION_ERROR', message: passwordValidation.error };
    }

    if (password !== confirmPassword) {
        throw { code: 'VALIDATION_ERROR', message: 'Passwords do not match' };
    }

    try {
        const response = await api.post(ENDPOINTS.REGISTER, {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
        });

        const { token, user, message } = response.data;

        if (token) {
            await setAuthToken(token);
        }

        return {
            success: true,
            user,
            message: message || 'Registration successful',
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Registration failed',
            code: error.code || 'REGISTER_ERROR',
        };
    }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
    try {
        await api.post(ENDPOINTS.LOGOUT);
    } catch (error) {
        // Continue with local logout even if server logout fails
        console.warn('Server logout failed:', error.message);
    } finally {
        await removeAuthToken();
    }

    return { success: true };
};

/**
 * Request password reset
 */
export const forgotPassword = async (email) => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw { code: 'VALIDATION_ERROR', message: emailValidation.error };
    }

    try {
        const response = await api.post(ENDPOINTS.FORGOT_PASSWORD, {
            email: email.toLowerCase().trim(),
        });

        return {
            success: true,
            message: response.data.message || 'Password reset email sent',
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to send reset email',
            code: error.code || 'FORGOT_PASSWORD_ERROR',
        };
    }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword, confirmPassword) => {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        throw { code: 'VALIDATION_ERROR', message: passwordValidation.error };
    }

    if (newPassword !== confirmPassword) {
        throw { code: 'VALIDATION_ERROR', message: 'Passwords do not match' };
    }

    try {
        const response = await api.post(ENDPOINTS.RESET_PASSWORD, {
            token,
            password: newPassword,
        });

        return {
            success: true,
            message: response.data.message || 'Password reset successful',
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Password reset failed',
            code: error.code || 'RESET_PASSWORD_ERROR',
        };
    }
};

/**
 * Get current user profile
 */
export const getProfile = async () => {
    try {
        const response = await retryRequest(() => api.get(ENDPOINTS.PROFILE));
        return {
            success: true,
            user: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to get profile',
            code: error.code || 'PROFILE_ERROR',
        };
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (updates) => {
    // Validate name if provided
    if (updates.name) {
        const nameValidation = validateName(updates.name);
        if (!nameValidation.isValid) {
            throw { code: 'VALIDATION_ERROR', message: nameValidation.error };
        }
        updates.name = updates.name.trim();
    }

    try {
        const response = await api.put(ENDPOINTS.UPDATE_PROFILE, updates);
        return {
            success: true,
            user: response.data,
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to update profile',
            code: error.code || 'UPDATE_PROFILE_ERROR',
        };
    }
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        throw { code: 'VALIDATION_ERROR', message: passwordValidation.error };
    }

    if (newPassword !== confirmPassword) {
        throw { code: 'VALIDATION_ERROR', message: 'Passwords do not match' };
    }

    if (currentPassword === newPassword) {
        throw { code: 'VALIDATION_ERROR', message: 'New password must be different from current password' };
    }

    try {
        const response = await api.post(ENDPOINTS.CHANGE_PASSWORD, {
            currentPassword,
            newPassword,
        });

        return {
            success: true,
            message: response.data.message || 'Password changed successfully',
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to change password',
            code: error.code || 'CHANGE_PASSWORD_ERROR',
        };
    }
};

/**
 * Delete user account
 */
export const deleteAccount = async (password) => {
    try {
        await api.delete(ENDPOINTS.DELETE_ACCOUNT, {
            data: { password },
        });

        await removeAuthToken();

        return {
            success: true,
            message: 'Account deleted successfully',
        };
    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Failed to delete account',
            code: error.code || 'DELETE_ACCOUNT_ERROR',
        };
    }
};

export default {
    loginUser,
    registerUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
};
