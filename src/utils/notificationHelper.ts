import notifee, { AndroidImportance, AndroidVisibility, AndroidStyle } from '@notifee/react-native';
import { Platform } from 'react-native';
import { getMessaging, AuthorizationStatus, getToken, requestPermission, subscribeToTopic, onMessage } from '@react-native-firebase/messaging';

class NotificationHelper {
    // Inisialisasi channel untuk Android
    async createChannels() {
        if (Platform.OS === 'android') {
            // Hapus channel lama untuk memastikan update setting (terutama sound)
            await notifee.deleteChannel('darurat');
            await notifee.deleteChannel('default');
            await notifee.deleteChannel('event');
            await notifee.deleteChannel('pengaduan');
            await notifee.deleteChannel('berita');
            await notifee.deleteChannel('samsat');

            // Channel untuk Keadaan Darurat (Prioritas Sangat Tinggi)
            await notifee.createChannel({
                id: 'darurat',
                name: 'Layanan Darurat',
                lights: true,
                vibration: true,
                sound: 'alarm',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                description: 'Notifikasi untuk laporan darurat Anda',
                bypassDnd: true
            });

            // Channel untuk Informasi Umum
            await notifee.createChannel({
                id: 'default',
                name: 'Informasi Umum',
                importance: AndroidImportance.HIGH, 
                visibility: AndroidVisibility.PUBLIC,
                sound: 'default',
            });

            // Channel untuk Event
            await notifee.createChannel({
                id: 'event',
                name: 'Event & Agenda',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                description: 'Notifikasi update event dan agenda terkini',
                sound: 'default',
            });

            // Channel untuk Pengaduan
            await notifee.createChannel({
                id: 'pengaduan',
                name: 'Update Pengaduan',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                description: 'Notifikasi perkembangan status pengaduan Anda',
                sound: 'default',
            });

            // Channel untuk Berita
            await notifee.createChannel({
                id: 'berita',
                name: 'Berita Terkini',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                description: 'Notifikasi berita terkini dan pengumuman',
                sound: 'default',
            });

            // Channel untuk Samsat
            await notifee.createChannel({
                id: 'samsat',
                name: 'Info Samsat',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                description: 'Notifikasi informasi dan layanan Samsat',
                sound: 'default',
            });
        }
        
        // Request Permissions and Get Token for debugging
        await this.requestUserPermission();
        await this.getFCMToken();
    }

    // Meminta izin notifikasi (FCM + Notifee)
    async requestUserPermission() {
        const messaging = getMessaging();
        const authStatus = await requestPermission(messaging);
        const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('Authorization status:', authStatus);
        }
        
        // Juga minta izin native (Android 13+)
        if (Platform.OS === 'android') {
             await notifee.requestPermission();
        }
        
        return enabled;
    }

    // Mendapatkan FCM Token
    async getFCMToken() {
        try {
            const messaging = getMessaging();
            const token = await getToken(messaging);
            console.log('FCM Token:', token);
            return token;
        } catch (error) {
            console.error("FCM Token Error", error);
            return null;
        }
    }

    // Subscribe ke topic (Darurat, Event, Pengaduan)
    async subscribeToTopics() {
        try {
            const messaging = getMessaging();
            // await subscribeToTopic(messaging, 'darurat');
            // await subscribeToTopic(messaging, 'pengaduan');
            await subscribeToTopic(messaging, 'event');
            await subscribeToTopic(messaging, 'berita');
            await subscribeToTopic(messaging, 'samsat');
            console.log('Subscribed to topics: event, berita, samsat');
        } catch (error) {
            console.error('Failed to subscribe to topics:', error);
        }
    }


    // Setup listener untuk pesan saat aplikasi di foreground
    setupFCMListener() {
        const messaging = getMessaging();
         return onMessage(messaging, async remoteMessage => {
            console.log('A new FCM message arrived!', remoteMessage);
            
            // Mapping FCM ke format notifikasi kita
            const title = remoteMessage.notification?.title || (remoteMessage.data?.title ? String(remoteMessage.data.title) : 'Notification');
            const body = remoteMessage.notification?.body || (remoteMessage.data?.body ? String(remoteMessage.data.body) : '');
            const data = remoteMessage.data;
            
            // Determine channel based on data.category or data.type
            const category = data?.category || data?.type || 'default'; 
            let channelId: any = 'default';
            
            if (category === 'DARURAT' || category === 'darurat') {
                 channelId = 'darurat';
            } else if (category === 'SAMSAT') {
                 channelId = 'samsat';
            } else if (category === 'EVENT') {
                 channelId = 'event';
            } else if (category === 'PENGADUAN' || category === 'pengaduan') {
                 return;
            } else if (category === 'BERITA') {
                 channelId = 'berita';
            }
            
            // Tampilkan notifikasi menggunakan Notifee agar konsisten
            await this.displayNotification(title, body, channelId, data);
        });
    }

    // Menampilkan notifikasi lokal
    async displayNotification(title: string, body: string, channelId: 'darurat' | 'default' = 'default', data?: any) {
        // Minta izin (untuk Android 13+)
        await notifee.requestPermission();
        try {
            await requestPermission(getMessaging());
        } catch (e) {
            console.log('FCM permission check failed', e);
        }

        // Truncate body if too long for initial view
        const maxLength = 60;
        const truncatedBody = body.length > maxLength
            ? body.substring(0, maxLength) + '...'
            : body;

        // Auto-detect emergency from data if not explicitly set
        // Priority: channelId -> data.category -> data.type
        const category = data?.category || data?.type || 'default';
        const isEmergency = channelId === 'darurat' || category === 'DARURAT' || category === 'darurat';
        
        // Force channel ID for emergency to ensure high priority
        let effectiveChannelId = isEmergency ? 'darurat' : channelId;
        
        // Determine sound
        const soundName = isEmergency ? 'alarm' : 'default';

        if (!isEmergency) {
            // Re-map other channels if needed
            if (category === 'EVENT') effectiveChannelId = 'event';
            else if (category === 'PENGADUAN' || category === 'pengaduan') effectiveChannelId = 'pengaduan';
            else if (category === 'BERITA') effectiveChannelId = 'berita';
            else if (category === 'SAMSAT') effectiveChannelId = 'samsat';
        }

        let largeIcon = '';

        if (isEmergency) {
            largeIcon = 'https://cdn-icons-png.flaticon.com/512/564/564619.png'; // Red Triangle
        } else if (category === 'EVENT') {
            largeIcon = 'https://img.icons8.com/?size=100&id=10062&format=png&color=FAB005'; // Blue Megaphone
        } else if (category === 'PENGADUAN' || category === 'pengaduan') {
            largeIcon = 'https://img.icons8.com/?size=100&id=4ncnsVkeLfwV&format=png&color=000000'; // Yellow Megaphone
        } else if (category === 'BERITA') {
            largeIcon = 'https://img.icons8.com/?size=100&id=9981&format=png&color=FAB005'; // News Icon
        } else if (category === 'SAMSAT') {
            largeIcon = 'https://img.icons8.com/?size=100&id=dPULK2Qt6ziM&format=png&color=FAB005'; // Car Icon
        } else {
            // Default
            largeIcon = 'https://img.icons8.com/?size=100&id=LF602lAhk08H&format=png&color=FAB005';
        }

        const androidConfig: any = {
            channelId: effectiveChannelId,
            sound: soundName,
            importance: isEmergency ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
            pressAction: {
                id: 'default',
            },
            smallIcon: 'ic_launcher',
            largeIcon: largeIcon,
        };

        if (isEmergency || category === 'EVENT' || category === 'PENGADUAN' || category === 'pengaduan' || category === 'BERITA' || category === 'SAMSAT') {
            androidConfig.style = {
                type: AndroidStyle.BIGTEXT,
                text: body,
                title: title,
            };
        }

        // Sanitize data for Notifee (ensure flat structure with primitive values)
        const sanitizedData: any = {};
        if (data) {
            Object.keys(data).forEach(key => {
                const val = data[key];
                if (val === null || val === undefined) {
                    sanitizedData[key] = '';
                } else if (typeof val === 'object') {
                    try {
                        sanitizedData[key] = JSON.stringify(val);
                    } catch (e) {
                        sanitizedData[key] = String(val);
                    }
                } else {
                    // Notifee data values must be strings (or numbers in some versions, but boolean fails)
                    // Force text conversion for everything to be safe
                    sanitizedData[key] = String(val);
                }
            });
        }

        await notifee.displayNotification({
            title: title,
            body: truncatedBody,
            data: sanitizedData,
            android: androidConfig,
        });
    }

}

export const notificationHelper = new NotificationHelper();
