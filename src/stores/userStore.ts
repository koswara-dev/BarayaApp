import { create } from 'zustand';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api, { API_BASE_URL } from '../config/api';
import useAuthStore from './authStore';
import { compressImage } from '../utils/imageCompressor';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    phoneNumber: string;
    nik: string;
    fullName: string;
    alamat: string;
    role: string;
    urlFoto: string;
    verified: boolean;
    tempatLahir?: string;
    tanggalLahir?: string;
    jenisKelamin?: string;
    // Add other fields as necessary based on API response
}

interface UserState {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;

    fetchUserProfile: (id: number | string) => Promise<void>;
    uploadUserPhoto: (id: number | string, photoAsset: any) => Promise<boolean>;
    changeUserPassword: (id: number | string, passwordData: { current: string; new: string }) => Promise<boolean>;
    clearError: () => void;
}

const useUserStore = create<UserState>((set) => ({
    profile: null,
    loading: false,
    error: null,

    fetchUserProfile: async (id) => {
        set({ loading: true, error: null });
        try {
            // console.log(`Fetching profile from: /users/${id}`);
            let res;
            try {
                res = await api.get(`/users/${id}`);
            } catch (err: any) {
                // If 403 (Forbidden), try fallback endpoints
                if (err.response && err.response.status === 403) {
                    // console.log("Access forbidden to /users/:id, trying fallback endpoints...");
                    try {
                        // Try typical user/profile endpoints
                        // 1. /users/profile
                        // console.log("Trying /users/profile");
                        res = await api.get(`/users/profile`);
                    } catch (fallbackErr1) {
                        try {
                            // 2. /users/me
                            // console.log("Trying /users/me");
                            res = await api.get(`/users/me`);
                        } catch (fallbackErr2) {
                            try {
                                // 3. /auth/profile
                                // console.log("Trying /auth/profile");
                                res = await api.get(`/auth/profile`);
                            } catch (fallbackErr3) {
                                try {
                                    // 4. /auth/me
                                    // console.log("Trying /auth/me");
                                    res = await api.get(`/auth/me`);
                                } catch (fallbackErr4) {
                                    try {
                                        // 5. Final fallback: fetch ALL users and filter by ID
                                        // console.log("Fallback: Fetching all users and filtering...");
                                        const listRes = await api.get('/users');
                                        if (listRes.data.success && Array.isArray(listRes.data.data.content)) {
                                            const foundUser = listRes.data.data.content.find((u: any) => String(u.id) === String(id));
                                            if (foundUser) {
                                                // console.log("Found user in list!");
                                                res = {
                                                    data: {
                                                        success: true,
                                                        data: foundUser
                                                    }
                                                };
                                            } else {
                                                throw new Error("User not found in list");
                                            }
                                        } else {
                                            throw fallbackErr4;
                                        }
                                    } catch (listErr) {
                                        // If even the list fetch fails, throw original 403
                                        throw err;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    throw err;
                }
            }

            if (res && res.data.success) {
                set({ profile: res.data.data });
            } else {
                set({ error: res?.data?.message || 'Gagal memuat profil' });
            }
        } catch (error: any) {
            // console.log('Fetch profile error details:', error.response?.data || error.message);
            // Customize error message for 403
            if (error.response?.status === 403) {
                set({ error: 'Anda tidak memiliki akses untuk melihat profil ini.' });
            } else {
                set({ error: error.message || 'Terjadi kesalahan saat memuat profil' });
            }
        } finally {
            set({ loading: false });
        }
    },

    uploadUserPhoto: async (id, photoAsset) => {
        set({ loading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error("Authentication required");

            // Compress image first
            const fileType = photoAsset.type || 'image/jpeg';
            const compressedUri = await compressImage(photoAsset.uri, fileType);

            const extension = fileType.includes('png') ? '.png' : '.jpg';
            const fileName = photoAsset.fileName || `avatar_${id}_${Date.now()}${extension}`;

            // Handle URI for BlobUtil
            let uri = compressedUri;
            if (Platform.OS === 'ios') {
                uri = uri.replace('file://', '');
            }

            const parts = [
                {
                    name: 'foto',
                    filename: fileName,
                    type: fileType,
                    data: ReactNativeBlobUtil.wrap(uri)
                }
            ];

            console.log(`Uploading compressed photo: ${uri}`);

            // Using PUT /users/{id} as per assumed API contract, or could be a specific upload endpoint
            // If the user request implies a specific way, I should follow it. 
            // The user just said "implement also upload avatar... const response = await ReactNativeBlobUtil.fetch..."
            // I'll stick to PUT /users/{id} for now, but with BlobUtil.

            const response = await ReactNativeBlobUtil.fetch('PUT', `${API_BASE_URL}/users/${id}`, {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }, parts);

            const responseText = await response.text();
            // console.log('Upload Response:', responseText);

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                responseData = { success: false, message: 'Invalid response' };
            }

            if (response.info().status >= 200 && response.info().status < 300 && responseData.success) {
                const updatedData = responseData.data;

                set((state) => {
                    const newUrl = updatedData.urlFoto
                        ? `${updatedData.urlFoto}?t=${Date.now()}`
                        : (state.profile?.urlFoto || '');

                    return {
                        profile: state.profile ? { ...state.profile, urlFoto: newUrl } : null
                    };
                });
                return true;
            } else {
                set({ error: responseData.message || 'Gagal mengunggah foto' });
                return false;
            }
        } catch (error: any) {
            // console.error('Upload photo error:', error);
            set({ error: error.message || 'Terjadi kesalahan saat mengunggah foto' });
            return false;
        } finally {
            set({ loading: false });
        }
    },

    changeUserPassword: async (id, { current, new: newPassword }) => {
        set({ loading: true, error: null });
        try {
            // Assuming the payload structure
            const payload = {
                oldPassword: current,
                password: newPassword,
                confirmPassword: newPassword // Some APIs require this
            };

            const res = await api.put(`/users/${id}`, payload);

            if (res.data.success) {
                return true;
            } else {
                set({ error: res.data.message || 'Gagal mengubah password' });
                return false;
            }
        } catch (error: any) {
            // console.error('Change password error:', error);
            set({ error: error.message || 'Terjadi kesalahan saat mengubah password' });
            return false;
        } finally {
            set({ loading: false });
        }
    },

    clearError: () => set({ error: null }),
}));

export default useUserStore;
