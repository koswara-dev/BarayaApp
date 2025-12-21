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
}));

export default useLayananStore;
