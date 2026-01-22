/**
 * Guards Index - Kataraa
 * Export all guard components and hooks
 */

// Components
export { default as RequireAdmin } from '../components/RequireAdmin';
export { default as RequireAuth } from '../components/RequireAuth';

// Hooks
export {
    useAdminGuard,
    useAuthGuard,
    useCustomerGuard,
    isAdminRoute,
    PROTECTED_ROUTES,
} from './role.guard';
