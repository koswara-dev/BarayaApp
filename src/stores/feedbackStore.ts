import { create } from 'zustand';
import api from '../config/api';
import { Feedback } from '../types/feedback';

interface FeedbackStore {
    feedbacks: Feedback[];
    averageRating: number;
    loading: boolean;
    error: string | null;
    fetchFeedbacks: (layananId: number) => Promise<void>;
}

const useFeedbackStore = create<FeedbackStore>((set) => ({
    feedbacks: [],
    averageRating: 0,
    loading: false,
    error: null,

    fetchFeedbacks: async (layananId: number) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/feedback`, {
                params: {
                    layananId,
                    size: 100 // Fetch up to 100 for now to calculate reliable average
                }
            });

            if (response.data?.success) {
                const content: Feedback[] = response.data.data.content || [];
                
                // Calculate Average
                let totalRating = 0;
                let count = 0;
                
                content.forEach(f => {
                    if (f.rating) {
                        totalRating += f.rating;
                        count++;
                    }
                });

                const avg = count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 0;

                set({
                    feedbacks: content,
                    averageRating: avg,
                    loading: false
                });
            } else {
                set({ loading: false, error: response.data?.message || 'Gagal memuat feedback' });
            }
        } catch (err: any) {
            set({
                loading: false,
                error: err?.response?.data?.message || err.message || 'Terjadi kesalahan saat memuat feedback'
            });
        }
    }
}));

export default useFeedbackStore;
