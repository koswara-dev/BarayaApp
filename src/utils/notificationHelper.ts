import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
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
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                description: 'Notifikasi untuk laporan darurat Anda',
            });

            // Channel untuk Informasi Umum
            await notifee.createChannel({
                id: 'default',
                name: 'Informasi Umum',
                importance: AndroidImportance.DEFAULT,
            });
        }
    }

    // Menampilkan notifikasi lokal
    async displayNotification(title: string, body: string, channelId: 'emergency' | 'default' = 'default') {
        // Minta izin (untuk Android 13+)
        await notifee.requestPermission();

        await notifee.displayNotification({
            title: title,
            body: body,
            android: {
                channelId: channelId,
                importance: channelId === 'emergency' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
                pressAction: {
                    id: 'default',
                },
                // Ikon kecil (pastikan ada ic_launcher di drawable)
                smallIcon: 'ic_launcher',
            },
        });
    }
}

export const notificationHelper = new NotificationHelper();
