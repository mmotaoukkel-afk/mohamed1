import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        // alert('Failed to get push token for push notification!');
        console.log('Failed to get push token for push notification!');
        return;
    }

    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
    // console.log(token);

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

export async function sendWelcomeNotification(username) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Welcome to Funny Shop! 🎉",
            body: `Hi ${username}, we're glad you're here! Check out our latest collection with 50% OFF!`,
            data: { screen: 'Home' },
        },
        trigger: { seconds: 2 }, // Show after 2 seconds
    });
}

export async function sendNewProductNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "New Arrival Alert! 🔥",
            body: "Just dropped: Premium Summer Hoodie. Tap to view details!",
            data: { screen: 'NewArrivals' },
        },
        trigger: { seconds: 5 }, // Simulate delay
    });
}

export async function sendOrderUpdateNotification(orderId, status) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: `Order Update #${orderId} 📦`,
            body: `Your order is now ${status}. Track it in the app!`,
            data: { screen: 'OrderTracking', orderId: orderId },
        },
        trigger: null, // Send immediately
    });
}
