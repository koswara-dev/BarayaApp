import { create } from 'zustand';
import api from '../config/api';
import { notificationMock } from '../data/serviceDetailMock';

interface NotificationState {
    notifications: any[];
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    sendNotification: (data: any) => Promise<void>;
}

const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    loading: false,

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/notifikasi');
            set({ notifications: res.data.data.content });
        } catch (error) {
            console.log('API error, fallback mock');
            set({ notifications: notificationMock });
        } finally {
            set({ loading: false });
        }
    },

    sendNotification: async (data: any) => {
        try {
            await api.post('/notifikasi', data);
            // Optionally refresh notifications
        } catch (error) {
            console.error("Failed to send notification", error);
        }
    }
}));

export default useNotificationStore;
