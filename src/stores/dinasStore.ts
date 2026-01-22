import { create } from 'zustand';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';

export interface DinasItem {
    id: number;
    dinasKode?: string;
    nama: string;
    jenis: string;
    deskripsi: string;
    alamat: string;
    latitude: string | null;
    longitude: string | null;
    website: string;
    namaKadis: string;
    urlFotoKadis: string | null;
    urlFotoGedung: string | null;
    createdAt: string;
    updatedAt: string;
}

interface DinasState {
    dinasList: DinasItem[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;
    fetchDinas: (page?: number, size?: number, name?: string, isLoadMore?: boolean) => Promise<void>;
    getDinasById: (id: number) => Promise<DinasItem | null>;
    updateDinas: (id: number, data: any) => Promise<boolean>;
}

const useDinasStore = create<DinasState>((set, get) => ({
    dinasList: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    fetchDinas: async (page = 0, size = 10, name?: string, isLoadMore = false) => {
        if (get().loading && isLoadMore) return;
        set({ loading: true, error: null });
        try {
            const params: any = { page, size };
            if (name) params.nama = name;

            const response = await api.get('/dinas', { params });
            const data = response.data?.data;
            const content = data?.content || [];
            const pagination = data?.page || {};

            set((state) => ({
                dinasList: isLoadMore ? [...state.dinasList, ...content] : content,
                page: pagination.number || 0,
                totalPages: pagination.totalPages || 1,
                hasMore: (pagination.number + 1) < (pagination.totalPages || 0),
                loading: false
            }));
        } catch (error: any) {
            console.log('Fetch dinas error:', error);
            set({
                loading: false,
                error: error.response?.data?.message || error.message || 'Gagal memuat data dinas'
            });
        }
    },

    getDinasById: async (id: number) => {
        const existing = get().dinasList.find(d => d.id === id);
        if (existing) return existing;

        try {
            const response = await api.get(`/dinas/${id}`);
            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.log('Get dinas by id error:', error);
            return null;
        }
    },

    updateDinas: async (id: number, data: any) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'nama', data: data.nama },
                { name: 'jenis', data: data.jenis },
                { name: 'deskripsi', data: data.deskripsi },
                { name: 'alamat', data: data.alamat },
                { name: 'website', data: data.website },
                { name: 'namaKadis', data: data.namaKadis },
            ];

            if (data.latitude) parts.push({ name: 'latitude', data: String(data.latitude) });
            if (data.longitude) parts.push({ name: 'longitude', data: String(data.longitude) });
            
            // Append Foto Gedung
            if (data.fotoGedung && data.fotoGedung.uri) {
                const fileType = data.fotoGedung.type || 'image/jpeg';
                const compressedUri = await compressImage(data.fotoGedung.uri, fileType);
                if (compressedUri) {
                    const fileName = data.fotoGedung.fileName || `dinas_gedung_${Date.now()}.jpg`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;
                    parts.push({
                        name: 'fotoGedung',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            // Append Foto Kadis
            if (data.fotoKadis && data.fotoKadis.uri) {
                const fileType = data.fotoKadis.type || 'image/jpeg';
                const compressedUri = await compressImage(data.fotoKadis.uri, fileType);
                if (compressedUri) {
                    const fileName = data.fotoKadis.fileName || `dinas_kadis_${Date.now()}.jpg`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;
                    parts.push({
                        name: 'fotoKadis',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }
            
            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/dinas/${id}`, {
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
                    dinasList: state.dinasList.map(item => item.id === id ? { ...item, ...respJson.data } : item),
                    loading: false
                }));
                return true;
            } else {
                throw new Error(respJson.message || 'Gagal mengupdate data dinas');
            }
        } catch (error: any) {
            console.log('Update dinas error:', error);
            set({
                loading: false,
                error: error.message || 'Gagal mengupdate data dinas'
            });
            return false;
        }
    }
}));

export default useDinasStore;
