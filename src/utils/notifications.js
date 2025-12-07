import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we're in Expo Go (which doesn't support push notifications in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

let Notifications;

if (!isExpoGo) {
    try {
        // Only require expo-notifications if NOT in Expo Go to avoid side-effect crashes
        Notifications = require('expo-notifications');

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    } catch (error) {
        console.log('Notification handler setup skipped (Expo Go environment or module missing)');
    }
}

export async function registerForPushNotificationsAsync() {
    // Skip in Expo Go
    if (isExpoGo || !Notifications) {
        console.log('Push notifications are not available in Expo Go. Use a development build.');
        return null;
    }

    try {
        let token;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        // Get the token
        // Note: In some versions getExpoPushTokenAsync might need projectId
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;

        return token;
    } catch (error) {
        console.log('Error registering for push notifications:', error.message);
        return null;
    }
}

export async function sendWelcomeNotification(username) {
    if (isExpoGo || !Notifications) {
        console.log(`[Demo] Welcome notification would be sent to ${username}`);
        return;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Welcome to Fashion Store! 🎉",
                body: `Hi ${username}, we're glad you're here! Check out our latest collection with 50% OFF!`,
                data: { screen: 'Home' },
            },
            trigger: { seconds: 2 },
        });
    } catch (error) {
        console.log('Error sending welcome notification:', error.message);
    }
}

export async function sendNewProductNotification() {
    if (isExpoGo || !Notifications) {
        console.log('[Demo] New product notification would be sent');
        return;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "New Arrival Alert! 🔥",
                body: "Just dropped: Premium Summer Hoodie. Tap to view details!",
                data: { screen: 'NewArrivals' },
            },
            trigger: { seconds: 5 },
        });
    } catch (error) {
        console.log('Error sending new product notification:', error.message);
    }
}

export async function sendOrderUpdateNotification(orderId, status) {
    if (isExpoGo || !Notifications) {
        console.log(`[Demo] Order update notification would be sent for order #${orderId}: ${status}`);
        return;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `Order Update #${orderId} 📦`,
                body: `Your order is now ${status}. Track it in the app!`,
                data: { screen: 'OrderTracking', orderId: orderId },
            },
            trigger: null,
        });
    } catch (error) {
        console.log('Error sending order update notification:', error.message);
    }
}
