import { create } from 'zustand';
import api from '../config/api';
import useAuthStore from './authStore';
import { notificationMock } from '../data/serviceDetailMock';
import { notificationHelper } from '../utils/notificationHelper';
import { playEmergencySound, playSuccessSound } from '../utils/soundPlayer';

export interface NotificationItem {
    id: string;
    judul: string;
    pesan: string;
    category: 'PENGADUAN' | 'DARURAT' | 'EVENT' | string;
    referenceId: number;
    createdAt: string;
    updatedAt: string;
    read: boolean;
    dinasId?: number;
}

interface NotificationState {
    notifications: NotificationItem[];
    loading: boolean;
    loadingMore: boolean; // separate loading state for infinite scroll
    page: number;
    hasMore: boolean;
    lastNotifiedAt: string | null;
    notifiedIds: string[];
    filterDinasId: string | undefined;
    filterCamatId: number | undefined;
    filterUserId: string | undefined;
    fetchNotifications: (silent?: boolean, dinasId?: string, camatId?: number, isLoadMore?: boolean, userId?: string) => Promise<void>;
    loadMoreNotifications: () => Promise<void>;
    getNotificationById: (id: string) => Promise<NotificationItem | null>;
    sendNotification: (data: any, retries?: number) => Promise<boolean>;
    markAsRead: (id: string) => Promise<void>;
    startPolling: () => void;
    stopPolling: () => void;
}

let pollingInterval: any = null;

const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    loading: false,
    loadingMore: false,
    page: 0,
    hasMore: true,
    lastNotifiedAt: null,
    notifiedIds: [],
    filterDinasId: undefined,
    filterCamatId: undefined,
    filterUserId: undefined,

    fetchNotifications: async (silent = false, dinasId?: string, camatId?: number, isLoadMore = false, userId?: string) => {
        const currentState = get();
        
        // Prevent race conditions
        if (isLoadMore && (currentState.loadingMore || !currentState.hasMore)) return;

        if (isLoadMore) {
            set({ loadingMore: true });
        } else if (!silent) {
            set({ loading: true });
        }

        // Update stored filter if provided explicitly (usually on first load/refresh)
        if (!isLoadMore) {
            if (dinasId !== undefined) set({ filterDinasId: dinasId });
            if (camatId !== undefined) set({ filterCamatId: camatId });
            if (userId !== undefined) set({ filterUserId: userId });
        }

        try {
            const nextPage = isLoadMore ? currentState.page + 1 : 0;
            const size = 20;
            const currentFilterDinasId = isLoadMore ? currentState.filterDinasId : dinasId;
            const currentFilterCamatId = isLoadMore ? currentState.filterCamatId : camatId;
            const currentFilterUserId = isLoadMore ? currentState.filterUserId : userId;

            const params: any = { 
                sort: 'createdAt,desc',
                page: nextPage,
                size: size
            };
            
            const user = useAuthStore.getState().user;
            
            if (currentFilterDinasId) {
                params.dinasId = currentFilterDinasId;
            } else if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
                 // Auto-inject dinasId for ADMIN/STAFF if not explicitly provided
                 if (user.dinasId) {
                     params.dinasId = user.dinasId;
                 }
            }

            if (currentFilterCamatId) {
                params.camatId = currentFilterCamatId;
            } else if (user?.camatId) {
                params.camatId = user.camatId;
            }

            if (currentFilterUserId) {
                params.userId = currentFilterUserId;
            }

            const res = await api.get('/notifikasi', { params });
            const rawData = res.data.data.content || [];
            
            // Allow Mock data fallback if API returns empty on first load (mostly for dev environment resilience)
            // But if we are paging, empty means empty.
            if (!isLoadMore && rawData.length === 0 && !res.data.success) {
                 // only fallback if it was an error or totally empty on page 0 and we want to show mocks (optional)
                 // For now, let's respect the empty response
            }

            const processedData = rawData.map((item: any) => {
                const titleLower = (item.judul || '').toLowerCase();
                let newItem = { ...item };

                // Normalize read status
                if (newItem.read === undefined && newItem.isRead !== undefined) {
                    newItem.read = newItem.isRead;
                }

                if (titleLower === 'pengaduan baru') {
                    newItem.judul = 'Aduan Warga';
                    newItem.category = 'PENGADUAN';
                }

                if (titleLower.includes('agenda baru') || titleLower.includes('layanan baru') || titleLower.includes('pengaturan baru')) {
                    newItem.category = newItem.category || 'EVENT';
                }

                return newItem;
            });

            // Logic for Polling/First Page vs Load More
            if (isLoadMore) {
                // Append
                set((state) => ({
                    notifications: [...state.notifications, ...processedData],
                    page: nextPage,
                    hasMore: processedData.length === size,
                    loadingMore: false
                }));
            } else {
                // Refresh / Poll (Page 0)
                // If polling, we might want to check for new items for notification bar
                if (processedData.length > 0) {
                    const latest = processedData[0];
                    const { lastNotifiedAt, notifiedIds } = get();
                    const latestTime = latest.createdAt;
                    
                    const isNew = lastNotifiedAt === null ? false : (new Date(latestTime) > new Date(lastNotifiedAt));
                    const isAlreadyVisible = latest.id && notifiedIds.includes(String(latest.id));
                    const isRead = latest.read === true;

                    if ((isNew || !isAlreadyVisible) && !isRead && !silent) { 
                         // Check silent flag to avoid spamming user if they just pulled to refresh manually
                         // Actually, polling passes silent=true usually. 
                         // Let's keep existing logic: show popup if it's new
                         if (!isAlreadyVisible) {
                            notificationHelper.displayNotification(
                                latest.judul || "Notifikasi Baru",
                                latest.pesan || "",
                                (latest.category === 'DARURAT' || latest.judul === 'Pesan Darurat!') ? 'darurat' : 'default',
                                latest
                            );
                            if (latest.id) {
                                set({ notifiedIds: [...notifiedIds.slice(-49), String(latest.id)] });
                            }
                         }
                    }

                    set({ 
                        notifications: processedData, 
                        lastNotifiedAt: latestTime,
                        page: 0,
                        hasMore: processedData.length === size
                    });
                } else {
                    set({ notifications: [], page: 0, hasMore: false });
                }
            }

        } catch (error: any) {
            console.log('Fetch notifications failed:', error);
            if (!silent && !isLoadMore) {
                set({ notifications: notificationMock }); // Fallback on error only for page 0
            }
        } finally {
            if (!silent && !isLoadMore) set({ loading: false });
            if (isLoadMore) set({ loadingMore: false });
        }
    },

    loadMoreNotifications: async () => {
        return get().fetchNotifications(false, undefined, undefined, true);
    },

    markAsRead: async (id: string) => {
        try {
            // Update local immediately for responsiveness
            set(state => ({
                notifications: state.notifications.map(n => 
                    String(n.id) === String(id) ? { ...n, read: true, isRead: true } : n
                )
            }));

            // Call API - Send both for maximum compatibility with backend DTOs
            // Backend might be using 'read' or 'isRead'. Sending both is safer.
            await api.put(`/notifikasi/${id}`, { read: true, isRead: true });
        } catch (error) {
            console.log('Failed to mark notification as read:', error);
        }
    },

    getNotificationById: async (id: string) => {
        set({ loading: true });
        try {
            const response = await api.get(`/notifikasi/${id}`);
            
            // Auto mark as read when viewing detail
            get().markAsRead(id);
            
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            console.log('Get notification detail failed:', error);
            set({ loading: false });
            return null;
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
                    (finalNotif.category === 'DARURAT' || finalNotif.judul === "Pesan Darurat!") ? 'darurat' : 'default',
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
