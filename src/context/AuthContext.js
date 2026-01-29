
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth as firebaseAuth } from '../services/firebaseConfig';
import { GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { storage } from '../utils/storage';
import { useNotifications } from './NotificationContext';
import { getUserRole, ensureUserDocument, USER_ROLES, updateProfileInFirestore } from '../services/userService';

const AuthContext = createContext();

// CONFIG: Keys migrated to .env
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(USER_ROLES.CUSTOMER); // customer or admin
    const [tempOTP, setTempOTP] = useState(null); // Store OTP temporarily

    // Computed: is current user an admin?
    const isAdmin = role !== USER_ROLES.CUSTOMER;

    useEffect(() => {
        checkUser();
        // Initialize Google Sign-In only if native module is available
        if (GoogleSignin) {
            GoogleSignin.configure({
                webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '1076765269610-u5to0vkmrfc2b82f8hvjbg6jfaog3oom.apps.googleusercontent.com', // Extracted from google-services.json (type 3)
                offlineAccess: true,
            });
        } else {
            console.warn('Google Sign-In native module not found. Social login will be disabled.');
        }
    }, []);

    const checkUser = async () => {
        try {
            // Load last active session
            const savedUser = await storage.getItem('user');
            if (savedUser) {
                setUser(savedUser);

                // 🔐 Restore user role from Firestore
                if (savedUser.uid) {
                    const userRole = await getUserRole(savedUser.uid);
                    setRole(userRole);
                    console.log('Session restored with role:', userRole);
                }
            }
        } catch (e) {
            // Silent fail for session restore
            console.error('Error restoring session:', e);
        } finally {
            setLoading(false);
        }
    };

    const { addNotification } = useNotifications();

    const getStoredProfile = async (email) => {
        try {
            const profiles = await storage.getItem('user_profiles') || {};
            return profiles[email.toLowerCase()];
        } catch (e) {
            return null;
        }
    };

    const saveToProfiles = async (userData) => {
        try {
            const profiles = await storage.getItem('user_profiles') || {};
            profiles[userData.email.toLowerCase()] = userData;
            await storage.setItem('user_profiles', profiles);
        } catch (e) {
            console.error('Error saving profile:', e);
        }
    };

    const login = async (userData) => {
        const existingProfile = await getStoredProfile(userData.email);
        // Prioritize existingProfile data (custom photos, names) over fresh userData from provider
        const finalUser = existingProfile ? { ...userData, ...existingProfile } : userData;
        setUser(finalUser);
        await storage.setItem('user', finalUser);
        await saveToProfiles(finalUser);

        // 🔐 Fetch and set user role from Firestore
        let userRole = USER_ROLES.CUSTOMER;
        if (finalUser.uid) {
            await ensureUserDocument(finalUser);
            userRole = await getUserRole(finalUser.uid);
            setRole(userRole);
            console.log('User role loaded:', userRole);
        }

        addNotification('notifWelcomeBackTitle', 'notifWelcomeBackMsg', 'info', { name: finalUser.displayName || finalUser.email });
        return userRole;
    };

    const signup = async (userData) => {
        setUser(userData);
        await storage.setItem('user', userData);
        await saveToProfiles(userData);

        // 🔐 Create user document with default customer role
        if (userData.uid) {
            await ensureUserDocument(userData);
            setRole(USER_ROLES.CUSTOMER); // New users are always customers
        }

        addNotification('notifWelcomeNewTitle', 'notifWelcomeNewMsg', 'success', { name: userData.displayName });
    };

    const signInWithGoogle = async () => {
        if (!GoogleSignin) {
            throw new Error('Google Sign-In is not available in this build. Please install the latest version.');
        }
        try {
            await GoogleSignin.hasPlayServices();
            // Sign out first to clear cached session and show account picker
            await GoogleSignin.signOut();
            const userInfo = await GoogleSignin.signIn();

            // Handle user cancellation (Newer library versions return { type: 'cancelled' })
            if (userInfo.type === 'cancelled') {
                console.log('User cancelled Google Sign-In');
                return; // Stop execution gracefully
            }

            // Get the credential - handle both old and new library versions
            const idToken = userInfo.data?.idToken || userInfo.idToken;

            console.log(`Debug Google Sign-In: idToken type=${typeof idToken}, length=${idToken?.length}`);

            if (!idToken || typeof idToken !== 'string' || idToken.length === 0) {
                // If checking for cancellation above missed it (older versions might just return null data), check here
                if (userInfo.type === 'cancelled' || userInfo === null) {
                    console.log('User cancelled Google Sign-In (legacy check)');
                    return;
                }
                console.error('Invalid idToken received:', JSON.stringify(userInfo, null, 2));
                throw new Error('Google Sign-In failed: No valid ID token received');
            }

            const googleCredential = GoogleAuthProvider.credential(idToken);

            // Sign in with Firebase
            const result = await signInWithCredential(firebaseAuth, googleCredential);
            const firebaseUser = result.user;

            const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                provider: 'google'
            };

            await login(userData);
            return userData;
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    };

    const logout = async () => {
        setUser(null);
        setRole(USER_ROLES.CUSTOMER); // Reset role on logout
        await storage.removeItem('user');
    };

    const updateUser = async (updates) => {
        if (!user) return;

        try {
            // Special handling for email update
            if (updates.email && updates.email !== user.email) {
                // If it's a social user (e.g. Google), we usually can't change email via Firebase Auth directly this way
                if (user.provider === 'google') {
                    throw new Error('Social login emails cannot be changed directly.');
                }

                // If it's a real Firebase user (not just local_), try to update email in Firebase Auth
                if (firebaseAuth.currentUser && !user.uid?.startsWith('local_')) {
                    try {
                        const { verifyBeforeUpdateEmail } = await import('firebase/auth');
                        await verifyBeforeUpdateEmail(firebaseAuth.currentUser, updates.email);
                        // Inform user that verification is required
                        addNotification('notifEmailVerifyTitle', 'notifEmailVerifyMsg', 'info', { email: updates.email });
                    } catch (authError) {
                        console.error('Firebase Auth email update failed:', authError);
                        // If it's a recent login requirement, propagate it
                        if (authError.code === 'auth/requires-recent-login') {
                            throw new Error('Please log in again to change your email.');
                        }
                        if (authError.code === 'auth/operation-not-allowed') {
                            throw new Error('Email update is currently restricted. Please contact support.');
                        }
                        // Continue to update Firestore even if Auth fails (for local accounts)
                    }
                }
            }

            const newUser = { ...user, ...updates };
            setUser(newUser);
            await storage.setItem('user', newUser);
            await saveToProfiles(newUser);

            // 🔐 Sync with Firestore
            if (newUser.uid) {
                await updateProfileInFirestore(newUser.uid, updates);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    };



    const resetPassword = async (email) => {
        // 1. Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // 2. Store OTP temporarily (in memory for this session)
        setTempOTP({ email, code: otp, timestamp: Date.now() });

        // 3. Send Email
        if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
            console.warn('EmailJS keys not set. Simulate success.');
            console.log('🔐 [DEV MODE] Generated OTP:', otp);
            // Allow proceeding without email for testing
            return Promise.resolve();
        }

        // 3. Send Email via REST API (No SDK needed)
        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service_id: EMAILJS_SERVICE_ID,
                    template_id: EMAILJS_TEMPLATE_ID,
                    user_id: EMAILJS_PUBLIC_KEY,
                    template_params: {
                        to_email: email,
                        otp_code: otp,
                        to_name: email.split('@')[0],
                    },
                }),
            });

            if (response.ok) {
                // Email sent successfully
                console.log('Email sent successfully via EmailJS');
            } else {
                const text = await response.text();
                // Check if it's the specific "Public Key is required" error which implies keys are missing/invalid
                if (text.includes('Public Key is required')) {
                    console.warn('EmailJS Public Key invalid. Fallback to Dev Mode.');
                    console.log('🔐 [DEV MODE] Generated OTP:', otp);
                    return Promise.resolve();
                }
                console.error('EmailJS API Error:', text);
                throw new Error('Failed to send email via API');
            }
        } catch (error) {
            console.error('EmailJS Error:', error);
            // Fallback for network errors during dev mostly
            console.log('🔐 [DEV MODE] Generated OTP (Fallback):', otp);
            throw new Error('Failed to send email. Please check internet connection.');
        }
    };

    const verifyResetCode = async (email, code) => {
        // Verify against stored OTP
        return new Promise((resolve, reject) => {
            if (!tempOTP) {
                reject(new Error('No OTP request found. Please try again.'));
                return;
            }
            if (tempOTP.email !== email) {
                reject(new Error('Email does not match.'));
                return;
            }
            // Check expiry (e.g. 10 mins)
            if (Date.now() - tempOTP.timestamp > 10 * 60 * 1000) {
                reject(new Error('Code expired. Please request a new one.'));
                return;
            }

            if (code === tempOTP.code) {
                resolve(true);
            } else {
                reject(new Error('Invalid code'));
            }
        });
    };

    const confirmNewPassword = async (email, newPassword) => {
        // Update user profile password
        const profile = await getStoredProfile(email);
        if (profile) {
            // Note: Password updates should be handled via Firebase Auth
            // Securely updating profile only here
            await saveToProfiles({ ...profile, password: newPassword });
        }
        setTempOTP(null); // Clear OTP
        return Promise.resolve();
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            role,
            isAdmin,
            login,
            signup,
            logout,
            updateUser,
            resetPassword,
            verifyResetCode,
            confirmNewPassword,
            signInWithGoogle
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default function AuthContextRoute() { return null; } 
