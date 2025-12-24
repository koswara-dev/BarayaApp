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
                importance: AndroidImportance.DEFAULT,
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

        const androidConfig: any = {
            channelId: channelId,
            sound: isEmergency ? 'alarm' : 'default',
            importance: isEmergency ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
            pressAction: {
                id: 'default',
            },
            smallIcon: 'ic_launcher',
        };

        if (isEmergency) {
            androidConfig.largeIcon = 'https://cdn-icons-png.flaticon.com/512/564/564619.png';
            androidConfig.style = {
                type: AndroidStyle.BIGTEXT,
                text: body,
                title: title,
            };
        } else {
            // Gunakan icon Toa/Megaphone yang lebih jelas
            // androidConfig.largeIcon = 'https://cdn-icons-png.flaticon.com/512/1156/1156949.png';
        }

        await notifee.displayNotification({
            title: title,
            body: truncatedBody,
            data: data,
            android: androidConfig,
        });
    }
}

export const notificationHelper = new NotificationHelper();
