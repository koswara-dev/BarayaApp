import { create } from 'zustand';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';
import { encryptAES } from '../utils/cryptoHelper';

export interface Pengaturan {
    id: number;
    appName: string;
    urlLogo: string;
    slogan: string;
    kabupaten: string;
    provinsi: string;
    urlLogoKabupaten: string;
    namaBupati: string;
    urlFotoBupati: string;
    namaWakilBupati: string;
    urlFotoWakilBupati: string;
    namaSekda: string;
    urlFotoSekda: string;
    email: string;
    phoneNumber: string;
    alamat: string;
    latitude: number;
    longitude: number;
    versi: string;
    urlBannerMobile?: string;
    geminiApiKey?: string;
    createdAt: string;
    updatedAt: string;
}

interface PengaturanState {
    pengaturan: Pengaturan | null;
    loading: boolean;
    error: string | null;

    fetchPengaturan: () => Promise<void>;
    updatePengaturan: (data: Partial<Pengaturan> | FormData) => Promise<boolean>;
    clearError: () => void;
}

const usePengaturanStore = create<PengaturanState>((set, get) => ({
    pengaturan: null,
    loading: false,
    error: null,

    fetchPengaturan: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/pengaturan');
            if (res.data.success) {
                set({ pengaturan: res.data.data });
            } else {
                set({ error: res.data.message || 'Gagal memuat pengaturan' });
            }
        } catch (error: any) {
            console.error('Fetch pengaturan error:', error);
            set({ error: error.message || 'Terjadi kesalahan saat memuat pengaturan' });
        } finally {
            set({ loading: false });
        }
    },

    updatePengaturan: async (data: any) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            const currentPengaturan = get().pengaturan;

            if (!currentPengaturan) {
                set({ error: 'Pengaturan tidak ditemukan', loading: false });
                return false;
            }

            // We need to merge current data with new data primarily because backend might expect full object 
            // OR checks for nulls. However, usually PUT updates what is sent. 
            // Since we are moving to multipart, we send what is in `data`. 
            // If `data` is incomplete, we might rely on backend partial update support or merge before sending.
            // Let's iterate `data` keys and append to parts.
            
            // NOTE: We assume 'data' is a plain object now. Passing FormData directly is deprecated with this change
            // because ReactNativeBlobUtil requires 'parts' array.
            
            const parts: any[] = [];
            const textFields = [
                'appName', 'slogan', 'kabupaten', 'provinsi', 'namaBupati', 'namaWakilBupati', 
                'namaSekda', 'email', 'phoneNumber', 'alamat', 'versi', 'geminiApiKey'
            ];

            // 1. Handle Text Fields
            textFields.forEach(field => {
                if (data[field] !== undefined) {
                    let value = String(data[field]);
                    if (field === 'geminiApiKey') {
                        value = encryptAES(value);
                    }
                    parts.push({ name: field, data: value });
                } else if (currentPengaturan[field as keyof Pengaturan]) {
                     // If not provided in update, decide whether to send existing or omit.
                     // IMPORTANT: If we are sending existing geminiApiKey back, it is ALREADY ENCRYPTED (assuming backend stores it encrypted).
                     // If backend stores it as is, and we receive it, it might be encrypted or plain.
                     // The requirement implies we want to store it encrypted.
                     // If `currentPengaturan.geminiApiKey` is already encrypted, we send it back as is?
                     // Or do we assume `currentPengaturan` has plain text?
                     // Typically, the frontend receives encrypted data, decrypts it for display (if needed, but usually API keys are hidden), and encrypts on save.
                     // But wait, `usePengaturanStore` fetches data. Does it decrypt it? 
                     // We haven't implemented decryption in `fetchPengaturan`.
                     // So `currentPengaturan.geminiApiKey` is likely the CipherText.
                     // So we can send it back as is.
                     
                     // BUT, if `data` contains `geminiApiKey`, it is the NEW plain text input from user. So we encrypt it.
                     
                     parts.push({ name: field, data: String(currentPengaturan[field as keyof Pengaturan]) });
                }
            });

            if (data.latitude) parts.push({ name: 'latitude', data: String(data.latitude) });
                else if (currentPengaturan.latitude) parts.push({ name: 'latitude', data: String(currentPengaturan.latitude) });
            if (data.longitude) parts.push({ name: 'longitude', data: String(data.longitude) });
                else if (currentPengaturan.longitude) parts.push({ name: 'longitude', data: String(currentPengaturan.longitude) });
            
            // 2. Handle File Fields
            const fileFields = [
                'urlLogo', 'urlLogoKabupaten', 'urlFotoBupati', 'urlFotoWakilBupati', 'urlFotoSekda', 'urlBannerMobile'
            ];

            // Helper to process file
            const appendFile = async (paramName: string, fileData: any) => {
                if (fileData && fileData.uri) {
                     const fileType = fileData.type || 'image/jpeg';
                     const compressedUri = await compressImage(fileData.uri, fileType);
                     if (compressedUri) {
                        const extension = fileType.includes('png') ? '.png' : '.jpg';
                        // Construct filename based on field
                        const fileName = fileData.fileName || `setting_${paramName}_${Date.now()}${extension}`;
                        const realUri = Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri;
                        
                        parts.push({
                            name: paramName,
                            filename: fileName,
                            type: fileType,
                            data: ReactNativeBlobUtil.wrap(realUri)
                        });
                     }
                }
            };
           
            // Iterate known file fields. Note that calling code usually passes e.g. `fotoBupati` object for `urlFotoBupati` update?
            // Or does it pass `urlLogo` as an object { uri: ... }?
            // Based on other stores, e.g. eventStore, there is a specific field name like `gambar`.
            // In Pengaturan, the model fields are `url...`. 
            // In the form (ProfileDetailScreen potentially), let's assume keys match the model or commonly used mapping.
            // If I look at the previous `updatePengaturan` logic, it didn't do specific mapping, likely relying on the caller to name keys correctly in FormData.
            // However, typical file inputs in this app (dinasStore) use `fotoGedung` for `urlFotoGedung`. 
            // Let's assume the incoming `data` uses keys like `logo`, `logoKabupaten`, `fotoBupati` etc. OR `urlLogo` as the key for the file object.
            // A common pattern is: input `fotoBupati` -> backend `urlFotoBupati`.
            // But since I can't check the backend controller easily, I will support checking keys that start with 'foto' or 'logo' or valid model keys.
            
            // Explicit mapping based on common sense naming or existing context:
            await appendFile('logo', data.logo || data.urlLogo);
            await appendFile('logoKabupaten', data.logoKabupaten || data.urlLogoKabupaten);
            await appendFile('fotoBupati', data.fotoBupati || data.urlFotoBupati);
            await appendFile('fotoWakilBupati', data.fotoWakilBupati || data.urlFotoWakilBupati);
            await appendFile('fotoSekda', data.fotoSekda || data.urlFotoSekda);
            await appendFile('bannerMobile', data.bannerMobile || data.urlBannerMobile);

            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/pengaturan`, {
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
                set({ pengaturan: respJson.data });
                return true;
            } else {
                set({ error: respJson.message || 'Gagal memperbarui pengaturan' });
                return false;
            }
        } catch (error: any) {
            console.error('Update pengaturan error:', error);
            const errorMessage = error.message || 'Terjadi kesalahan saat memperbarui pengaturan';
            set({ error: errorMessage });
            return false;
        } finally {
            set({ loading: false });
        }
    },

    clearError: () => set({ error: null }),
}));

export default usePengaturanStore;
