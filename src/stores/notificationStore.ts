import { create } from 'zustand';
import api from '../config/api';
import { notificationMock } from '../data/serviceDetailMock';
import { notificationHelper } from '../utils/notificationHelper';
import { playEmergencySound, playSuccessSound } from '../utils/soundPlayer';

interface NotificationState {
    notifications: any[];
    loading: boolean;
    lastNotifiedId: number | null;
    fetchNotifications: (silent?: boolean) => Promise<void>;
    sendNotification: (data: any, retries?: number) => Promise<boolean>;
    startPolling: () => void;
    stopPolling: () => void;
}

let pollingInterval: any = null;

const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    loading: false,
    lastNotifiedId: null,

    fetchNotifications: async (silent = false) => {
        if (!silent) set({ loading: true });
        try {
            const res = await api.get('/notifikasi');
            const data = res.data.data.content || [];

            // Detect new notifications to show in status bar
            if (data.length > 0) {
                const latest = data[0];
                const { lastNotifiedId, notifications } = get();

                // Check if this is a new notification we haven't seen/notified yet
                // Notified if it's newer than our lastNotifiedId AND not in our current list (to avoid notifying on first load)
                const isNew = lastNotifiedId !== null && latest.id > lastNotifiedId;

                if (isNew) {
                    // Show in status bar
                    notificationHelper.displayNotification(
                        latest.judul || "Notifikasi Baru",
                        latest.pesan || "",
                        latest.judul === "Pesan Darurat!" ? 'emergency' : 'default'
                    );

                    // Play sound if emergency
                    if (latest.judul === "Pesan Darurat!") {
                        playEmergencySound();
                    } else {
                        playSuccessSound();
                    }
                }

                // Update lastNotifiedId to the absolute latest id found
                set({
                    notifications: data,
                    lastNotifiedId: latest.id
                });
            } else {
                set({ notifications: [] });
            }
        } catch (error) {
            set({ notifications: notificationMock });
        } finally {
            if (!silent) set({ loading: false });
        }
    },

    sendNotification: async (data: any, retries = 5) => {
        try {
            const response = await api.post('/notifikasi', data);

            if (response.data.success && response.data.data) {
                const newNotif = response.data.data;
                set((state) => ({
                    notifications: [newNotif, ...state.notifications],
                    lastNotifiedId: Math.max(state.lastNotifiedId || 0, newNotif.id)
                }));
            }

            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "";
            const status = error.response?.status;

            // Retry if backend hasn't finished indexing the event (404 or specific message)
            if (retries > 0 && (errorMessage.includes("Event not found") || status === 404 || status === 500)) {
                console.log(`Notification retry (${retries} left) for event ${data.eventId}...`);
                await new Promise(resolve => setTimeout(() => resolve(null), 3000));
                return get().sendNotification(data, retries - 1);
            }

            // Use console.log instead of console.error to avoid the red screen in development
            // since the main emergency report has already been successfully created.
            console.log("Notification sync failed (final):", error.response?.data || error.message);
            return false;
        }
    },

    startPolling: () => {
        if (pollingInterval) return;

        // Initial fetch to set baseline lastNotifiedId without triggering alerts
        get().fetchNotifications(true);

        pollingInterval = setInterval(() => {
            get().fetchNotifications(true);
        }, 15000); // Poll every 15 seconds
    },

    stopPolling: () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }
}));

export default useNotificationStore;
