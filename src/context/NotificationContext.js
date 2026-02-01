/**
 * Notification Context - Kataraa
 * Manages user notifications, persistence, and state.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Direct Firebase import to avoid circular dependency with AuthContext
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    // Maintain local user state for storage isolation
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadedUserEmail, setLoadedUserEmail] = useState(null);
    const [expoPushToken, setExpoPushToken] = useState('');
    const { t } = useTranslation();
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });

        // Initialize Push Notifications
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                setExpoPushToken(token);
                console.log('📬 Push Token:', token);
            }
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
                    scope: data?.scope || 'app', // Default to app
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
            notificationListener.current && notificationListener.current.remove();
            responseListener.current && responseListener.current.remove();
        };
    }, []);

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
        const { scope = 'app', ...otherParams } = params;

        // Translate content if they look like keys
        const translatedTitle = t(titleKey, otherParams);
        const translatedMessage = t(messageKey, otherParams);

        const newNotif = {
            id: Date.now().toString(),
            title: translatedTitle,
            message: translatedMessage,
            type,
            scope,
            params: otherParams,
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
                    data: { ...otherParams, type, scope, isLocal: true },
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



    const unreadCount = notifications.filter(n => !n.read && n.scope !== 'admin').length;
    const adminUnreadCount = notifications.filter(n => !n.read && n.scope === 'admin').length;

    const appNotifications = notifications.filter(n => n.scope !== 'admin');
    const adminNotifications = notifications.filter(n => n.scope === 'admin');

    return (
        <NotificationContext.Provider value={{
            notifications,
            appNotifications,
            adminNotifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            unreadCount,
            adminUnreadCount,
            loading,
            expoPushToken
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.warn('Failed to get push token for push notification!');
            return;
        }

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (!projectId) {
                console.warn('No EAS Project ID found in config. Check your app.json.');
            }

            // Timeout token fetch to prevent stalling (max 5s)
            const tokenPromise = Notifications.getExpoPushTokenAsync({ projectId });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Push token timeout')), 5000)
            );

            token = (await Promise.race([tokenPromise, timeoutPromise])).data;
        } catch (e) {
            console.warn('Push notification registration skipped:', e.message);
            // Non-blocking: App continues even if notifications fail
        }
    } else {
        // Physical device required for Push Notifications
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
