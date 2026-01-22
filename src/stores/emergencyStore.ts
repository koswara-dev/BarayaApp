import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';

// Status types for tracking
export type EmergencyStatus = 'pending' | 'diterima' | 'diproses' | 'selesai' | 'dibatalkan';

export interface EmergencyReport {
    id: number;
    userId: number;
    dinasId?: number;
    dinasNama?: string;
    fullName: string;
    phoneNumber: string;
    latitude: number;
    longitude: number;
    pesan: string;
    status: EmergencyStatus;
    urlFoto?: string;
    urlFotoSelesai?: string;
    updatedBy?: string;
    updatedByName?: string;
    createdAt: string;
    updatedAt: string;
}

// Tracking step for UI
export interface TrackingStep {
    status: EmergencyStatus;
    label: string;
    description: string;
    icon: string;
    timestamp?: string;
    isCompleted: boolean;
    isActive: boolean;
}

interface EmergencyStore {
    reports: EmergencyReport[];
    activeReport: EmergencyReport | null;
    showEmergencyModal: boolean;
    modalData: EmergencyReport | null;
    loading: boolean;
    error: string | null;

    // Actions
    createReport: (data: any) => Promise<EmergencyReport>;
    fetchMyActiveReport: (userId: number | string) => Promise<void>;
    completeReport: () => void;
    clearActiveReport: () => void;
    getTrackingSteps: () => TrackingStep[];
    setModalVisible: (visible: boolean, data?: EmergencyReport) => void;
    showModalWithFetch: (eventId: number | string) => Promise<void>;
    updateReportStatus: (id: number, status: string, existingData?: EmergencyReport, extraData?: any) => Promise<boolean>;
    fetchReports: (params?: any) => Promise<void>;
}

// Default tracking steps
const getDefaultTrackingSteps = (currentStatus: EmergencyStatus): TrackingStep[] => {
    const statuses: { status: EmergencyStatus; label: string; description: string; icon: string }[] = [
        { status: 'pending', label: 'Laporan Terkirim', description: 'Laporan Anda telah berhasil dikirim ke sistem.', icon: 'checkmark-circle' },
        { status: 'diterima', label: 'Laporan Diterima', description: 'Laporan Anda telah masuk ke sistem pusat command center.', icon: 'business' },
        { status: 'diproses', label: 'Sedang Diproses', description: 'Tim sedang melakukan verifikasi dan persiapan unit menuju lokasi.', icon: 'sync' },
        { status: 'selesai', label: 'Penanganan Selesai', description: 'Laporan ditutup dan diarsipkan.', icon: 'flag' },
    ];

    const statusOrder = ['pending', 'diterima', 'diproses', 'selesai'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return statuses.map((step, index) => ({
        ...step,
        isCompleted: index < currentIndex,
        isActive: index === currentIndex,
        timestamp: index <= currentIndex ? new Date().toISOString() : undefined
    }));
};

const useEmergencyStore = create<EmergencyStore>()(
    persist(
        (set, get) => ({
            reports: [],
            activeReport: null,
            showEmergencyModal: false,
            modalData: null,
            loading: false,
            error: null,

            fetchMyActiveReport: async (userId) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.get('/darurat');
                    if (response.data.success) {
                        const allReports: EmergencyReport[] = response.data.data.content || [];

                        // Find user's active report (status not 'selesai' or 'dibatalkan')
                        const myActiveReport = allReports.find(
                            (r) => String(r.userId) === String(userId) &&
                                r.status !== 'selesai' &&
                                r.status !== 'dibatalkan'
                        );

                        set({
                            reports: allReports,
                            activeReport: myActiveReport || null,
                            loading: false
                        });
                    } else {
                        set({ error: 'Failed to fetch emergency reports', loading: false });
                    }
                } catch (error: any) {
                    set({ error: error.message || 'Error fetching data', loading: false });
                }
            },

            createReport: async (data: any) => {
                set({ loading: true, error: null });
                try {
                    const token = useAuthStore.getState().token;
                    const parts: any[] = [
                        { name: 'latitude', data: String(data.latitude) },
                        { name: 'longitude', data: String(data.longitude) },
                        { name: 'pesan', data: data.pesan },
                        { name: 'status', data: 'pending' }
                    ];

                    if (data.userId) {
                        parts.push({ name: 'userId', data: String(data.userId) });
                    }

                    if (data.dinasId) {
                        parts.push({ name: 'dinasId', data: String(data.dinasId) });
                    }

                    if (data.foto && data.foto.uri) {
                        const fileType = data.foto.type || 'image/jpeg';
                        const compressedUri = await compressImage(data.foto.uri, fileType);

                        if (compressedUri) {
                            const extension = fileType.includes('png') ? '.png' : '.jpg';
                            const fileName = data.foto.fileName || `emergency_${Date.now()}${extension}`;
                            const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                            parts.push({
                                name: 'foto',
                                filename: fileName,
                                type: fileType,
                                data: ReactNativeBlobUtil.wrap(realUri)
                            });
                        }
                    }

                    // Debug: Log payload before sending
                    console.log('=== CREATE EMERGENCY REPORT DEBUG (RN Blob Util) ===');
                    console.log('Payload Parts:', JSON.stringify(parts.map(p => ({ ...p, data: p.name === 'foto' ? '[BINARY]' : p.data })), null, 2));

                    const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/darurat`, {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }, parts);

                    const respStatus = response.info().status;
                    const respText = await response.text();
                    console.log('API Response Status:', respStatus);
                    console.log('API Response Body:', respText);

                    let respJson;
                    try {
                        respJson = JSON.parse(respText);
                    } catch (e) {
                         throw new Error(`Invalid JSON response: ${respText.substring(0, 100)}...`);
                    }

                    if (respStatus >= 200 && respStatus < 300 && respJson.success) {
                        const newReport: EmergencyReport = respJson.data;
                        const currentReports = get().reports;

                        set({
                            reports: [newReport, ...currentReports],
                            activeReport: newReport,
                            showEmergencyModal: true,
                            modalData: newReport,
                            loading: false
                        });

                        return newReport;
                    } else {
                        throw new Error(respJson.message || 'Gagal mengirim laporan');
                    }
                } catch (error: any) {
                    let errorMessage = 'Gagal mengirim laporan darurat';
                    
                    if (error.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.message === 'Network Error' || error.message?.includes('Network request failed')  || error.code === 'ECONNABORTED') {
                        errorMessage = 'Gangguan koneksi internet. Pastikan Anda terhubung ke internet lalu coba lagi.';
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    set({ loading: false, error: errorMessage });
                    throw new Error(errorMessage);
                }
            },

            completeReport: () => {
                const { activeReport } = get();
                if (activeReport) {
                    set({
                        activeReport: { ...activeReport, status: 'selesai' }
                    });
                    // Clear after a moment to allow UI transition
                    setTimeout(() => {
                        set({ activeReport: null });
                    }, 500);
                }
            },

            clearActiveReport: () => {
                set({ activeReport: null });
            },

            getTrackingSteps: () => {
                const { activeReport } = get();
                if (!activeReport) return [];
                return getDefaultTrackingSteps(activeReport.status);
            },

            setModalVisible: (visible: boolean, data?: EmergencyReport) => {
                set({
                    showEmergencyModal: visible,
                    modalData: data || (visible ? get().activeReport : null)
                });
            },

    updateReportStatus: async (id, status, existingData?: EmergencyReport, extraData?: any) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const sourceData = existingData || 
                              get().reports.find(r => r.id === id) || 
                              (get().activeReport?.id === id ? get().activeReport : null) || 
                              (get().modalData?.id === id ? get().modalData : null);

            const parts: any[] = [
                { name: 'status', data: status }
            ];

            if (sourceData) {
                if (sourceData.pesan) parts.push({ name: 'pesan', data: sourceData.pesan });
                if (sourceData.latitude !== undefined) parts.push({ name: 'latitude', data: String(sourceData.latitude) });
                if (sourceData.longitude !== undefined) parts.push({ name: 'longitude', data: String(sourceData.longitude) });
                if (sourceData.userId) parts.push({ name: 'userId', data: String(sourceData.userId) });
                if (sourceData.dinasId) parts.push({ name: 'dinasId', data: String(sourceData.dinasId) });
            }

            // Handle extraData (fotoSelesai, updatedBy, etc.)
            if (extraData) {
                if (extraData.updatedBy) {
                    parts.push({ name: 'updatedBy', data: String(extraData.updatedBy) });
                }
                if (extraData.updatedByName) {
                    parts.push({ name: 'updatedByName', data: extraData.updatedByName });
                }
                
                // Handle fotoSelesai logic
                if (extraData.fotoSelesai && extraData.fotoSelesai.uri) {
                    const photo = extraData.fotoSelesai;
                    const fileType = photo.type || 'image/jpeg';
                    const compressedUri = await compressImage(photo.uri, fileType);
                    
                    if (compressedUri) {
                        const extension = fileType.includes('png') ? '.png' : '.jpg';
                        const fileName = photo.fileName || `emergency_selesai_${Date.now()}${extension}`;
                        const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;

                        parts.push({
                            name: 'fotoSelesai',
                            filename: fileName,
                            type: fileType,
                            data: ReactNativeBlobUtil.wrap(realUri)
                        });
                    }
                }
            }

            console.log(`Updating Status #${id} to ${status} via BlobUtil...`);
            // Debug parts
            // console.log('Parts:', JSON.stringify(parts.map(p => ({...p, data: p.data?.length > 100 ? '[BLOB]' : p.data})), null, 2));
            
            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/darurat/${id}`, {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }, parts);

            const respStatus = response.info().status;
            const respText = await response.text();
            
            let respJson;
            try {
                respJson = JSON.parse(respText);
            } catch (e) {
                 throw new Error('Invalid JSON response from server');
            }
            
            if (respStatus >= 200 && respStatus < 300 && respJson.success) {
                const updatedReport = respJson.data;
                
                // Update local list
                const currentReports = get().reports.map(r => 
                    r.id === id ? { ...r, ...updatedReport, status: status as any } : r
                );
                
                // Update active report if matches
                const activeReport = get().activeReport;
                const updatedActive = activeReport?.id === id ? { ...activeReport, ...updatedReport, status: status as any } : activeReport;

                set({ 
                    reports: currentReports, 
                    activeReport: updatedActive, 
                    modalData: updatedReport || (get().modalData?.id === id ? { ...get().modalData, ...updatedReport, status: status as any } : get().modalData),
                    loading: false 
                });
                return true;
            } else {
                throw new Error(respJson.message || 'Gagal update status');
            }
        } catch (error: any) {
            console.log('Update status failed:', error);
            set({ loading: false, error: error.message || 'Gagal update status' });
            return false;
        }
    },

            showModalWithFetch: async (eventId) => {
                if (!eventId) return;
                const idStr = String(eventId);
                console.log('Fetching emergency report for modal:', idStr);

                set({ loading: true, showEmergencyModal: true, modalData: null, error: null });

                try {
                    // 1. Try to find in existing store reports first
                    const existing = get().reports.find(r => String(r.id) === idStr);
                    if (existing) {
                        set({ modalData: existing, loading: false });
                        return;
                    }

                    // 2. Try fetching specific report by ID directly (REST standard)
                    try {
                        const directRes = await api.get(`/darurat/${idStr}`);
                        if (directRes.data.success && directRes.data.data) {
                            set({ modalData: directRes.data.data, loading: false });
                            return;
                        }
                    } catch (e) {
                        console.log('Direct fetch by ID not supported or failed, falling back to list...');
                    }

                    // 3. Fallback: Search in recent list
                    const response = await api.get('/darurat?size=50');
                    if (response.data.success) {
                        const allReports: EmergencyReport[] = response.data.data.content || [];
                        const found = allReports.find(r => String(r.id) === idStr);

                        if (found) {
                            set({ modalData: found, loading: false });
                        } else {
                            console.log(`Report ${idStr} not found in recent list`);

                            // 4. Last resort: if we have an activeReport and it's what they probably meant
                            const active = get().activeReport;
                            if (active) {
                                set({ modalData: active, loading: false });
                            } else {
                                set({
                                    loading: false,
                                    error: 'Laporan tidak ditemukan. Mungkin laporan sudah lama atau telah dihapus.'
                                });
                            }
                        }
                    } else {
                        set({ loading: false, error: 'Gagal menghubungi pusat data darurat' });
                    }
                } catch (error) {
                    console.log('Error in showModalWithFetch:', error);
                    set({ loading: false, error: 'Terjadi kesalahan koneksi' });
                }
            },

            fetchReports: async (params?: any) => {
                set({ loading: true, error: null });
                try {
                    // Build query string logic if needed, or pass params directly if api supports it
                    // Assuming api.get supports params object in axios config, but here we use custom api wrapper.
                    // Let's manually build query string for safety or use params if the api wrapper supports it.
                    // Checking existing code: api.get('/darurat') is used.
                    // We'll append query string.
                    
                    let query = '/darurat';
                    const queryParams: string[] = [];
                    
                    const user = useAuthStore.getState().user;

                    // Default sort
                    queryParams.push('sort=createdAt,desc');

                    if (params) {
                        if (params.status) queryParams.push(`status=${params.status}`);
                        if (params.page !== undefined) queryParams.push(`page=${params.page}`);
                        
                        // Handle dinasId based on role
                        if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
                            if (user.dinasId) {
                                queryParams.push(`dinasId=${user.dinasId}`);
                            }
                        } else if (params.dinasId) {
                            queryParams.push(`dinasId=${params.dinasId}`);
                        }
                    } else {
                         // Even if no params passed, check role for dinasId
                        if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
                            if (user && user.dinasId) {
                                queryParams.push(`dinasId=${user.dinasId}`);
                            }
                        }
                    }

                    if (queryParams.length > 0) {
                        query += `?${queryParams.join('&')}`;
                    }

                    const response = await api.get(query);
                    if (response.data.success) {
                         const content = response.data.data.content || [];
                         set({ 
                             reports: content, 
                             loading: false 
                         });
                    } else {
                        set({ error: 'Gagal memuat data laporan darurat', loading: false });
                    }
                } catch (error: any) {
                    set({ error: error.message || 'Gagal memuat data', loading: false });
                }
            }
        }),
        {
            name: 'emergency-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                activeReport: state.activeReport
            }),
        }
    )
);

export default useEmergencyStore;

