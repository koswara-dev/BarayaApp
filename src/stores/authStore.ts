import { create } from "zustand";
import { AuthState, User } from "../types/auth";
import { SecureStorage } from "../services/secureStorage";
import { extractUserFromToken, isTokenExpired } from "../utils/jwt";

/**
 * Zustand Auth Store
 * Central source of truth for authentication state
 * Uses react-native-keychain for secure token storage
 */
const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true, // Start as loading while checking storage
    isHydrated: false,

    /**
     * SIGN IN: Process a new token (received after successful login API call)
     * Stores token and refreshToken securely and extracts user data from JWT
     */
    signIn: (token: string, refreshToken?: string) => {
        try {
            // Check if token is expired
            if (isTokenExpired(token)) {
                console.error('Token is already expired');
                set({ user: null, token: null, refreshToken: null, isLoading: false });
                return;
            }

            // Extract user data from token
            const user = extractUserFromToken(token);
            if (!user) {
                console.error('Failed to extract user from token');
                set({ user: null, token: null, refreshToken: null, isLoading: false });
                return;
            }

            // Update state
            set({ user, token, refreshToken: refreshToken || null, isLoading: false });

            // Store token and refreshToken securely (async, fire and forget)
            SecureStorage.setToken(token).catch(console.error);
            if (refreshToken) {
                SecureStorage.setRefreshToken(refreshToken).catch(console.error);
            }

            // Fetch user profile from userStore
            if (user.id) {
                // Dynamic import to avoid circular dependency
                const useUserStore = require('./userStore').default;
                useUserStore.getState().fetchUserProfile(user.id);
            }
        } catch (error) {
            console.error('Sign in failed:', error);
            set({ user: null, token: null, refreshToken: null, isLoading: false });
        }
    },

    /**
     * SIGN OUT: Clear state and remove token from secure storage
     */
    signOut: () => {
        set({ user: null, token: null, refreshToken: null, isLoading: false });
        SecureStorage.removeToken().catch(console.error);
        SecureStorage.removeRefreshToken().catch(console.error);

        // Clear user profile from userStore
        const useUserStore = require('./userStore').default;
        useUserStore.setState({ profile: null, error: null });
    },

    /**
     * CHECK AUTH: Called on app startup to restore session
     * Retrieves token from secure storage and validates it
     */
    checkAuth: async () => {
        set({ isLoading: true });

        try {
            const token = await SecureStorage.getToken();
            const refreshToken = await SecureStorage.getRefreshToken();

            if (!token) {
                if (refreshToken) {
                    // No access token but have refresh token, try to refresh
                    console.log('No access token but found refresh token, attempting refresh...');
                    set({ refreshToken });
                    const success = await get().refreshAccessToken();
                    if (success) {
                        set({ isLoading: false, isHydrated: true });
                        return;
                    }
                }
                set({ user: null, token: null, refreshToken: null, isLoading: false, isHydrated: true });
                return;
            }

            // Check if token is expired
            if (isTokenExpired(token)) {
                if (refreshToken) {
                    // Token expired but have refresh token, try to refresh
                    console.log('Access token expired, attempting refresh...');
                    set({ token, refreshToken }); // Set baseline for refresh function
                    const success = await get().refreshAccessToken();
                    if (success) {
                        set({ isLoading: false, isHydrated: true });
                        return;
                    }
                }

                // Refresh failed or no refresh token
                await SecureStorage.removeToken();
                await SecureStorage.removeRefreshToken();
                set({ user: null, token: null, refreshToken: null, isLoading: false, isHydrated: true });
                return;
            }

            // Extract user from valid token
            const user = extractUserFromToken(token);
            if (!user) {
                await SecureStorage.removeToken();
                await SecureStorage.removeRefreshToken();
                set({ user: null, token: null, refreshToken: null, isLoading: false, isHydrated: true });
                return;
            }

            // Restore session
            set({ user, token, refreshToken, isLoading: false, isHydrated: true });

            // Fetch user profile from userStore
            if (user.id) {
                const useUserStore = require('./userStore').default;
                useUserStore.getState().fetchUserProfile(user.id);
            }
        } catch (error) {
            set({ user: null, token: null, refreshToken: null, isLoading: false, isHydrated: true });
        }
    },

    /**
     * REFRESH ACCESS TOKEN: Use refresh token to get a new access token
     */
    refreshAccessToken: async (): Promise<boolean> => {
        const { refreshToken } = get();

        if (!refreshToken) {
            console.log('Refresh token attempt aborted: No refresh token stored');
            return false;
        }

        try {
            const API_BASE_URL = "http://103.197.191.113:8080/api/v1";
            console.log('Attempting to refresh access token...');

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                console.log('Refresh token API returned error status:', response.status);
                throw new Error('Refresh token failed');
            }

            const data = await response.json();

            if (data.success && data.data?.token) {
                const newToken = data.data.token;
                const newRefreshToken = data.data.refreshToken || refreshToken;

                // Extract user from new token
                const user = extractUserFromToken(newToken);
                if (!user) {
                    console.log('Refresh failed: Failed to extract user from new token');
                    return false;
                }

                console.log('Token refreshed successfully');

                // Update state and storage
                set({ user, token: newToken, refreshToken: newRefreshToken });
                await SecureStorage.setToken(newToken);
                if (data.data.refreshToken) {
                    await SecureStorage.setRefreshToken(newRefreshToken);
                }

                return true;
            }

            console.log('Refresh failed: Data structure mismatch or success=false');
            return false;
        } catch (error) {
            console.log('Failed to refresh token (exception):', error);
            return false;
        }
    },
}));

export default useAuthStore;

