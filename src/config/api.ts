import axios from "axios";
import useAuthStore from "../stores/authStore";
import useToastStore from "../stores/toastStore";
import { reset } from "../navigation/navigationRef";

export const API_BASE_URL = "http://103.197.191.113:8080/api/v1";
export const UPLOADS_BASE_URL = "http://103.197.191.113:8080/uploads/";

/**
 * Helper function to get full image URL from relative path
 * @param path - relative path like "foto.jpg" or full URL
 * @returns full URL to the image
 */
export const getImageUrl = (path: string | undefined | null): string => {
    if (!path) return '';
    // If already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    // Remove 'uploads/' prefix if present to avoid duplication
    const finalPath = cleanPath.startsWith('uploads/') ? cleanPath.substring(8) : cleanPath;
    return `${UPLOADS_BASE_URL}${finalPath}`;
};

/**
 * Axios instance configured with base URL and default headers
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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
