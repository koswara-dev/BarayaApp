// Auth Types for the application

export type UserRole = 'ADMIN' | 'STAFF' | 'USER';

export interface User {
    id: string;
    email?: string; // Made optional as it's not in the new token structure
    fullName: string;
    role: UserRole;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isHydrated: boolean;

    // Actions
    signIn: (token: string) => void;
    signOut: () => void;
    checkAuth: () => Promise<void>;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResult {
    success: boolean;
    message?: string;
}

// JWT Payload structure (updated based on user request)
export interface JWTPayload {
    sub: string;      // user id
    role: UserRole;
    fullName: string;
    exp: number;      // expiration timestamp
    iat: number;      // issued at timestamp
}
