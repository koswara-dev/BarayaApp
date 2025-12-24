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

    fetchEvents: (params?: { page?: number; size?: number; isLoadMore?: boolean }) => Promise<void>;
    createEvent: (data: any) => Promise<any>;
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
        const { page = 0, size = 10, isLoadMore = false } = params;
        if (get().loading && isLoadMore) return;
        set({ loading: true, error: null });

        try {
            const res = await api.get('/event', {
                params: { page, size, sort: 'createdAt,desc' }
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
            if (!token) throw new Error("Authentication required");

            const parts: any[] = [
                { name: 'judul', data: data.judul },
                { name: 'deskripsi', data: data.deskripsi },
                { name: 'tanggalMulai', data: data.tanggalMulai },
                { name: 'tanggalSelesai', data: data.tanggalSelesai },
                { name: 'lokasi', data: data.lokasi },
                { name: 'dinasId', data: String(data.dinasId) },
            ];

            if (data.latitude !== undefined && data.latitude !== null) parts.push({ name: 'latitude', data: String(data.latitude) });
            if (data.longitude !== undefined && data.longitude !== null) parts.push({ name: 'longitude', data: String(data.longitude) });

            if (data.foto && data.foto.uri) {
                const fileType = data.foto.type || 'image/jpeg';
                const compressedUri = await compressImage(data.foto.uri, fileType);

                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.foto.fileName || `event_${Date.now()}${extension}`;

                    let uri = compressedUri;
                    if (Platform.OS === 'ios') {
                        uri = uri.replace('file://', '');
                    }

                    parts.push({
                        name: 'gambar',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(uri)
                    });
                }
            }

            console.log('Posting Event Multipart to:', `${API_BASE_URL}/event`);

            const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/event`, {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }, parts);

            const responseStatus = response.info().status;
            const responseText = await response.text();

            console.log(`Server Response (${responseStatus}):`, responseText);

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                responseData = { success: false, message: 'Server error: ' + responseText.substring(0, 50) };
            }

            if (responseStatus >= 200 && responseStatus < 300 && responseData.success) {
                return responseData.data || true;
            } else {
                const errorMsg = responseData.message || `Gagal membuat event (Status: ${responseStatus})`;
                set({ error: errorMsg });
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error('Create event error:', error);
            let finalMsg = error.message || 'Terjadi kesalahan saat membuat event';

            // Handle specific backend DB errors
            if (finalMsg.includes('duplicate key value') || finalMsg.includes('unique constraint')) {
                finalMsg = 'Gagal menyimpan: Terjadi konflik data pada Server (ID Conflict). Mohon hubungi admin untuk reset database sequence.';
            }

            set({ error: finalMsg });
            throw new Error(finalMsg);
        } finally {
            set({ loading: false });
        }
    },

    clearError: () => set({ error: null }),
}));

export default useEventStore;
