import { create } from 'zustand';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';

export interface SamsatKeliling {
    id: number;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    lokasi: string;
    urlGambar: string;
    latitude?: string;
    longitude?: string;
    createdAt: string;
    updatedAt: string;
}

interface SamsatKelilingState {
    list: SamsatKeliling[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;

    fetchSamsatKeliling: (params?: { page?: number; size?: number; isLoadMore?: boolean; search?: string }) => Promise<void>;
    createSamsatKeliling: (data: any) => Promise<any>;
    updateSamsatKeliling: (id: number, data: any) => Promise<any>;
    deleteSamsatKeliling: (id: number) => Promise<any>;
    getSamsatKelilingById: (id: number) => Promise<SamsatKeliling | null>;
    clearError: () => void;
}

const useSamsatKelilingStore = create<SamsatKelilingState>((set, get) => ({
    list: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    fetchSamsatKeliling: async (params = {}) => {
        const { page = 0, size = 10, isLoadMore = false, search } = params;
        if (get().loading && isLoadMore) return;
        set({ loading: true, error: null });

        try {
            const apiParams: any = { page, size, sort: 'createdAt,desc' };
            if (search) apiParams.lokasi = search; // Search by lokasi usually

            const res = await api.get('/samsat-keliling', {
                params: apiParams
            });

            if (res.data.success) {
                const data = res.data.data;
                const content = data.content || [];
                const pagination = data.page || {};

                set((state) => ({
                    list: isLoadMore ? [...state.list, ...content] : content,
                    page: pagination.number || 0,
                    totalPages: pagination.totalPages || 0,
                    hasMore: (pagination.number + 1) < (pagination.totalPages || 0),
                }));
            } else {
                set({ error: res.data.message || 'Gagal memuat jadwal samsat' });
            }
        } catch (error: any) {
            console.error('Fetch samsat error:', error);
            set({ error: error.response?.data?.message || error.message || 'Terjadi kesalahan saat memuat samsat' });
        } finally {
            set({ loading: false });
        }
    },

    createSamsatKeliling: async (data) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'tanggal', data: data.tanggal }, // YYYY-MM-DD
                { name: 'jamMulai', data: data.jamMulai }, // HH:mm
                { name: 'jamSelesai', data: data.jamSelesai }, // HH:mm
                { name: 'lokasi', data: data.lokasi },
            ];

            if (data.latitude) parts.push({ name: 'latitude', data: String(data.latitude) });
            if (data.longitude) parts.push({ name: 'longitude', data: String(data.longitude) });

            // Append Image
            if (data.foto && data.foto.uri) {
                const fileType = data.foto.type || 'image/jpeg';
                const compressedUri = await compressImage(data.foto.uri, fileType);

                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.foto.fileName || `samsat_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                    parts.push({
                        name: 'gambar',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/samsat-keliling`, {
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
                throw new Error(respJson.message || 'Gagal membuat jadwal samsat');
            }
        } catch (error: any) {
            console.error('Create samsat error:', error);
            set({ error: error.message || 'Terjadi kesalahan saat membuat jadwal samsat', loading: false });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    updateSamsatKeliling: async (id: number, data: any) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'tanggal', data: data.tanggal },
                { name: 'jamMulai', data: data.jamMulai },
                { name: 'jamSelesai', data: data.jamSelesai },
                { name: 'lokasi', data: data.lokasi },
            ];

            if (data.latitude) parts.push({ name: 'latitude', data: String(data.latitude) });
            if (data.longitude) parts.push({ name: 'longitude', data: String(data.longitude) });

            // Append Image if new one is selected
            if (data.foto && data.foto.uri) {
                const fileType = data.foto.type || 'image/jpeg';
                const compressedUri = await compressImage(data.foto.uri, fileType);

                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.foto.fileName || `samsat_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                    parts.push({
                        name: 'gambar',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/samsat-keliling/${id}`, {
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
                    list: state.list.map(item => item.id === id ? { ...item, ...respJson.data } : item),
                    loading: false
                }));
                return respJson.data;
            } else {
                throw new Error(respJson.message || 'Gagal update jadwal samsat');
            }
        } catch (error: any) {
            console.error('Update samsat error:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteSamsatKeliling: async (id: number) => {
        set({ loading: true, error: null });
        try {
            const res = await api.delete(`/samsat-keliling/${id}`);
            if (res.data.success) {
                 set(state => ({
                     list: state.list.filter(item => item.id !== id),
                     loading: false
                 }));
                 return true;
            } else {
                set({ error: res.data.message || 'Gagal menghapus jadwal', loading: false });
                return false;
            }
        } catch (error: any) {
             set({ error: error.message || 'Terjadi kesalahan saat menghapus', loading: false });
             return false;
        }
    },

    getSamsatKelilingById: async (id: number) => {
        const existing = get().list.find(e => e.id === id);
        if (existing) return existing;

        try {
            const response = await api.get(`/samsat-keliling/${id}`);
            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.log('Get samsat by id error:', error);
            return null;
        }
    },

    clearError: () => set({ error: null }),
}));

export default useSamsatKelilingStore;
