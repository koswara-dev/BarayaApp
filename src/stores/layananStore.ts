import { create } from "zustand";
import api from "../config/api";
import { Service } from "../types/service";

interface LayananStore {
    layanan: Service[];
    dinas: any[];
    loading: boolean;
    error: string | null;
    fetchLayanan: () => Promise<void>;
    fetchDinas: () => Promise<void>;
}

const useLayananStore = create<LayananStore>((set) => ({
    layanan: [],
    dinas: [],
    loading: false,
    error: null,

    fetchLayanan: async () => {
        try {
            set({ loading: true, error: null });
            const response = await api.get("/layanan");
            set({
                layanan: response.data?.data?.content || [],
                loading: false,
            });
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
