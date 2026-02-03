import { create } from 'zustand';
import api from '../config/api';

export interface Cctv {
    id: number;
    nama: string;
    lokasi: string;
    status: string;
    thumbnail: string;
    url: string;
}

interface CctvState {
    cctvs: Cctv[];
    loading: boolean;
    error: string | null;
    fetchCctv: () => Promise<void>;
}

const useCctvStore = create<CctvState>((set) => ({
    cctvs: [],
    loading: false,
    error: null,

    fetchCctv: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/cctv');
            if (res.data.success) {
                set({ cctvs: res.data.data });
            } else {
                set({ error: res.data.message || 'Gagal memuat data CCTV' });
            }
        } catch (error: any) {
            console.error('Fetch CCTV error:', error);
            set({ error: error.message || 'Terjadi kesalahan saat memuat data CCTV' });
        } finally {
            set({ loading: false });
        }
    },
}));

export default useCctvStore;
