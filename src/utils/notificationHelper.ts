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

        // Truncate body if too long for initial view
        const maxLength = 60;
        const truncatedBody = body.length > maxLength
            ? body.substring(0, maxLength) + '...'
            : body;

        const isEmergency = channelId === 'emergency';

        await notifee.displayNotification({
            title: title,
            body: truncatedBody,
            android: {
                channelId: channelId,
                importance: isEmergency ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
                pressAction: {
                    id: 'default',
                },
                // Ikon kecil (silhouette)
                smallIcon: 'ic_launcher',
                // Ikon besar dengan resolusi yang lebih baik & bulat (TikTok-style)
                largeIcon: isEmergency
                    ? 'https://cdn-icons-png.flaticon.com/512/564/564619.png'
                    : undefined,
                // Gunakan BigText style agar posisi ikon di sebelah kanan lebih 'rapi' & 'ke tengah'
                style: isEmergency ? {
                    type: AndroidStyle.BIGTEXT,
                    text: body,
                    title: title,
                } : undefined,
                // Warna aksen lingkaran untuk ikon kecil
                color: isEmergency ? '#FF0000' : undefined,
            },
        });
    }
}

export const notificationHelper = new NotificationHelper();
