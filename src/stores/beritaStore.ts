import { create } from 'zustand';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { compressImage } from '../utils/imageCompressor';

export interface Berita {
    id: number;
    judul: string;
    deskripsi: string;
    tanggal: string;
    urlGambar?: string;
    dinasId?: number;
    dinasNama?: string;
    createdAt: string;
    updatedAt: string;
}

interface BeritaState {
    list: Berita[];
    currentBerita: Berita | null;
    loading: boolean;
    error: string | null;
    page: number;
    totalPage: number;
    hasMore: boolean;

    // Actions
    fetchBerita: (params?: { page?: number; isLoadMore?: boolean; search?: string }) => Promise<void>;
    getBeritaById: (id: number | string) => Promise<Berita | null>;
    createBerita: (data: any) => Promise<boolean>;
    updateBerita: (id: number | string, data: any) => Promise<boolean>;
    deleteBerita: (id: number | string) => Promise<boolean>;
    setCurrentBerita: (berita: Berita | null) => void;
}

const useBeritaStore = create<BeritaState>((set, get) => ({
    list: [],
    currentBerita: null,
    loading: false,
    error: null,
    page: 0,
    totalPage: 1,
    hasMore: true,

    fetchBerita: async ({ page = 0, isLoadMore = false, search = '' } = {}) => {
        if (isLoadMore && !get().hasMore) return;

        set({ loading: !isLoadMore, error: null });

        try {
            // Build Query
            let query = `/berita?page=${page}&size=10&sort=createdAt,desc`;
            if (search) query += `&search=${search}`;

            const response = await api.get(query);

            if (response.data.success) {
                const { content, totalPages, last } = response.data.data;
                const newData = isLoadMore ? [...get().list, ...content] : content;

                set({
                    list: newData,
                    page: page,
                    totalPage: totalPages,
                    hasMore: !last,
                    loading: false
                });
            } else {
                set({ loading: false, error: 'Gagal memuat berita' });
            }
        } catch (error: any) {
            console.log('Fetch berita error:', error);
            set({ loading: false, error: error.message || 'Terjadi kesalahan' });
        }
    },

    getBeritaById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/berita/${id}`);
            if (response.data.success) {
                set({ currentBerita: response.data.data, loading: false });
                return response.data.data;
            } else {
                set({ loading: false, error: 'Berita tidak ditemukan' });
                return null;
            }
        } catch (error: any) {
            set({ loading: false, error: error.message });
            return null;
        }
    },

    createBerita: async (data) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'judul', data: data.judul },
                { name: 'deskripsi', data: data.deskripsi },
                { name: 'tanggal', data: data.tanggal || new Date().toISOString() },
            ];

            if (data.dinasId) {
                parts.push({ name: 'dinasId', data: String(data.dinasId) });
            }

            if (data.gambar && data.gambar.uri) {
                const fileType = data.gambar.type || 'image/jpeg';
                const compressedUri = await compressImage(data.gambar.uri, fileType);
                
                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.gambar.fileName || `berita_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                    parts.push({
                        name: 'gambar',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/berita`, {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }, parts);

            const respStatus = response.info().status;
            let respJson;
            try {
                respJson = JSON.parse(await response.text());
            } catch (e) {
                respJson = { success: false, message: 'Invalid response' };
            }

            if (respStatus >= 200 && respStatus < 300 && respJson.success) {
                // Refresh list
                const currentList = get().list;
                set({ list: [respJson.data, ...currentList] });
                return respJson.data;
            } else {
                throw new Error(respJson.message || 'Gagal membuat berita');
            }
        } catch (error: any) {
            set({ error: error.message });
            throw new Error(error.message);
        } finally {
            set({ loading: false });
        }
    },

    updateBerita: async (id, data) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [];
            
            if (data.judul) parts.push({ name: 'judul', data: data.judul });
            if (data.deskripsi) parts.push({ name: 'deskripsi', data: data.deskripsi });
            if (data.tanggal) parts.push({ name: 'tanggal', data: data.tanggal });
            if (data.dinasId) parts.push({ name: 'dinasId', data: String(data.dinasId) });

            if (data.gambar && data.gambar.uri) {
                const fileType = data.gambar.type || 'image/jpeg';
                const compressedUri = await compressImage(data.gambar.uri, fileType);
                
                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.gambar.fileName || `berita_update_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                    parts.push({
                        name: 'gambar',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/berita/${id}`, {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }, parts);

            const respStatus = response.info().status;
            let respJson;
            try {
                respJson = JSON.parse(await response.text());
            } catch (e) {
                respJson = { success: false, message: 'Invalid response' };
            }

            if (respStatus >= 200 && respStatus < 300 && respJson.success) {
                 const updatedItem = respJson.data;
                 const updatedList = get().list.map(item => item.id === id ? updatedItem : item);
                 set({ list: updatedList, currentBerita: updatedItem });
                return updatedItem;
            } else {
                throw new Error(respJson.message || 'Gagal update berita');
            }
        } catch (error: any) {
             set({ error: error.message });
             throw new Error(error.message);
        } finally {
            set({ loading: false });
        }
    },

    deleteBerita: async (id) => {
        set({ loading: true, error: null });
        try {
             const response = await api.delete(`/berita/${id}`);
             if (response.data.success) {
                 const newList = get().list.filter(item => item.id !== id);
                 set({ list: newList });
                 return true;
             } else {
                 throw new Error('Gagal menghapus berita');
             }
        } catch (error: any) {
            set({ error: error.message });
            throw new Error(error.message);
        } finally {
            set({ loading: false });
        }
    },

    setCurrentBerita: (berita) => set({ currentBerita: berita })
}));

export default useBeritaStore;
