import axios from "axios";
import useAuthStore from "../stores/authStore";
import useToastStore from "../stores/toastStore";
import { reset } from "../navigation/navigationRef";

const API_BASE_URL = "http://103.197.191.113:8080/api/v1";

/**
 * Axios instance configured with base URL and default headers
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request Interceptor: Add JWT token to every request
 */
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor: Handle 401 Unauthorized errors globally
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Skip handling for login endpoint
        if (error.config?.url?.includes('/auth/login')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            // Token expired or invalid - trigger sign out
            const signOut = useAuthStore.getState().signOut;
            signOut();

            // Show toast notification
            useToastStore.getState().showToast(
                "Sesi telah berakhir, silakan login kembali",
                "error"
            );

            // Navigate to login screen
            reset("Login");
        }

        return Promise.reject(error);
    }
);

export default api;
