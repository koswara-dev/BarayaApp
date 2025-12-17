import { create } from 'zustand';
import api from '../config/api';

interface EmergencyNotification {
    id: number;
    userId: number;
    fullName: string;
    phoneNumber: string;
    latitude: number;
    longitude: number;
    pesan: string;
    urlFoto: string;
    createdAt: string;
    updatedAt: string;
}

interface EmergencyStore {
    reports: EmergencyNotification[];
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
            const formData = new FormData();
            formData.append('latitude', String(data.latitude));
            formData.append('longitude', String(data.longitude));
            formData.append('pesan', data.pesan);
            formData.append('status', 'pending'); // Default status

            if (data.userId) {
                formData.append('userId', String(data.userId));
            }

            if (data.dinasId) {
                formData.append('dinasId', String(data.dinasId));
            }

            if (data.foto) {
                const fileType = data.foto.type || 'image/jpeg';
                const extension = fileType.includes('png') ? '.png' : '.jpg';

                formData.append('foto', {
                    uri: data.foto.uri,
                    type: fileType,
                    name: data.foto.fileName || `emergency_${Date.now()}${extension}`,
                } as any);
            }

            const response = await api.post('/notifikasi-darurat', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            set({ loading: false });
            if (response.data.success) {
                // Refresh list if needed, but primarily return the new data
                const newReport = response.data.data;
                // Optionally add to local list immediately
                const currentReports = get().reports;
                set({ reports: [newReport, ...currentReports] });

                return newReport;
            } else {
                throw new Error(response.data.message || 'Gagal mengirim laporan');
            }
        } catch (error: any) {
            set({ loading: false, error: error.message });
            throw error;
        }
    }
}));

export default useEmergencyStore;
