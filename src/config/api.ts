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
 * Attempts to refresh the token before signing out
 */
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip handling for auth endpoints
        if (originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/refresh') ||
            originalRequest?.url?.includes('/auth/register')) {
            return Promise.reject(error);
        }

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue the request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Attempt to refresh the token
                const refreshSuccess = await useAuthStore.getState().refreshAccessToken();

                if (refreshSuccess) {
                    const newToken = useAuthStore.getState().token;
                    processQueue(null, newToken);
                    isRefreshing = false;

                    // Retry the original request with new token
                    if (newToken) {
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                }

                // Refresh failed, sign out
                processQueue(error, null);
                isRefreshing = false;

                const signOut = useAuthStore.getState().signOut;
                signOut();

                useToastStore.getState().showToast(
                    "Sesi telah berakhir, silakan login kembali",
                    "error"
                );

                // Delay navigation to allow other processes to complete
                setTimeout(() => {
                    try {
                        reset("Login");
                    } catch (navError) {
                        console.error('Navigation error:', navError);
                    }
                }, 100);

                return Promise.reject(error);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                const signOut = useAuthStore.getState().signOut;
                signOut();

                useToastStore.getState().showToast(
                    "Sesi telah berakhir, silakan login kembali",
                    "error"
                );

                setTimeout(() => {
                    try {
                        reset("Login");
                    } catch (navError) {
                        console.error('Navigation error:', navError);
                    }
                }, 100);

                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
