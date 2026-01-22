import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';
import {
    Permission,
    hasPermission,
    hasRole,
    canManageDinas,
    canManageLayanan,
    canManageUser,
    canManageEvent,
    canManagePengaduan,
    canManageEmergency
} from '../utils/permissions';

/**
 * Hook to check permissions and roles within components
 */
export const usePermissions = () => {
    const { user } = useAuthStore();
    const role = user?.role;

    return {
        role,
        user,
        hasPermission: (permission: Permission) => hasPermission(role, permission),
        hasRole: (allowedRoles: Role[]) => hasRole(role, allowedRoles),

        // Convenience checks
        canManageDinas: canManageDinas(role),
        canManageLayanan: canManageLayanan(role),
        canManageUser: canManageUser(role),
        canManageEvent: canManageEvent(role),
        canManagePengaduan: canManagePengaduan(role),
        canManageEmergency: canManageEmergency(role),

        // Specific role checks
        isSuperAdmin: role === Role.SUPERADMIN,
        isExecutive: role === Role.EXECUTIVE,
        isAdmin: role === Role.ADMIN,
        isStaff: role === Role.STAFF,
        isUser: role === Role.USER,
    };
};

export default usePermissions;
