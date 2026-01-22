/**
 * User Service - Kataraa
 * Manages user roles and admin permissions via Firestore
 * 🔐 Security: Role-based access control
 */

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

// User roles
export const USER_ROLES = {
    CUSTOMER: 'customer',
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    SUPPORT: 'support',
};

/**
 * Get user role from Firestore
 * @param {string} uid - Firebase user ID
 * @returns {Promise<string>} - User role (defaults to 'customer')
 */
export const getUserRole = async (uid) => {
    if (!uid) return USER_ROLES.CUSTOMER;

    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data.role || USER_ROLES.CUSTOMER;
        }
        return USER_ROLES.CUSTOMER;
    } catch (error) {
        console.error('Error fetching user role:', error);
        return USER_ROLES.CUSTOMER;
    }
};

/**
 * Check if user is any kind of admin
 * @param {string} uid - Firebase user ID
 * @returns {Promise<boolean>}
 */
export const isUserAdmin = async (uid) => {
    const role = await getUserRole(uid);
    return role !== USER_ROLES.CUSTOMER;
};

/**
 * Set user role in Firestore
 * @param {string} uid - Firebase user ID
 * @param {string} role - Role to set
 * @param {object} additionalData - Additional user data to store
 */
export const setUserRole = async (uid, role, additionalData = {}) => {
    if (!uid) return;

    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            await updateDoc(userRef, {
                role,
                updatedAt: new Date().toISOString(),
                ...additionalData,
            });
        } else {
            await setDoc(userRef, {
                role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...additionalData,
            });
        }
    } catch (error) {
        console.error('Error setting user role:', error);
        throw error;
    }
};

/**
 * Update user profile in Firestore
 * @param {string} uid 
 * @param {object} updates 
 */
export const updateProfileInFirestore = async (uid, updates) => {
    if (!uid) return;
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating profile in Firestore:', error);
    }
};

/**
 * Create or update user document on login
 * @param {object} userData - User data from auth
 */
export const ensureUserDocument = async (userData) => {
    if (!userData?.uid) return;

    try {
        const userRef = doc(db, 'users', userData.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            // Create new user document with default role
            const role = userData.email === 'admin@kataraa.com' ? USER_ROLES.SUPER_ADMIN : USER_ROLES.CUSTOMER;

            await setDoc(userRef, {
                email: userData.email || '',
                displayName: userData.displayName || '',
                photoURL: userData.photoURL || '',
                provider: userData.provider || 'unknown',
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            console.log(`Created new user document for: ${userData.email} with role: ${role}`);
        } else {
            // Update last login
            await updateDoc(userRef, {
                lastLoginAt: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error('Error ensuring user document:', error);
        // Don't throw - allow login even if Firestore fails
    }
};
// ==========================================
// 🛡️ ADMIN MANAGEMENT FUNCTIONS
// ==========================================

/**
 * Get all users with admin roles
 * @returns {Promise<Array>} List of admin users
 */
export const getAllAdmins = async () => {
    try {
        const usersRef = collection(db, 'users');
        // Get all users who are not customers
        const q = query(
            usersRef,
            where('role', 'in', [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.MANAGER,
                USER_ROLES.SUPPORT
            ])
        );

        const snapshot = await getDocs(q);
        const admins = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Handle display name fallback
            name: doc.data().displayName || doc.data().email?.split('@')[0] || 'Unknown Admin'
        }));

        console.log('✅ Fetched', admins.length, 'admins');
        return admins;
    } catch (error) {
        console.error('Error fetching admins:', error);
        return [];
    }
};

/**
 * Add or Update an admin user
 * @param {Object} adminData { email, name, role }
 */
export const addOrUpdateAdmin = async (adminData) => {
    try {
        const { email, name, role } = adminData;

        // Find user by email first (optional, but good for existing users)
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Update existing user
            const userDoc = snapshot.docs[0];
            await updateDoc(doc(db, 'users', userDoc.id), {
                role,
                displayName: name,
                updatedAt: new Date().toISOString()
            });
            return { id: userDoc.id, ...userDoc.data(), role, displayName: name };
        } else {
            // Create a "pending" admin document
            // When they log in with this email, ensureUserDocument will pick it up
            const newAdminId = `admin_${Date.now()}`;
            const newAdminData = {
                email: email.toLowerCase(),
                displayName: name,
                role: role,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', newAdminId), newAdminData);
            return { id: newAdminId, ...newAdminData };
        }
    } catch (error) {
        console.error('Error adding admin:', error);
        throw error;
    }
};

/**
 * Remove admin status from a user
 * @param {string} uid 
 */
export const removeAdmin = async (uid) => {
    try {
        // We don't delete the user, just set their role to customer
        await updateDoc(doc(db, 'users', uid), {
            role: USER_ROLES.CUSTOMER,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Error removing admin:', error);
        return false;
    }
};
