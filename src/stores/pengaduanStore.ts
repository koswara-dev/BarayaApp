import { create } from 'zustand';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';

export interface Pengaduan {
    id: number;
    pesan: string;
    urlFoto: string | null;
    urlFotoSelesai: string | null;
    status: string;
    userId: number;
    userNama: string;
    updatedBy: number | null;
    updatedByNama: string | null;
    dinasId: number;
    dinasNama: string;
    createdAt: string;
    updatedAt: string;
}

interface PengaduanState {
    list: Pengaduan[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;

    fetchPengaduan: (params?: { page?: number; size?: number; isLoadMore?: boolean; userId?: number; status?: string; dinasId?: number; sort?: string }) => Promise<void>;
    createPengaduan: (data: any) => Promise<any>;
    updatePengaduanStatus: (id: number, status: string, existingData?: Pengaduan, fotoSelesai?: any) => Promise<any>;
    getPengaduanById: (id: number) => Promise<Pengaduan | null>;
    clearError: () => void;
}

const usePengaduanStore = create<PengaduanState>((set, get) => ({
    list: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 1,
    hasMore: true,

    updatePengaduanStatus: async (id, status, existingData?: Pengaduan, fotoSelesai?: any) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const currentUser = useAuthStore.getState().user;
            if (!token) throw new Error("Authentication required");

            const sourceData = existingData || 
                              get().list.find(item => item.id === id);

            const parts: any[] = [
                { name: 'status', data: status }
            ];

            if (currentUser?.id) {
                parts.push({ name: 'updatedBy', data: String(currentUser.id) });
            }

            if (fotoSelesai && fotoSelesai.uri) {
                const fileType = fotoSelesai.type || 'image/jpeg';
                const compressedUri = await compressImage(fotoSelesai.uri, fileType);
        
                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = fotoSelesai.fileName || `selesai_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;
        
                    parts.push({
                        name: 'fotoSelesai',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            if (sourceData) {
                // Keep other data
                if (sourceData.pesan) parts.push({ name: 'pesan', data: sourceData.pesan });
                if (sourceData.userId) parts.push({ name: 'userId', data: String(sourceData.userId) });
                if (sourceData.dinasId) parts.push({ name: 'dinasId', data: String(sourceData.dinasId) });
                // Do not append 'foto' url string
            }

            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/pengaduan/${id}`, {
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
                // Optimistic update locally
                set((state) => ({
                    list: state.list.map(item =>
                        item.id === id ? { 
                            ...item, 
                            status: status, 
                            urlFotoSelesai: respJson.data?.urlFotoSelesai, 
                            updatedBy: currentUser?.id ? Number(currentUser.id) : null,
                            updatedByNama: currentUser?.fullName || null
                        } : item
                    ),
                    loading: false
                }));
                return respJson.data;
            } else {
                throw new Error(respJson.message || "Gagal memperbarui status");
            }
        } catch (error: any) {
            console.error('Update status error:', error);
            const msg = error.message || 'Gagal memperbarui status';
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },

    getPengaduanById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/pengaduan/${id}`);
            if (response.data?.success) {
                set({ loading: false });
                return response.data.data;
            } else {
                 throw new Error(response.data?.message || "Gagal memuat detail pengaduan");
            }
        } catch (error: any) {
            console.error('Get pengaduan detail error:', error);
            set({ 
                loading: false, 
                error: error.response?.data?.message || error.message || 'Gagal memuat detail pengaduan' 
            });
            return null;
        }
    },

    fetchPengaduan: async (params = {}) => {
        const { page = 0, size = 10, isLoadMore = false, userId, status, dinasId } = params;
        if (get().loading && isLoadMore) return;
        set({ loading: true, error: null });

        try {
            const user = useAuthStore.getState().user;
            const apiParams: any = { page, size, sort: params.sort || 'createdAt,desc' };
            
            if (userId) apiParams.userId = userId;
            if (status) apiParams.status = status;
            
            // Auto-inject dinasId for ADMIN/STAFF if not explicitly provided (or force it)
            if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
                 if (user.dinasId) {
                     apiParams.dinasId = user.dinasId;
                 }
            } else if (dinasId) {
                // For other roles (e.g. Superadmin filtering), use passed param
                apiParams.dinasId = dinasId;
            }

            const res = await api.get('/pengaduan', {
                params: apiParams
            });

            if (res.data.success) {
                const data = res.data.data;
                const content = data.content || [];
                const pagination = data.page || {};

                set((state) => ({
                    list: isLoadMore ? [...state.list, ...content] : content,
                    page: pagination.number || 0,
                    totalPages: pagination.totalPages || 1,
                    hasMore: (pagination.number + 1) < (pagination.totalPages || 0),
                }));
            } else {
                set({ error: res.data.message || 'Gagal memuat daftar pengaduan' });
            }
        } catch (error: any) {
            console.error('Fetch pengaduan error:', error);
            set({ error: error.response?.data?.message || error.message || 'Terjadi kesalahan saat memuat pengaduan' });
        } finally {
            set({ loading: false });
        }
    },

    createPengaduan: async (data) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const parts: any[] = [
                { name: 'pesan', data: data.pesan },
                { name: 'dinasId', data: String(data.dinasId) },
            ];

            if (data.foto && data.foto.uri) {
                const fileType = data.foto.type || 'image/jpeg';
                const compressedUri = await compressImage(data.foto.uri, fileType);

                if (compressedUri) {
                    const extension = fileType.includes('png') ? '.png' : '.jpg';
                    const fileName = data.foto.fileName || `pengaduan_${Date.now()}${extension}`;
                    const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                    parts.push({
                        name: 'foto',
                        filename: fileName,
                        type: fileType,
                        data: ReactNativeBlobUtil.wrap(realUri)
                    });
                }
            }

            console.log('Posting Pengaduan Multipart via BlobUtil to:', '/pengaduan');

            const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/pengaduan`, {
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
                const result = respJson.data;
                console.log('CreatePengaduan Result:', result);
                return result;
            } else {
                throw new Error(respJson.message || 'Gagal mengirim pengaduan');
            }
        } catch (error: any) {
            console.error('Create pengaduan error:', error);
            const finalMsg = error.message || 'Terjadi kesalahan saat mengirim pengaduan';
            set({ error: finalMsg });
            throw new Error(finalMsg);
        } finally {
            set({ loading: false });
        }
    },

    clearError: () => set({ error: null }),
}));

export default usePengaduanStore;
