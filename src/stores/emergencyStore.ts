import { create } from 'zustand';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';

interface EmergencyNotification {
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
    createReport: (data: any) => Promise<any>;
}

const useEmergencyStore = create<EmergencyStore>((set, get) => ({
    reports: [],
    loading: false,
    error: null,
    fetchReports: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/notifikasi-darurat');
            if (response.data.success) {
                set({ reports: response.data.data.content, loading: false });
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
            console.log('Preparing ReactNativeBlobUtil request...');

            const parts: any[] = [
                { name: 'latitude', data: String(data.latitude) },
                { name: 'longitude', data: String(data.longitude) },
                { name: 'pesan', data: data.pesan },
                { name: 'status', data: 'pending' },
            ];

            if (data.userId) parts.push({ name: 'userId', data: String(data.userId) });
            if (data.dinasId) parts.push({ name: 'dinasId', data: String(data.dinasId) });

            if (data.foto) {
                const photoAsset = data.foto;
                let imagePath = photoAsset.uri;

                // Clean up URI for wrap
                if (Platform.OS === 'ios') {
                    imagePath = imagePath.replace('file://', '');
                } else {
                    // Android: usually content:// or file://
                    // ReactNativeBlobUtil often handles content:// if passed directly or needs real path
                    // For now, try removing file:// if present
                    if (imagePath.startsWith('file://')) {
                         imagePath = imagePath.replace('file://', '');
                    }
                }

                console.log('DEBUG: Image Path for Blob:', imagePath);

                parts.push({
                    name: 'foto',
                    filename: photoAsset.fileName || `emergency_${Date.now()}.jpg`,
                    type: photoAsset.type || 'image/jpeg',
                    data: ReactNativeBlobUtil.wrap(decodeURIComponent(imagePath))
                });
            }

            const token = useAuthStore.getState().token;
            
            const response = await ReactNativeBlobUtil.fetch('POST', `${API_BASE_URL}/notifikasi-darurat`, {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }, parts);

            // Parse response
            // ReactNativeBlobUtil response.data is string or base64 strings usually
            // .json() is a helper method on the response object
            const responseJson = await response.json();

            // Check logging
            console.log('Upload Response status:', response.info().status);
            // console.log('Upload Response body:', responseJson);

            if (response.info().status >= 200 && response.info().status < 300 && responseJson.success) {
                const newReport = responseJson.data;
                const currentReports = get().reports;
                set({ reports: [newReport, ...currentReports], loading: false });
                return newReport;
            } else {
                throw new Error(responseJson.message || 'Gagal mengirim laporan');
            }
        } catch (error: any) {
            console.error('Create Report Error:', error.message || error);
            set({ loading: false, error: error.message || 'Terjadi kesalahan' });
            throw error;
        }
    }
}));

export default useEmergencyStore;

