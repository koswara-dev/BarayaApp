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
    loading: boolean;
    error: string | null;

    // Actions
    createReport: (data: any) => Promise<EmergencyReport>;
    fetchMyActiveReport: (userId: number | string) => Promise<void>;
    completeReport: () => void;
    clearActiveReport: () => void;
    getTrackingSteps: () => TrackingStep[];
}

// Default tracking steps
const getDefaultTrackingSteps = (currentStatus: EmergencyStatus): TrackingStep[] => {
    const statuses: { status: EmergencyStatus; label: string; description: string; icon: string }[] = [
        { status: 'pending', label: 'Laporan Dikirim', description: 'Laporan Anda telah berhasil dikirim', icon: 'paper-plane' },
        { status: 'diterima', label: 'Laporan Diterima', description: 'Tim terkait telah menerima laporan Anda', icon: 'checkmark-circle' },
        { status: 'diproses', label: 'Sedang Ditangani', description: 'Tim sedang menuju lokasi Anda', icon: 'car' },
        { status: 'selesai', label: 'Selesai', description: 'Laporan telah selesai ditangani', icon: 'shield-checkmark' },
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
            loading: false,
            error: null,

            fetchMyActiveReport: async (userId) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.get('/notifikasi-darurat');
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

                    if (data.foto) {
                        const fileType = data.foto.type || 'image/jpeg';
                        const compressedUri = await compressImage(data.foto.uri, fileType);
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

                    const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/notifikasi-darurat`, {
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

