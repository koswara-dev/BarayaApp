import notifee, { AndroidImportance, AndroidVisibility, AndroidStyle } from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationHelper {
    // Inisialisasi channel untuk Android
    async createChannels() {
        if (Platform.OS === 'android') {
            // Channel untuk Keadaan Darurat (Prioritas Sangat Tinggi)
            await notifee.createChannel({
                id: 'emergency',
                name: 'Layanan Darurat',
                lights: true,
                vibration: true,
                sound: 'alarm',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                description: 'Notifikasi untuk laporan darurat Anda',
            });

            // Channel untuk Informasi Umum
            await notifee.createChannel({
                id: 'default',
                name: 'Informasi Umum',
                importance: AndroidImportance.HIGH, // Changed to HIGH to ensure popup
                visibility: AndroidVisibility.PUBLIC,
            });
        }
    }

    // Menampilkan notifikasi lokal
    async displayNotification(title: string, body: string, channelId: 'emergency' | 'default' = 'default', data?: any) {
        // Minta izin (untuk Android 13+)
        await notifee.requestPermission();

        // Truncate body if too long for initial view
        const maxLength = 60;
        const truncatedBody = body.length > maxLength
            ? body.substring(0, maxLength) + '...'
            : body;

        const isEmergency = channelId === 'emergency';
        let largeIcon = '';

        if (isEmergency) {
            largeIcon = 'https://cdn-icons-png.flaticon.com/512/564/564619.png'; // Red Triangle
        } else if (data?.category === 'EVENT') {
            largeIcon = 'https://cdn-icons-png.flaticon.com/512/1243/1243566.png'; // Blue Megaphone
        } else if (data?.category === 'PENGADUAN') {
            largeIcon = 'https://cdn-icons-png.flaticon.com/512/3233/3233497.png'; // Yellow Megaphone
        } else {
            // Default
            largeIcon = 'https://cdn-icons-png.flaticon.com/512/1156/1156949.png';
        }

        const androidConfig: any = {
            channelId: channelId,
            sound: isEmergency ? 'alarm' : 'default',
            importance: isEmergency ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
            pressAction: {
                id: 'default',
            },
            smallIcon: 'ic_launcher',
            largeIcon: largeIcon,
        };

        if (isEmergency || data?.category === 'EVENT' || data?.category === 'PENGADUAN') {
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
