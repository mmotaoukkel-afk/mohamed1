/**
 * Notification Context - Kataraa
 * Manages user notifications, persistence, and state.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Direct Firebase import to avoid circular dependency with AuthContext
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserPushToken } from '../services/adminNotificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    // Maintain local user state for storage isolation
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadedUserEmail, setLoadedUserEmail] = useState(null);
    const [expoPushToken, setExpoPushToken] = useState('');
    const [registrationError, setRegistrationError] = useState(null);
    const { t } = useTranslation();
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });

        // Initialize Push Notifications
        registerForPushNotificationsAsync()
            .then(token => {
                if (token) {
                    setExpoPushToken(token);
                    setRegistrationError(null);
                    console.log('📬 Push Token:', token);
                } else {
                    setRegistrationError('فشل الحصول على التوكن - قد يكون السبب عدم وجود Project ID في app.json');
                }
            })
            .catch(err => {
                console.error('Push Registration Error:', err);
                setRegistrationError(err.message || 'خطأ غير معروف في التسجيل');
            });

        // Listen for foreground notifications
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            const { title, body, data } = notification.request.content;

            // Add to local list only if it's a remote push (not triggered locally)
            if (!data?.isLocal) {
                const newNotif = {
                    id: notification.request.identifier,
                    title: title,
                    message: body,
                    type: data?.type || 'info',
                    params: data || {},
                    time: new Date().toISOString(),
                    read: false,
                };
                setNotifications(prev => [newNotif, ...prev]);
            }
            console.log('🔔 Notification Received:', title);
        });

        // Listen for user interaction with notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const { type, orderId } = response.notification.request.content.data;
            console.log('🖱️ Notification Interaction:', type, orderId);
        });

        return () => {
            unsubscribe();
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    // Sync token to Firestore whenever user or token changes
    useEffect(() => {
        const syncToken = async () => {
            if (user?.uid && expoPushToken) {
                // Determine role from Firestore or use a default
                let userRole = 'customer';
                try {
                    const { getUserRole } = await import('../services/userService');
                    userRole = await getUserRole(user.uid);
                } catch (e) {
                    console.error('Failed to get role for token sync:', e);
                }

                saveUserPushToken(user.uid, expoPushToken, {
                    email: user.email,
                    displayName: user.displayName,
                    role: userRole, // CRITICAL: Save role so getAdminPushTokens picks it up
                    platform: Platform.OS,
                    model: Device.modelName,
                    lastActive: new Date().toISOString()
                });
            }
        };
        syncToken();
    }, [user, expoPushToken]);

    useEffect(() => {
        loadNotifications();
    }, [user]);

    useEffect(() => {
        if (!loading && user?.email && user.email === loadedUserEmail) {
            const key = `@kataraa_notifications_${user.email.toLowerCase()}`;
            AsyncStorage.setItem(key, JSON.stringify(notifications));
        }
    }, [notifications, loading, user, loadedUserEmail]);

    const loadNotifications = async () => {
        if (!user?.email) {
            setNotifications([]);
            setLoadedUserEmail(null);
            // Don't set loading false immediately if we are just switching users, 
            // but here we might be strictly logging out.
            // If user is null, we clear notifications.
            setLoading(false);
            return;
        }

        setLoading(true);
        setNotifications([]); // Clear for new user

        try {
            const key = `@kataraa_notifications_${user.email.toLowerCase()}`;
            const saved = await AsyncStorage.getItem(key);
            if (saved) {
                setNotifications(JSON.parse(saved));
            } else {
                setNotifications([]);
            }
            setLoadedUserEmail(user.email);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const addNotification = async (titleKey, messageKey, type = 'info', params = {}) => {
        // Translate content if they look like keys
        const translatedTitle = t(titleKey, params);
        const translatedMessage = t(messageKey, params);

        const newNotif = {
            id: Date.now().toString(),
            title: translatedTitle,
            message: translatedMessage,
            type,
            params,
            time: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);

        // Also trigger a system notification (Status Bar)
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: translatedTitle,
                    body: translatedMessage,
                    data: { ...params, type, isLocal: true },
                },
                trigger: null, // Show immediately
            });
        } catch (error) {
            console.log('Error showing system notification:', error);
        }
    };

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const clearNotifications = () => {
        setNotifications([]);
    };



    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            unreadCount,
            loading,
            expoPushToken,
            registrationError
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        const channelRes = await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
        console.log('🔔 Android Channel Created:', channelRes ? 'Success' : 'Failed');
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.warn('❌ Permission not granted for push notifications!');
            return;
        }

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            console.log('🔑 EAS Project ID:', projectId || 'MISSING');

            if (!projectId) {
                console.warn('⚠️ No EAS Project ID found in config. Check your app.json.');
                // We typically stop here, but let's try getting token anyway (might fail or warn)
            }

            // Timeout token fetch to prevent stalling (max 10s now)
            const tokenPromise = Notifications.getExpoPushTokenAsync({ projectId });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Push token timeout (10s)')), 10000)
            );

            const tokenData = await Promise.race([tokenPromise, timeoutPromise]);
            token = tokenData.data;
            console.log('✅ Token Generated:', token);
        } catch (e) {
            console.error('❌ Push registration failed:', e.message);
            // Non-blocking: App continues even if notifications fail
        }
    } else {
        console.log('⚠️ Physical device required for Push Notifications');
    }

    return token;
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

// Default export for Expo Router compatibility
export default function NotificationContextRoute() { return null; }
