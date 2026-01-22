import { Role, UserRole } from '../types/auth';

/**
 * Permission types based on the documentation
 */
export type Permission =
    | 'MANAGE_DINAS'      // Create/Update/Delete Dinas
    | 'VIEW_DINAS'        // View Dinas information
    | 'UPDATE_OWN_DINAS'  // Update profile of own Dinas
    | 'MANAGE_LAYANAN'    // CRUD Layanan
    | 'UPDATE_LAYANAN_STATUS' // Update status of Layanan
    | 'MANAGE_USER'       // Kelola user & role
    | 'VIEW_USER'         // View users related to services
    | 'MANAGE_FEEDBACK'   // Monitoring & audit national feedback
    | 'REPLY_FEEDBACK'    // Menjawab & menindaklanjuti feedback
    | 'MANAGE_EVENT'      // CRUD Event
    | 'MANAGE_PENGADUAN'  // Menindaklanjuti & monitoring pengaduan
    | 'CREATE_PENGADUAN'  // Create new pengaduan (User)
    | 'MANAGE_EMERGENCY'  // Kirim notifikasi darurat
    | 'VIEW_EMERGENCY'    // View emergency notifications
    | 'MANAGE_NOTIFICATION' // Broadcast & template notification
    | 'CREATE_LAYANAN_REQ'; // Masyarakat mengajukan layanan

/**
 * Role to Permission mapping
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.SUPERADMIN]: [
        'MANAGE_DINAS',
        'VIEW_DINAS',
        'MANAGE_LAYANAN',
        'MANAGE_USER',
        'MANAGE_FEEDBACK',
        'MANAGE_EVENT',
        'MANAGE_PENGADUAN',
        'MANAGE_EMERGENCY',
        'MANAGE_NOTIFICATION',
    ],
    [Role.EXECUTIVE]: [
        'MANAGE_DINAS',
        'VIEW_DINAS',
        'MANAGE_LAYANAN',
        'MANAGE_USER',
        'MANAGE_FEEDBACK',
        'MANAGE_EVENT',
        'MANAGE_PENGADUAN',
        'MANAGE_EMERGENCY',
        'MANAGE_NOTIFICATION',
    ],
    [Role.ADMIN]: [
        'UPDATE_OWN_DINAS',
        'VIEW_DINAS',
        'MANAGE_LAYANAN',
        'VIEW_USER',
        'MANAGE_FEEDBACK',
        'REPLY_FEEDBACK',
        'MANAGE_EVENT',
        'MANAGE_PENGADUAN',
        'VIEW_EMERGENCY',
        'MANAGE_NOTIFICATION',
    ],
    [Role.STAFF]: [
        'VIEW_DINAS',
        'UPDATE_LAYANAN_STATUS',
        'VIEW_USER',
        'REPLY_FEEDBACK',
        'MANAGE_EVENT',
        'MANAGE_PENGADUAN',
        'VIEW_EMERGENCY',
    ],
    [Role.USER]: [
        'VIEW_DINAS',
        'CREATE_LAYANAN_REQ',
        'CREATE_PENGADUAN',
        'VIEW_EMERGENCY',
    ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (userRole: UserRole | undefined, permission: Permission): boolean => {
    if (!userRole) return false;

    // Superadmin usually has everything, but we can be explicit
    const role = userRole as Role;
    const permissions = ROLE_PERMISSIONS[role] || [];

    return permissions.includes(permission);
};

/**
 * Check if user is in one of the allowed roles
 */
export const hasRole = (userRole: UserRole | undefined, allowedRoles: Role[]): boolean => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole as Role);
};

/**
 * Common access patterns
 */
export const canManageDinas = (role: UserRole | undefined) => hasPermission(role, 'MANAGE_DINAS');
export const canManageLayanan = (role: UserRole | undefined) => hasPermission(role, 'MANAGE_LAYANAN');
export const canManageUser = (role: UserRole | undefined) => hasPermission(role, 'MANAGE_USER');
export const canManageEvent = (role: UserRole | undefined) => hasPermission(role, 'MANAGE_EVENT');
export const canManagePengaduan = (role: UserRole | undefined) => hasPermission(role, 'MANAGE_PENGADUAN');
export const canManageEmergency = (role: UserRole | undefined) => hasPermission(role, 'MANAGE_EMERGENCY');
