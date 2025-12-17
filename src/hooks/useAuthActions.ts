import api from "../config/api";
import useAuthStore from "../stores/authStore";
import { LoginCredentials, LoginResult } from "../types/auth";

/**
 * Custom hook for authentication actions (login/logout)
 * Separates API logic from state management
 */
export const useAuthActions = () => {
    const signIn = useAuthStore((state) => state.signIn);
    const signOut = useAuthStore((state) => state.signOut);

    /**
     * Login with email and password
     * Makes API call and updates auth state on success
     */
    const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
        try {
            // 1. API Call: Send credentials to the server
            const response = await api.post("/auth/login", credentials);

            // 2. Extract token from response
            const token = response.data?.data?.token;

            if (!token) {
                return {
                    success: false,
                    message: "Token tidak ditemukan dalam response",
                };
            }

            // 3. State Update: Use the token to update the Zustand store
            signIn(token);

            return { success: true };
        } catch (error: any) {
            // Log for debugging (using console.log instead of console.error to avoid LogBox popup)
            console.log("Login failed:", error.response?.data || error.message);

            // Handle different error scenarios
            let message = "Terjadi kesalahan pada server";

            if (error.response) {
                const status = error.response.status;
                if (status === 404) {
                    message = "Email belum terdaftar, silahkan hubungi administrator";
                } else if (status === 401 || status === 400) {
                    message = "Email atau kata sandi salah";
                } else if (error.response.data?.message) {
                    message = error.response.data.message;
                }
            } else if (error.code === 'ECONNABORTED') {
                message = "Koneksi timeout, silakan coba lagi";
            } else if (!error.response) {
                message = "Tidak dapat terhubung ke server";
            }

            return { success: false, message };
        }
    };

    /**
     * Logout - clear auth state and secure storage
     */
    const logout = () => {
        signOut();
    };

    return {
        login,
        logout,
    };
};

export default useAuthActions;
