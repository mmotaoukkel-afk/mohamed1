/**
 * Role Guard - Kataraa
 * 🔐 Guards for protecting routes based on user roles
 * 
 * Usage:
 * - useAdminGuard() - Protects admin-only routes
 * - useAuthGuard() - Ensures user is logged in
 * - useCustomerGuard() - Ensures user is NOT admin (customer only areas)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../services/userService';

/**
 * Guard state object
 * @typedef {Object} GuardState
 * @property {boolean} isAllowed - Whether access is allowed
 * @property {boolean} isChecking - Whether guard is still checking
 * @property {string|null} redirectTo - Where to redirect if not allowed
 */

/**
 * Admin Guard Hook
 * Checks if current user has admin role
 * Redirects to home if not admin
 * 
 * @returns {GuardState}
 */
export const useAdminGuard = () => {
    const router = useRouter();
    const { user, loading, isAdmin, role } = useAuth();
    const [guardState, setGuardState] = useState({
        isAllowed: false,
        isChecking: true,
        redirectTo: null,
    });

    // 🚧 DEVELOPER BYPASS: Temporary for testing without login
    const DEV_BYPASS = false;

    useEffect(() => {
        if (DEV_BYPASS) {
            setGuardState({ isAllowed: true, isChecking: false, redirectTo: null });
            return;
        }

        // Still loading auth state
        if (loading) {
            setGuardState({ isAllowed: false, isChecking: true, redirectTo: null });
            return;
        }

        // Not logged in
        if (!user) {
            setGuardState({ isAllowed: false, isChecking: false, redirectTo: '/auth' });
            router.replace('/auth');
            return;
        }

        // Not admin
        if (!isAdmin) {
            console.log(`🚫 Access denied: User role is "${role}", admin required`);
            setGuardState({ isAllowed: false, isChecking: false, redirectTo: '/(tabs)' });
            router.replace('/(tabs)');
            return;
        }

        // ✅ User is admin
        console.log('✅ Admin access granted');
        setGuardState({ isAllowed: true, isChecking: false, redirectTo: null });
    }, [user, loading, isAdmin, role, router]);

    return guardState;
};

/**
 * Auth Guard Hook
 * Ensures user is logged in (any role)
 * Redirects to login if not authenticated
 * 
 * @returns {GuardState}
 */
export const useAuthGuard = () => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [guardState, setGuardState] = useState({
        isAllowed: false,
        isChecking: true,
        redirectTo: null,
    });

    useEffect(() => {
        if (loading) {
            setGuardState({ isAllowed: false, isChecking: true, redirectTo: null });
            return;
        }

        if (!user) {
            setGuardState({ isAllowed: false, isChecking: false, redirectTo: '/auth' });
            router.replace('/auth');
            return;
        }

        setGuardState({ isAllowed: true, isChecking: false, redirectTo: null });
    }, [user, loading, router]);

    return guardState;
};

/**
 * Customer-Only Guard Hook
 * Ensures user is NOT an admin (for customer-specific areas)
 * Redirects admins to admin dashboard
 * 
 * @returns {GuardState}
 */
export const useCustomerGuard = () => {
    const router = useRouter();
    const { user, loading, isAdmin } = useAuth();
    const [guardState, setGuardState] = useState({
        isAllowed: false,
        isChecking: true,
        redirectTo: null,
    });

    useEffect(() => {
        if (loading) {
            setGuardState({ isAllowed: false, isChecking: true, redirectTo: null });
            return;
        }

        if (!user) {
            setGuardState({ isAllowed: false, isChecking: false, redirectTo: '/auth' });
            router.replace('/auth');
            return;
        }

        // Redirect admins to admin area
        if (isAdmin) {
            setGuardState({ isAllowed: false, isChecking: false, redirectTo: '/admin/analytics-dashboard' });
            router.replace('/admin/analytics-dashboard');
            return;
        }

        setGuardState({ isAllowed: true, isChecking: false, redirectTo: null });
    }, [user, loading, isAdmin, router]);

    return guardState;
};

/**
 * Check if current route is an admin route
 * @param {string[]} segments - Route segments from useSegments()
 * @returns {boolean}
 */
export const isAdminRoute = (segments) => {
    return segments[0] === 'admin';
};

/**
 * Get protected routes configuration
 * @returns {Object} Route protection mapping
 */
export const PROTECTED_ROUTES = {
    admin: {
        requiredRole: USER_ROLES.ADMIN,
        redirectOnFail: '/(tabs)',
    },
    checkout: {
        requiredRole: null, // Any authenticated user
        redirectOnFail: '/auth',
    },
    orders: {
        requiredRole: null, // Any authenticated user
        redirectOnFail: '/auth',
    },
};

export default {
    useAdminGuard,
    useAuthGuard,
    useCustomerGuard,
    isAdminRoute,
    PROTECTED_ROUTES,
};
