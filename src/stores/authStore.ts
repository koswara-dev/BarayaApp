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
    isLoading: true, // Start as loading while checking storage
    isHydrated: false,

    /**
     * SIGN IN: Process a new token (received after successful login API call)
     * Stores token securely and extracts user data from JWT
     */
    signIn: (token: string) => {
        try {
            // Check if token is expired
            if (isTokenExpired(token)) {
                console.error('Token is already expired');
                set({ user: null, token: null, isLoading: false });
                return;
            }

            // Extract user data from token
            const user = extractUserFromToken(token);
            if (!user) {
                console.error('Failed to extract user from token');
                set({ user: null, token: null, isLoading: false });
                return;
            }

            // Update state
            set({ user, token, isLoading: false });

            // Store token securely (async, fire and forget)
            SecureStorage.setToken(token).catch(console.error);

            // Fetch user profile from userStore
            if (user.id) {
                // Dynamic import to avoid circular dependency
                const useUserStore = require('./userStore').default;
                useUserStore.getState().fetchUserProfile(user.id);
            }
        } catch (error) {
            console.error('Sign in failed:', error);
            set({ user: null, token: null, isLoading: false });
        }
    },

    /**
     * SIGN OUT: Clear state and remove token from secure storage
     */
    signOut: () => {
        set({ user: null, token: null, isLoading: false });
        SecureStorage.removeToken().catch(console.error);

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

            if (!token) {
                set({ user: null, token: null, isLoading: false, isHydrated: true });
                return;
            }

            // Check if token is expired
            if (isTokenExpired(token)) {
                // console.log('Stored token is expired, clearing...');
                await SecureStorage.removeToken();
                set({ user: null, token: null, isLoading: false, isHydrated: true });
                return;
            }

            // Extract user from valid token
            const user = extractUserFromToken(token);
            if (!user) {
                // console.error('Failed to extract user from stored token');
                await SecureStorage.removeToken();
                set({ user: null, token: null, isLoading: false, isHydrated: true });
                return;
            }

            // Restore session
            set({ user, token, isLoading: false, isHydrated: true });

            // Fetch user profile from userStore
            if (user.id) {
                const useUserStore = require('./userStore').default;
                useUserStore.getState().fetchUserProfile(user.id);
            }
        } catch (error) {
            // console.error('Failed to check auth:', error);
            set({ user: null, token: null, isLoading: false, isHydrated: true });
        }
    },
}));

export default useAuthStore;

