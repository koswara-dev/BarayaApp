import { create } from 'zustand';
import api from '../config/api';

export interface Pengaturan {
    id: number;
    appName: string;
    urlLogo: string;
    slogan: string;
    kabupaten: string;
    provinsi: string;
    urlLogoKabupaten: string;
    namaBupati: string;
    urlFotoBupati: string;
    namaWakilBupati: string;
    urlFotoWakilBupati: string;
    namaSekda: string;
    urlFotoSekda: string;
    email: string;
    phoneNumber: string;
    alamat: string;
    latitude: number;
    longitude: number;
    versi: string;
    createdAt: string;
    updatedAt: string;
}

interface PengaturanState {
    pengaturan: Pengaturan | null;
    loading: boolean;
    error: string | null;

    fetchPengaturan: () => Promise<void>;
    updatePengaturan: (data: Partial<Pengaturan>) => Promise<boolean>;
    clearError: () => void;
}

const usePengaturanStore = create<PengaturanState>((set, get) => ({
    pengaturan: null,
    loading: false,
    error: null,

    fetchPengaturan: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/pengaturan');
            if (res.data.success) {
                set({ pengaturan: res.data.data });
            } else {
                set({ error: res.data.message || 'Gagal memuat pengaturan' });
            }
        } catch (error: any) {
            console.error('Fetch pengaturan error:', error);
            set({ error: error.message || 'Terjadi kesalahan saat memuat pengaturan' });
        } finally {
            set({ loading: false });
        }
    },

    updatePengaturan: async (data) => {
        set({ loading: true, error: null });
        try {
            const currentPengaturan = get().pengaturan;
            if (!currentPengaturan) {
                set({ error: 'Pengaturan tidak ditemukan' });
                return false;
            }

            // Merge current data with new data - send complete object
            const updatedData = {
                id: currentPengaturan.id,
                appName: currentPengaturan.appName,
                urlLogo: currentPengaturan.urlLogo,
                slogan: currentPengaturan.slogan,
                kabupaten: currentPengaturan.kabupaten,
                provinsi: currentPengaturan.provinsi,
                urlLogoKabupaten: currentPengaturan.urlLogoKabupaten,
                namaBupati: currentPengaturan.namaBupati,
                urlFotoBupati: currentPengaturan.urlFotoBupati,
                namaWakilBupati: currentPengaturan.namaWakilBupati,
                urlFotoWakilBupati: currentPengaturan.urlFotoWakilBupati,
                namaSekda: currentPengaturan.namaSekda,
                urlFotoSekda: currentPengaturan.urlFotoSekda,
                email: currentPengaturan.email,
                phoneNumber: currentPengaturan.phoneNumber,
                alamat: currentPengaturan.alamat,
                latitude: currentPengaturan.latitude,
                longitude: currentPengaturan.longitude,
                versi: currentPengaturan.versi,
                ...data, // Override with new values
            };

            console.log('Updating pengaturan with:', updatedData);

            const res = await api.put('/pengaturan', updatedData);
            if (res.data.success) {
                set({ pengaturan: res.data.data });
                return true;
            } else {
                set({ error: res.data.message || 'Gagal memperbarui pengaturan' });
                return false;
            }
        } catch (error: any) {
            console.error('Update pengaturan error:', error.response?.data || error);
            const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat memperbarui pengaturan';
            set({ error: errorMessage });
            return false;
        } finally {
            set({ loading: false });
        }
    },

    clearError: () => set({ error: null }),
}));

export default usePengaturanStore;
