import { AppRegistry } from 'react-native';
import notifee, { EventType, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { getMessaging, setBackgroundMessageHandler, requestPermission } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import useNotificationStore from './src/stores/notificationStore';

// Register background handler
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);

    // If the message contains a notification payload, the system handles it automatically.
    // We return early to avoid showing a duplicate notification.
    if (remoteMessage.notification) {
        return;
    }
    
    // Import helper dynamically to ensure it's initialized in the background context
    const { notificationHelper } = require('./src/utils/notificationHelper');

    // Extract title and body from data (since notification payload is null)
    const title = remoteMessage.data?.title ? String(remoteMessage.data.title) : 'Baraya App';
    const body = remoteMessage.data?.body ? String(remoteMessage.data.body) : 'Notifikasi Baru';
    const data = remoteMessage.data;

    // Display notification locally
    // This is crucial for "data-only" messages
    // Determine channel based on data.category or data.type
    const category = data?.category || data?.type || 'default'; 
    let channelId = 'default';
    
    // Explicitly check for DARURAT to ensure alarm sound
    if (category === 'DARURAT' || category === 'darurat') {
        channelId = 'darurat';
        
        // Ensure critical channel exists with correct sound settings
        // This acts as a safeguard if the app hasn't run createChannels() yet
        await notifee.createChannel({
            id: 'darurat',
            name: 'Layanan Darurat',
            lights: true,
            vibration: true,
            sound: 'alarm',
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            bypassDnd: true
        });
    } else if (category === 'SAMSAT') {
        channelId = 'samsat';
    } else if (category === 'EVENT') {
        channelId = 'event';
    } else if (category === 'PENGADUAN' || category === 'pengaduan') {
        // Handle silently or specific channel
        // channelId = 'pengaduan'; // If we want to show it
        return; // Current logic returns early
    } else if (category === 'BERITA') {
        channelId = 'berita';
    }

    await notificationHelper.displayNotification(title, body, channelId, data);
});

// Register background handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    const useAuthStore = require('./src/stores/authStore').default;

    // Check if the user pressed the "Mark as read" action
    if (type === EventType.ACTION_PRESS && pressAction?.id === 'mark-as-read') {
        
        // Ensure auth is loaded (token might be null in background/headless mode)
        const token = useAuthStore.getState().token;
        if (!token) {
            console.log('Background: Token missing, attempting to hydrate...');
            await useAuthStore.getState().checkAuth();
        }

        // Update external API (if needed) or local storage
        console.log('User marked notification as read in background', notification?.id);

        if (notification?.data?.id) {
             await useNotificationStore.getState().markAsRead(String(notification.data.id));
        }

        // Remove the notification
        if (notification?.id) {
            await notifee.cancelNotification(notification.id);
        }
    }

    console.log('Background Event:', type, detail);
});

AppRegistry.registerComponent(appName, () => App);
