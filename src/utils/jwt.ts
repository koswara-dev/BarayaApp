import { jwtDecode } from "jwt-decode";
import { JWTPayload, User } from "../types/auth";

/**
 * Decode JWT token and extract payload
 */
export const decodeToken = (token: string): JWTPayload | null => {
    try {
        return jwtDecode<JWTPayload>(token);
    } catch (e) {
        // console.error('Error decoding JWT:', e);
        return null;
    }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        // exp is in seconds, Date.now() is in milliseconds
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch {
        return true;
    }
};

/**
 * Extract user data from JWT token
 */
export const extractUserFromToken = (token: string): User | null => {
    try {
        const decoded = decodeToken(token);
        if (!decoded) return null;

        // // Log for debugging (will show in terminal/console)
        // console.log('Decoded JWT Payload:', decoded);

        // Try to get ID from various possible fields
        const id = decoded.sub || (decoded as any).id || (decoded as any).userId || (decoded as any).uid;

        if (!id) {
            // console.error('No ID found in token payload');
            return null;
        }

        return {
            id: String(id), // Ensure it's a string
            fullName: decoded.fullName || (decoded as any).name || 'User',
            username: decoded.username || (decoded as any).preferred_username,
            email: decoded.email,
            role: decoded.role || 'USER',
        };
    } catch (e) {
        // console.error('Error extracting user from token:', e);
        return null;
    }
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpirationTime = (token: string): number | null => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return null;
        return decoded.exp * 1000; // Convert to milliseconds
    } catch {
        return null;
    }
};
