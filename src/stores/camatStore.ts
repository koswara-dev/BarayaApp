import { create } from 'zustand';
import api from '../config/api';

export interface KecamatanItem {
    id: number;
    kecamatan: string;
    userId: number;
    userName: string;
    userUrlFoto: string | null;
    alamatKantor?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface KecamatanState {
    kecamatanList: KecamatanItem[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;
    fetchKecamatan: (page?: number, size?: number, kecamatan?: string, isLoadMore?: boolean) => Promise<void>;
    getKecamatanById: (id: number) => Promise<KecamatanItem | null>;
    createKecamatan: (data: any) => Promise<boolean>;
    updateKecamatan: (id: number, data: any) => Promise<boolean>;
}

const useCamatStore = create<KecamatanState>((set, get) => ({
    kecamatanList: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    fetchKecamatan: async (page = 0, size = 10, kecamatan?: string, isLoadMore = false) => {
        if (get().loading && isLoadMore) return;
        set({ loading: true, error: null });
        try {
            const params: any = { page, size };
            if (kecamatan) params.kecamatan = kecamatan;

            const response = await api.get('/camat', { params });
            const data = response.data?.data;
            const content = data?.content || [];
            const pagination = data?.page || {};

            set((state) => ({
                kecamatanList: isLoadMore ? [...state.kecamatanList, ...content] : content,
                page: pagination.number || 0,
                totalPages: pagination.totalPages || 1,
                hasMore: (pagination.number + 1) < (pagination.totalPages || 0),
                loading: false
            }));
        } catch (error: any) {
            console.log('Fetch kecamatan error:', error);
            set({
                loading: false,
                error: error.response?.data?.message || error.message || 'Gagal memuat data kecamatan'
            });
        }
    },

    getKecamatanById: async (id: number) => {
        const existing = get().kecamatanList.find(k => k.id === id);
        if (existing) return existing;

        try {
            const response = await api.get(`/camat/${id}`);
            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.log('Get kecamatan by id error:', error);
            return null;
        }
    },

    createKecamatan: async (data: any) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/camat', data);
            if (response.data?.success) {
                set(state => ({
                    kecamatanList: [response.data.data, ...state.kecamatanList],
                    loading: false
                }));
                return true;
            }
            throw new Error(response.data?.message || 'Gagal membuat data kecamatan');
        } catch (error: any) {
            set({
                loading: false,
                error: error.response?.data?.message || error.message || 'Gagal membuat data kecamatan'
            });
            return false;
        }
    },

    updateKecamatan: async (id: number, data: any) => {
        set({ loading: true, error: null });
        try {
            const response = await api.put(`/camat/${id}`, data);
            if (response.data?.success) {
                set(state => ({
                    kecamatanList: state.kecamatanList.map(item => item.id === id ? { ...item, ...response.data.data } : item),
                    loading: false
                }));
                return true;
            }
            throw new Error(response.data?.message || 'Gagal mengupdate data kecamatan');
        } catch (error: any) {
            set({
                loading: false,
                error: error.response?.data?.message || error.message || 'Gagal mengupdate data kecamatan'
            });
            return false;
        }
    },
}));

export default useCamatStore;
