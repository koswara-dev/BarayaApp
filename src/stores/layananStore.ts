import { create } from "zustand";
import { Platform } from "react-native";
import ReactNativeBlobUtil from 'react-native-blob-util';
import api, { API_BASE_URL } from "../config/api";
import { Service } from "../types/service";
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';

interface LayananStore {
    layanan: Service[];
    searchResults: Service[];
    dinas: any[];
    loading: boolean;
    isSearching: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;
    fetchLayanan: (params?: { name?: string; page?: number; size?: number, isLoadMore?: boolean; dinasId?: number }) => Promise<void>;
    searchLayanan: (query: string) => Promise<void>;
    fetchDinas: (params?: { nama?: string; size?: number }) => Promise<void>;
    createLayanan: (data: any) => Promise<any>;
    createDinas: (data: any) => Promise<any>;
    getLayananById: (id: number) => Promise<Service | null>;
    updateLayanan: (id: number, data: any) => Promise<boolean>;
}

const useLayananStore = create<LayananStore>((set, get) => ({
    layanan: [],
    searchResults: [],
    dinas: [],
    loading: false,
    isSearching: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    fetchLayanan: async (params = {}) => {
        const { name, page = 0, size = 10, isLoadMore = false, dinasId } = params;

        // Prevent loading more if already loading or no more data
        // Allow if it's a new fetch (page 0 / isLoadMore false) even if currently loading (to handle rapid tab switches)
        if (get().loading && isLoadMore) return;
        if (isLoadMore && !get().hasMore) return;

        set({ loading: true, error: null });

        try {
            const apiParams: any = {
                page,
                size
            };

            const user = useAuthStore.getState().user;

            // Only add nama parameter if it is a valid string
            if (name) {
                apiParams.nama = name;
            }

            // Auto-inject dinasId for ADMIN/STAFF if not explicitly provided (or force it)
            if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
                 if (user.dinasId) {
                     apiParams.dinasId = user.dinasId;
                 }
            } else if (dinasId) {
                // For other roles (e.g. Superadmin filtering), use passed param
                apiParams.dinasId = dinasId;
            }

            const response = await api.get("/layanan", { params: apiParams });
            const data = response.data?.data;
            const content = data?.content || [];
            const pagination = data?.page || {};

            set((state) => ({
                layanan: isLoadMore ? [...state.layanan, ...content] : content,
                page: pagination.number || 0,
                totalPages: pagination.totalPages || 1,
                hasMore: (pagination.number + 1) < (pagination.totalPages || 0),
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err?.response?.data?.message || err.message,
            });
        }
    },
    searchLayanan: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [], isSearching: false });
            return;
        }

        set({ isSearching: true });
        try {
            const response = await api.get("/layanan", { params: { nama: query, size: 20 } });
            const data = response.data?.data;
            set({ searchResults: data?.content || [], isSearching: false });
        } catch (err: any) {
            set({
                isSearching: false,
                error: err?.response?.data?.message || err.message,
                searchResults: []
            });
        }
    },

    fetchDinas: async (params?: { nama?: string; size?: number }) => {
        try {
            set({ loading: true, error: null });
            const apiParams: any = {};
            if (params?.nama) {
                apiParams.nama = params.nama;
            }
            if (params?.size) {
                apiParams.size = params.size;
            }
            const response = await api.get("/dinas", { params: apiParams });
            set({
                dinas: response.data?.data?.content || [],
                loading: false,
            });
        } catch (err: any) {
            set({
                loading: false,
                error: err?.response?.data?.message || err.message,
            });
        }
    },

    createLayanan: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post("/layanan", data);
            set({ loading: false });
            if (response.data?.success) {
                return response.data.data;
            } else {
                throw new Error(response.data?.message || "Gagal membuat layanan");
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err.message || "Terjadi kesalahan sistem";
            set({ loading: false, error: msg });
            throw new Error(msg);
        }
    },

    createDinas: async (data) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'nama', data: data.nama },
                { name: 'deskripsi', data: data.deskripsi },
                { name: 'alamat', data: data.alamat },
                { name: 'namaKadis', data: data.namaKadis },
            ];

            if (data.website) parts.push({ name: 'website', data: data.website });
            if (data.latitude) parts.push({ name: 'latitude', data: String(data.latitude) });
            if (data.longitude) parts.push({ name: 'longitude', data: String(data.longitude) });

            const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/dinas`, {
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

            set({ loading: false });
            if (response.info().status >= 200 && response.info().status < 300 && respJson.success) {
                return respJson.data;
            } else {
                throw new Error(respJson.message || "Gagal membuat dinas");
            }
        } catch (err: any) {
            const msg = err.message || "Terjadi kesalahan sistem";
            set({ loading: false, error: msg });
            throw new Error(msg);
        }
    },

    getLayananById: async (id: number) => {
        const existing = get().layanan.find(l => l.id === id);
        if (existing) return existing;

        set({ loading: true });
        try {
            const response = await api.get(`/layanan/${id}`);
            set({ loading: false });
            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.log('Get layanan by id error:', error);
            set({ loading: false });
            return null;
        }
    },

    updateLayanan: async (id: number, data: any) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'nama', data: data.nama },
                { name: 'deskripsi', data: data.deskripsi },
                { name: 'estimasiWaktu', data: String(data.estimasiWaktu) },
                { name: 'phoneNumber', data: data.phoneNumber },
                { name: 'email', data: data.email },
                { name: 'dinasId', data: String(data.dinasId) },
            ];

            if (data.informasiDetail) parts.push({ name: 'informasiDetail', data: data.informasiDetail });
            if (data.urlWebLayanan) parts.push({ name: 'urlWebLayanan', data: data.urlWebLayanan });
            if (data.online !== undefined) parts.push({ name: 'online', data: String(data.online) });
            
            // Append Image if new one is selected
            if (data.foto && data.foto.uri) {
                const fileType = data.foto.type || 'image/jpeg';
                const compressedUri = await compressImage(data.foto.uri, fileType);

                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.foto.fileName || `layanan_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                    parts.push({
                        name: 'gambar',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }
            
            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/layanan/${id}`, {
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
                    layanan: state.layanan.map(item => item.id === id ? { ...item, ...respJson.data } : item),
                    loading: false
                }));
                return true;
            } else {
                 throw new Error(respJson.message || 'Gagal mengupdate layanan');
            }
        } catch (error: any) {
             console.log('Update layanan error:', error);
             set({
                loading: false,
                error: error.message || 'Gagal mengupdate layanan'
            });
            return false;
        }
    }
}));

export default useLayananStore;
