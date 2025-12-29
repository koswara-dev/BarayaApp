// Auth Types for the application

export enum Role {
    SUPERADMIN = 'SUPERADMIN',
    ADMIN = 'ADMIN',
    STAFF = 'STAFF',
    USER = 'USER',
}

export type UserRole = Role | string;

export interface User {
    id: string;
    email?: string;
    username?: string;
    fullName: string;
    role: UserRole;
    dinasId?: string; // Added to support role-based scoping (e.g. ADMIN of a specific dinas)
}


export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    isHydrated: boolean;

    // Actions
    signIn: (token: string, refreshToken?: string) => void;
    signOut: () => void;
    checkAuth: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResult {
    success: boolean;
    message?: string;
    data?: any;
}

// JWT Payload structure (updated based on user request)
export interface JWTPayload {
    sub: string;      // user id
    role: UserRole;
    fullName: string;
    username?: string; // Add username if available
    email?: string; // Add email if available
    exp: number;      // expiration timestamp
    iat: number;      // issued at timestamp
}
