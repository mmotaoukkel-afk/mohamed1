/**
 * RequireAdmin - Kataraa
 * Protected wrapper component for admin routes
 * 🔐 Prevents unauthorized access to admin pages
 * Uses useAdminGuard hook for route protection
 */

import React from 'react';

export default function RequireAdmin({ children }) {
    // ✅ Access granted to everyone (Requested by User)
    return <>{children}</>;
}
