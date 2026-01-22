import { create } from 'zustand';
import api from '../config/api';

export interface AsdaDinas {
    dinasId: number;
    dinasNama: string;
    dinasNamaKadis: string;
}

export interface AsdaItem {
    id: number;
    nama: string;
    userId: number;
    userName: string;
    userUrlFoto: string | null;
    dinas: AsdaDinas[];
    createdAt: string;
    updatedAt: string;
}

interface AsdaState {
    asdaList: AsdaItem[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;
    fetchAsda: (page?: number, size?: number, name?: string, isLoadMore?: boolean) => Promise<void>;
    getAsdaById: (id: number) => Promise<AsdaItem | null>;
    createAsda: (data: any) => Promise<boolean>;
    updateAsda: (id: number, data: any) => Promise<boolean>;
}

const useAsdaStore = create<AsdaState>((set, get) => ({
    asdaList: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    fetchAsda: async (page = 0, size = 10, name?: string, isLoadMore = false) => {
        if (get().loading && isLoadMore) return;
        set({ loading: true, error: null });
        try {
            const params: any = { page, size };
            if (name) params.nama = name;

            const response = await api.get('/asisten-daerah', { params });
            const data = response.data?.data;
            const content = data?.content || [];
            const pagination = data?.page || {};

            set((state) => ({
                asdaList: isLoadMore ? [...state.asdaList, ...content] : content,
                page: pagination.number || 0,
                totalPages: pagination.totalPages || 1,
                hasMore: (pagination.number + 1) < (pagination.totalPages || 0),
                loading: false
            }));
        } catch (error: any) {
            console.log('Fetch asda error:', error);
            set({
                loading: false,
                error: error.response?.data?.message || error.message || 'Gagal memuat data ASDA'
            });
        }
    },

    getAsdaById: async (id: number) => {
        const existing = get().asdaList.find(a => a.id === id);
        if (existing) return existing;

        try {
            const response = await api.get(`/asisten-daerah/${id}`);
            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.log('Get asda by id error:', error);
            return null;
        }
    },

    createAsda: async (data: any) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/asisten-daerah', data);
            if (response.data?.success) {
                set(state => ({
                    asdaList: [response.data.data, ...state.asdaList],
                    loading: false
                }));
                return true;
            }
            throw new Error(response.data?.message || 'Gagal membuat data ASDA');
        } catch (error: any) {
            set({
                loading: false,
                error: error.response?.data?.message || error.message || 'Gagal membuat data ASDA'
            });
            return false;
        }
    },

    updateAsda: async (id: number, data: any) => {
        set({ loading: true, error: null });
        try {
            const response = await api.put(`/asisten-daerah/${id}`, data);
            if (response.data?.success) {
                set(state => ({
                    asdaList: state.asdaList.map(item => item.id === id ? { ...item, ...response.data.data } : item),
                    loading: false
                }));
                return true;
            }
            throw new Error(response.data?.message || 'Gagal mengupdate data ASDA');
        } catch (error: any) {
            set({
                loading: false,
                error: error.response?.data?.message || error.message || 'Gagal mengupdate data ASDA'
            });
            return false;
        }
    },
}));

export default useAsdaStore;
