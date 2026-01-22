import { create } from 'zustand';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';
import { Event, EventCreatePayload, EventUpdatePayload } from '../types/event';

interface EventState {
    events: Event[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;

    fetchEvents: (params?: { page?: number; size?: number; isLoadMore?: boolean; search?: string }) => Promise<void>;
    createEvent: (data: any) => Promise<any>;
    getEventById: (id: number) => Promise<Event | null>;
    updateEvent: (id: number, data: any) => Promise<any>;
    clearError: () => void;
}

const useEventStore = create<EventState>((set, get) => ({
    events: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    fetchEvents: async (params = {}) => {
        const { page = 0, size = 10, isLoadMore = false, search: title } = params;
        if (get().loading && isLoadMore) return;
        set({ loading: true, error: null });

        try {
            const apiParams: any = { page, size, sort: 'createdAt,desc' };
            if (title) apiParams.judul = title;

            const res = await api.get('/event', {
                params: apiParams
            });

            if (res.data.success) {
                const data = res.data.data;
                const content = data.content || [];
                const pagination = data.page || {};

                set((state) => ({
                    events: isLoadMore ? [...state.events, ...content] : content,
                    page: pagination.number || 0,
                    totalPages: pagination.totalPages || 0,
                    hasMore: (pagination.number + 1) < (pagination.totalPages || 0),
                }));
            } else {
                set({ error: res.data.message || 'Gagal memuat event' });
            }
        } catch (error: any) {
            console.error('Fetch events error:', error);
            set({ error: error.response?.data?.message || error.message || 'Terjadi kesalahan saat memuat event' });
        } finally {
            set({ loading: false });
        }
    },

    createEvent: async (data) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'judul', data: data.judul },
                { name: 'deskripsi', data: data.deskripsi },
                { name: 'tanggalMulai', data: data.tanggalMulai },
                { name: 'tanggalSelesai', data: data.tanggalSelesai },
                { name: 'lokasi', data: data.lokasi },
                { name: 'dinasId', data: String(data.dinasId) },
            ];

            if (data.latitude !== undefined && data.latitude !== null) {
                parts.push({ name: 'latitude', data: String(data.latitude) });
            }
            if (data.longitude !== undefined && data.longitude !== null) {
                parts.push({ name: 'longitude', data: String(data.longitude) });
            }

            // Append Image
            if (data.foto && data.foto.uri) {
                const fileType = data.foto.type || 'image/jpeg';
                const compressedUri = await compressImage(data.foto.uri, fileType);

                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.foto.fileName || `event_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                    parts.push({
                        name: 'gambar',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            console.log('Posting Event Multipart via BlobUtil to:', '/event');

            const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/event`, {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }, parts);

            const respText = await response.text();
            let respJson;
            try {
                respJson = JSON.parse(respText);
            } catch (e) {
                 throw new Error(`Invalid JSON response: ${respText.substring(0, 100)}...`);
            }

            if (response.info().status >= 200 && response.info().status < 300 && respJson.success) {
                return respJson.data;
            } else {
                throw new Error(respJson.message || 'Gagal membuat event');
            }
        } catch (error: any) {
            console.error('Create event error:', error);
            let finalMsg = error.message || 'Terjadi kesalahan saat membuat event';
            
            if (finalMsg.includes('duplicate key value')) {
                 finalMsg = 'Gagal menyimpan: Terjadi konflik data pada Server.';
            }

            set({ error: finalMsg });
            throw new Error(finalMsg);
        } finally {
            set({ loading: false });
        }
    },

    // ... (rest of methods)

    getEventById: async (id: number) => {
        const existing = get().events.find(e => e.id === id);
        if (existing) return existing;

        try {
            const response = await api.get(`/event/${id}`);
            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.log('Get event by id error:', error);
            return null;
        }
    },

    updateEvent: async (id: number, data: any) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'judul', data: data.judul },
                { name: 'deskripsi', data: data.deskripsi },
                { name: 'tanggalMulai', data: data.tanggalMulai },
                { name: 'tanggalSelesai', data: data.tanggalSelesai },
                { name: 'lokasi', data: data.lokasi },
                { name: 'dinasId', data: String(data.dinasId) },
            ];
            
            if (data.latitude !== undefined && data.latitude !== null) {
                parts.push({ name: 'latitude', data: String(data.latitude) });
            }
            if (data.longitude !== undefined && data.longitude !== null) {
                parts.push({ name: 'longitude', data: String(data.longitude) });
            }

            // Append Image if new one is selected
            if (data.foto && data.foto.uri) {
                const fileType = data.foto.type || 'image/jpeg';
                const compressedUri = await compressImage(data.foto.uri, fileType);

                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.foto.fileName || `event_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                    parts.push({
                        name: 'gambar',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/event/${id}`, {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }, parts);

            const respText = await response.text();
            let respJson;
            try {
                respJson = JSON.parse(respText);
            } catch (e) {
                 throw new Error(`Invalid JSON response: ${respText.substring(0, 100)}...`);
            }

            if (response.info().status >= 200 && response.info().status < 300 && respJson.success) {
                 // Update local list
                set(state => ({
                    events: state.events.map(item => item.id === id ? { ...item, ...respJson.data } : item),
                    loading: false
                }));
                return respJson.data;
            } else {
                 throw new Error(respJson.message || 'Gagal update event');
            }
        } catch (error: any) {
            console.error('Update event error:', error);
            const msg = error.message || 'Terjadi kesalahan saat update event';
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },

    clearError: () => set({ error: null }),
}));

export default useEventStore;
