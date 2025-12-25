import { create } from 'zustand';
import api from '../config/api';
import { notificationMock } from '../data/serviceDetailMock';
import { notificationHelper } from '../utils/notificationHelper';
import { playEmergencySound, playSuccessSound } from '../utils/soundPlayer';

interface NotificationState {
    notifications: any[];
    loading: boolean;
    lastNotifiedAt: string | null;
    notifiedIds: string[]; // Track triggered IDs to prevent duplicates
    fetchNotifications: (silent?: boolean) => Promise<void>;
    sendNotification: (data: any, retries?: number) => Promise<boolean>;
    startPolling: () => void;
    stopPolling: () => void;
}

let pollingInterval: any = null;

const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    loading: false,
    lastNotifiedAt: null,
    notifiedIds: [],

    fetchNotifications: async (silent = false) => {
        if (!silent) set({ loading: true });
        try {
            const res = await api.get('/notifikasi', {
                params: {
                    sort: 'createdAt,desc'
                }
            });
            const data = res.data.data.content || [];
            // Process data: Rename and categorize backend notifications
            const processedData = data.map((item: any) => {
                const titleLower = (item.judul || '').toLowerCase();

                // 1. Rename "Pengaduan Baru"
                if (titleLower === 'pengaduan baru') {
                    return { ...item, judul: 'Aduan Warga', category: 'PENGADUAN' };
                }

                // 2. Ensure Agendas/Events have the right category for the Megaphone icon
                if (titleLower.includes('agenda baru') || titleLower.includes('layanan baru') || titleLower.includes('pengaturan baru')) {
                    return { ...item, category: item.category || 'EVENT' };
                }

                return item;
            });

            // Detect new notifications to show in status bar
            if (processedData.length > 0) {
                const latest = processedData[0];
                const { lastNotifiedAt, notifiedIds } = get();
                const latestTime = latest.createdAt;

                const isNew = lastNotifiedAt !== null && latestTime > lastNotifiedAt;
                const isAlreadyVisible = latest.id && notifiedIds.includes(String(latest.id));

                if (isNew && !isAlreadyVisible) {
                    // Show in status bar
                    notificationHelper.displayNotification(
                        latest.judul || "Notifikasi Baru",
                        latest.pesan || "",
                        (latest.category === 'DARURAT' || latest.judul === 'Pesan Darurat!') ? 'emergency' : 'default',
                        latest
                    );

                    // Add to tracked IDs
                    if (latest.id) {
                        set({ notifiedIds: [...notifiedIds.slice(-49), String(latest.id)] });
                    }
                }

                set({
                    notifications: processedData,
                    lastNotifiedAt: latestTime
                });
            } else {
                set({ notifications: [] });
            }
        } catch (error: any) {
            console.log('Fetch notifications failed:', error);
            if (error.response?.status === 500 && !silent) {
                const toast = require('./toastStore').default;
                toast.getState().showToast('Gagal memuat notifikasi: Server Error (ID Type Mismatch)', 'error');
            }
            set({ notifications: notificationMock });
        } finally {
            if (!silent) set({ loading: false });
        }
    },

    sendNotification: async (data: any, retries = 5) => {
        try {
            // Include 'read: false' as default for new column
            const payload = { ...data, read: false };
            const response = await api.post('/notifikasi', payload);

            if (response.data.success && response.data.data) {
                // Merge response with input data to ensure metadata exists (in case backend doesn't return it)
                const newNotif = response.data.data;
                const finalNotif = {
                    ...data, // Original input (contains eventId, category, etc.)
                    ...newNotif, // Server response (contains id, createdAt)
                    category: data.category || newNotif.category
                };

                // Trigger local notification immediately
                notificationHelper.displayNotification(
                    finalNotif.judul || "Notifikasi Baru",
                    finalNotif.pesan || "",
                    (finalNotif.category === 'DARURAT' || finalNotif.judul === "Pesan Darurat!") ? 'emergency' : 'default',
                    finalNotif
                );

                set((state) => {
                    const updatedNotifiedIds = finalNotif.id
                        ? [...state.notifiedIds.slice(-49), String(finalNotif.id)]
                        : state.notifiedIds;

                    return {
                        notifications: [finalNotif, ...state.notifications],
                        lastNotifiedAt: finalNotif.createdAt || new Date().toISOString(),
                        notifiedIds: updatedNotifiedIds
                    };
                });
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
