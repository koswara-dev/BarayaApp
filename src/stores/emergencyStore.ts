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
                    if (!token) throw new Error("Authentication required");

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

                            let uri = compressedUri;
                            if (Platform.OS === 'ios') {
                                uri = uri.replace('file://', '');
                            }

                            parts.push({
                                name: 'foto',
                                filename: fileName,
                                type: fileType,
                                data: ReactNativeBlobUtil.wrap(uri)
                            });
                        }
                    }

                    const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/darurat`, {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }, parts);

                    const responseText = await response.text();

                    let responseData;
                    try {
                        responseData = JSON.parse(responseText);
                    } catch (e) {
                        responseData = { success: false, message: 'Invalid response from server' };
                    }

                    if (response.info().status >= 200 && response.info().status < 300 && responseData.success) {
                        const newReport: EmergencyReport = responseData.data;
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
                        throw new Error(responseData.message || 'Gagal mengirim laporan');
                    }
                } catch (error: any) {
                    set({ loading: false, error: error.message || 'Gagal mengirim data' });
                    throw error;
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

