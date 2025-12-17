import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.barayaapp.auth';

/**
 * Secure storage service using react-native-keychain
 * Provides encrypted storage for sensitive data like JWT tokens
 */
export const SecureStorage = {
    /**
     * Store the authentication token securely
     */
    setToken: async (token: string): Promise<boolean> => {
        try {
            await Keychain.setGenericPassword('authToken', token, {
                service: TOKEN_SERVICE,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
            });
            return true;
        } catch (error) {
            console.error('Error storing token:', error);
            return false;
        }
    },

    /**
     * Retrieve the stored authentication token
     */
    getToken: async (): Promise<string | null> => {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: TOKEN_SERVICE,
            });

            if (credentials && credentials.password) {
                return credentials.password;
            }
            return null;
        } catch (error) {
            console.error('Error retrieving token:', error);
            return null;
        }
    },

    /**
     * Remove the stored authentication token
     */
    removeToken: async (): Promise<boolean> => {
        try {
            await Keychain.resetGenericPassword({
                service: TOKEN_SERVICE,
            });
            return true;
        } catch (error) {
            console.error('Error removing token:', error);
            return false;
        }
    },

    /**
     * Check if a token exists in secure storage
     */
    hasToken: async (): Promise<boolean> => {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: TOKEN_SERVICE,
            });
            return !!credentials;
        } catch (error) {
            return false;
        }
    },
};

export default SecureStorage;
