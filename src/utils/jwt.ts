import { jwtDecode } from "jwt-decode";
import { JWTPayload, User } from "../types/auth";

/**
 * Decode JWT token and extract payload
 */
export const decodeToken = (token: string): JWTPayload | null => {
    try {
        return jwtDecode<JWTPayload>(token);
    } catch (e) {
        console.error('Error decoding JWT:', e);
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

        return {
            id: decoded.sub,
            // email property removed from token
            fullName: decoded.fullName,
            role: decoded.role,
        };
    } catch (e) {
        console.error('Error extracting user from token:', e);
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
