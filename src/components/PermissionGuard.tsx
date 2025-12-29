import React from 'react';
import { Role, UserRole } from '../types/auth';
import useAuthStore from '../stores/authStore';
import { Permission, hasPermission, hasRole } from '../utils/permissions';

interface PermissionGuardProps {
    children: React.ReactNode;
    permission?: Permission;
    allowedRoles?: Role[];
    fallback?: React.ReactNode;
}

/**
 * A wrapper component that conditionally renders children based on user permissions or roles.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    permission,
    allowedRoles,
    fallback = null,
}) => {
    const { user } = useAuthStore();

    if (!user) {
        return <>{fallback}</>;
    }

    // Check by permission if provided
    if (permission) {
        if (hasPermission(user.role, permission)) {
            return <>{children}</>;
        }
        return <>{fallback}</>;
    }

    // Check by role list if provided
    if (allowedRoles) {
        if (hasRole(user.role, allowedRoles)) {
            return <>{children}</>;
        }
        return <>{fallback}</>;
    }

    // If neither is provided, just show children
    return <>{children}</>;
};

export default PermissionGuard;
