import { create } from 'zustand';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';

export interface Pengaduan {
    id: number;
    pesan: string;
    urlFoto: string | null;
    status: string;
    userId: number;
    userNama: string;
    dinasId: number;
    dinasNama: string;
    createdAt: string;
    updatedAt: string;
}

interface PengaduanState {
    list: Pengaduan[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;

    fetchPengaduan: (params?: { page?: number; size?: number; isLoadMore?: boolean }) => Promise<void>;
    createPengaduan: (data: any) => Promise<any>;
    updatePengaduanStatus: (id: number, status: string) => Promise<any>;
    getPengaduanById: (id: number) => Promise<Pengaduan | null>;
    clearError: () => void;
}

const usePengaduanStore = create<PengaduanState>((set, get) => ({
    list: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    updatePengaduanStatus: async (id, status) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error("Authentication required");

            const response = await api.put(`/pengaduan/${id}?status=${status}`, null);

            if (response.data?.success) {
                // Optimistic update locally
                set((state) => ({
                    list: state.list.map(item =>
                        item.id === id ? { ...item, status: status } : item
                    ),
                    loading: false
                }));
                return response.data.data;
            } else {
                throw new Error(response.data?.message || "Gagal memperbarui status");
            }
        } catch (error: any) {
            console.error('Update status error:', error);
            const msg = error.response?.data?.message || error.message || 'Gagal memperbarui status';
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },

    getPengaduanById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/pengaduan/${id}`);
            if (response.data?.success) {
                set({ loading: false });
                return response.data.data;
            } else {
                 throw new Error(response.data?.message || "Gagal memuat detail pengaduan");
            }
        } catch (error: any) {
            console.error('Get pengaduan detail error:', error);
            set({ 
                loading: false, 
                error: error.response?.data?.message || error.message || 'Gagal memuat detail pengaduan' 
            });
            return null;
        }
    },

    fetchPengaduan: async (params = {}) => {
        const { page = 0, size = 10, isLoadMore = false } = params;
        if (get().loading && isLoadMore) return;
        set({ loading: true, error: null });

        try {
            const res = await api.get('/pengaduan', {
                params: { page, size, sort: 'createdAt,desc' }
            });

            if (res.data.success) {
                const data = res.data.data;
                const content = data.content || [];
                const pagination = data.page || {};

                set((state) => ({
                    list: isLoadMore ? [...state.list, ...content] : content,
                    page: pagination.number || 0,
                    totalPages: pagination.totalPages || 1,
                    hasMore: (pagination.number + 1) < (pagination.totalPages || 0),
                }));
            } else {
                set({ error: res.data.message || 'Gagal memuat daftar pengaduan' });
            }
        } catch (error: any) {
            console.error('Fetch pengaduan error:', error);
            set({ error: error.response?.data?.message || error.message || 'Terjadi kesalahan saat memuat pengaduan' });
        } finally {
            set({ loading: false });
        }
    },

    createPengaduan: async (data) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error("Authentication required");

            const parts: any[] = [
                { name: 'pesan', data: data.pesan },
                { name: 'dinasId', data: String(data.dinasId) },
            ];

            if (data.foto && data.foto.uri) {
                const fileType = data.foto.type || 'image/jpeg';
                const compressedUri = await compressImage(data.foto.uri, fileType);

                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.foto.fileName || `pengaduan_${Date.now()}${extension}`;

                    let uri = compressedUri;
                    if (Platform.OS === 'ios') {
                        uri = uri.replace('file://', '');
                    }

                    parts.push({
                        name: 'foto',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(uri)
                    });
                }
            }

            console.log('Posting Pengaduan Multipart to:', `${API_BASE_URL}/pengaduan`);

            const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/pengaduan`, {
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
                const result = responseData.data || true;

                console.log('CreatePengaduan Result:', result); // DEBUG Log

                // Removed manual notification trigger to avoid duplication
                // with backend-generated 'Pengaduan Baru' notification.


                return result;
            } else {
                const errorMsg = responseData.message || `Gagal mengirim pengaduan (Status: ${responseStatus})`;
                set({ error: errorMsg });
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error('Create pengaduan error:', error);
            const finalMsg = error.message || 'Terjadi kesalahan saat mengirim pengaduan';
            set({ error: finalMsg });
            throw new Error(finalMsg);
        } finally {
            set({ loading: false });
        }
    },

    clearError: () => set({ error: null }),
}));

export default usePengaduanStore;
