import { create } from "zustand";
import api from "../config/api";
import { Service } from "../types/service";

interface LayananStore {
    layanan: Service[];
    dinas: any[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;
    fetchLayanan: (params?: { name?: string; page?: number; size?: number, isLoadMore?: boolean }) => Promise<void>;
    fetchDinas: () => Promise<void>;
    createLayanan: (data: any) => Promise<any>;
    createDinas: (data: any) => Promise<any>;
}

const useLayananStore = create<LayananStore>((set, get) => ({
    layanan: [],
    dinas: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    fetchLayanan: async (params = {}) => {
        const { name, page = 0, size = 10, isLoadMore = false } = params;

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

            // Only add name parameter if it is a valid string
            if (name) {
                apiParams.name = name;
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

    fetchDinas: async () => {
        try {
            set({ loading: true, error: null });
            const response = await api.get("/dinas");
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
            // Convert to FormData to support backend multipart/form-data requirement
            const formData = new FormData();
            formData.append('nama', data.nama);
            formData.append('deskripsi', data.deskripsi);
            formData.append('alamat', data.alamat);
            formData.append('namaKadis', data.namaKadis);

            if (data.website) formData.append('website', data.website);
            if (data.latitude) formData.append('latitude', String(data.latitude));
            if (data.longitude) formData.append('longitude', String(data.longitude));

            // Note: Axios automatically sets the correct Content-Type with boundary when FormData is passed
            // but we explicitly set multipart/form-data to override the default application/json in our api instance
            const response = await api.post("/dinas", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            set({ loading: false });
            if (response.data?.success) {
                return response.data.data;
            } else {
                throw new Error(response.data?.message || "Gagal membuat dinas");
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err.message || "Terjadi kesalahan sistem";
            set({ loading: false, error: msg });
            throw new Error(msg);
        }
    },
}));

export default useLayananStore;
