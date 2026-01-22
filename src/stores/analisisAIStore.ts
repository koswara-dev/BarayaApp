import { create } from 'zustand';
import { GoogleGenAI } from '@google/genai';
import api from '../config/api';
import { AnalisisAI } from '../types/analisis';
import usePengaturanStore from './pengaturanStore';
import { decryptAES } from '../utils/cryptoHelper';

interface AnalisisAIState {
    list: AnalisisAI[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    
    fetchAnalisis: (page?: number, size?: number) => Promise<void>;
    loadMoreAnalisis: () => Promise<void>;
    createAnalisis: (category: 'PENGADUAN' | 'FEEDBACK' | 'DARURAT') => Promise<boolean>;
    getAnalisisById: (id: number) => Promise<AnalisisAI | null>;
    deleteAnalisis: (id: number) => Promise<boolean>;
}

const useAnalisisAIStore = create<AnalisisAIState>((set, get) => ({
    list: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,

    fetchAnalisis: async (page = 0, size = 10) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/analisis-ai', { params: { page, size } });
            const data = response.data?.data;
            if (data) {
                set({
                    list: data.content || [],
                    page: data.page?.number || 0,
                    totalPages: data.page?.totalPages || 1,
                    loading: false
                });
            } else {
                set({ loading: false });
            }
        } catch (error: any) {
            console.error('Fetch analisis error:', error);
            set({
                loading: false,
                error: error.response?.data?.message || 'Gagal memuat data analisis'
            });
        }
    },

    loadMoreAnalisis: async () => {
        const { page, totalPages, loading, list } = get();
        if (loading || page + 1 >= totalPages) return;

        set({ loading: true });
        try {
            const nextPage = page + 1;
            const response = await api.get('/analisis-ai', { params: { page: nextPage, size: 10 } });
            const data = response.data?.data;
            
            if (data && data.content) {
                set({
                    list: [...list, ...data.content],
                    page: data.page?.number,
                    totalPages: data.page?.totalPages,
                    loading: false
                });
            } else {
                set({ loading: false });
            }
        } catch (error) {
             console.error('Load more analisis error:', error);
             set({ loading: false });
        }
    },

    getAnalisisById: async (id: number) => {
        const existing = get().list.find(item => item.id === id);
        if (existing) return existing;

        try {
            set({ loading: true });
            const response = await api.get(`/analisis-ai/${id}`);
            set({ loading: false });
            if (response.data?.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            set({ loading: false });
            return null;
        }
    },

    createAnalisis: async (kategori) => {
        set({ loading: true, error: null });
        try {
            // 1. Get Today's Date Range
            // 1. Get Today's Date Range
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayString = `${year}-${month}-${day}`;

            const startOfDay = todayString;
            const endOfDay = todayString;

            // 2. Fetch Data based on Category
            let dataToAnalyze = [];
            let endpoint = '';
            
            if (kategori === 'PENGADUAN') {
                endpoint = '/pengaduan';
            } else if (kategori === 'DARURAT') {
                endpoint = '/darurat';
            } else if (kategori === 'FEEDBACK') {
                endpoint = '/feedback';
            }

            if (endpoint) {
                try {
                    const res = await api.get(endpoint, {
                        params: {
                            startDate: startOfDay,
                            endDate: endOfDay,
                            size: 100
                        }
                    });
                    dataToAnalyze = res.data?.data?.content || res.data?.data || [];
                } catch (fetchErr) {
                    console.log(`Failed to fetch ${kategori} data`, fetchErr);
                }
            }

            // 3. Generate Analysis using Google GenAI
            let analysisResult = `Tidak dapat melakukan analisis AI.`;
            
            try {
                // Initialize Gemini
                // Get API Key from Settings
                let encryptedKey = usePengaturanStore.getState().pengaturan?.geminiApiKey;
                
                if (!encryptedKey) {
                     // Try fetching if not loaded
                     await usePengaturanStore.getState().fetchPengaturan();
                     encryptedKey = usePengaturanStore.getState().pengaturan?.geminiApiKey;
                }

                if (!encryptedKey) {
                    throw new Error('Gemini API Key belum dikonfigurasi di Pengaturan.');
                }

                // Decrypt the key
                const GEMINI_API_KEY = decryptAES(encryptedKey);

                const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
                
                // Prepare Prompt
                const contextString = JSON.stringify(dataToAnalyze, null, 2);
                const prompt = `
                    Bertindaklah sebagai analis data pemerintah daerah.
                    Analisis data ${kategori} berikut ini untuk tanggal ${new Date().toLocaleDateString('id-ID')}.
                    
                    Data (JSON):
                    ${contextString}

                    Berikan ringkasan eksekutif, tren utama yang terlihat (jika ada), dan rekomendasi tindakan singkat.
                    Jika data kosong, katakan "Tidak ada data untuk dianalisis hari ini."
                    Gunakan format Markdown agar mudah dibaca.
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                
                if (response && response.text) {
                     analysisResult = response.text;
                } else {
                     analysisResult = JSON.stringify(response); 
                }
                
                // Correction: The snippet shows `response.text`. 
                // But typically the model output is in candidates. 
                // We'll optimistically use response.text per user snippet.

            } catch (aiError: any) {
                console.error('GenAI Error:', aiError);
                analysisResult = `Gagal melakukan analisis AI: ${aiError.message}. \n\nData Mentah: ${JSON.stringify(dataToAnalyze.length)} item.`;
            }

            // 4. Post to Analisis AI API
            const payload = {
                kategori,
                hasilAnalisis: analysisResult 
            };

            const postRes = await api.post('/analisis-ai', payload);

            if (postRes.data?.success) {
                await get().fetchAnalisis();
                return true;
            }
            return false;

        } catch (error: any) {
            console.error('Create analisis error:', error);
            set({
                loading: false,
                error: error.response?.data?.message || 'Gagal membuat analisis'
            });
            return false;
        } finally {
            set({ loading: false });
        }
    },

    deleteAnalisis: async (id: number) => {
        set({ loading: true, error: null });
        try {
            const response = await api.delete(`/analisis-ai/${id}`);
            if (response.data?.success) {
                set(state => ({
                    list: state.list.filter(item => item.id !== id),
                    loading: false
                }));
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Delete analisis error:', error);
            set({
                loading: false,
                error: error.response?.data?.message || 'Gagal menghapus analisis'
            });
            return false;
        }
    }
}));

export default useAnalisisAIStore;
