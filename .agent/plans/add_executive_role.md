# Implementation Plan - Add EXECUTIVE Role

This plan details the steps taken to introduce the `EXECUTIVE` role and grant it permissions mirroring the `SUPERADMIN` role across the application.

## User Objective

Add a new `EXECUTIVE` role that functions similarly to `SUPERADMIN`, enabling access to dashboard statistics, administrative features, and management capabilities for various modules (Emergency, Event, News, Public Services).

## Changes Implemented

### 1. Role Definition & Permissions

- **`src/types/auth.ts`**:

  - Added `EXECUTIVE` to the `Role` enum.

- **`src/utils/permissions.ts`**:

  - Defined `ROLE_PERMISSIONS` for `EXECUTIVE` to be identical to `SUPERADMIN`.

- **`src/hooks/usePermissions.ts`**:
  - Added `isExecutive` helper boolean to the return value of `usePermissions`.

### 2. Dashboard & Navigation Access

- **`src/screens/admin/AdminDashboardScreen.tsx`**:

  - Updated checks `user?.role === Role.SUPERADMIN` to also include `EXECUTIVE`.
  - Ensures `EXECUTIVE` sees the "Pemda Kab. Kuningan" header, the "Riwayat Registrasi User" chart, and the global "Pengaduan Terbanyak" title.

- **`src/screens/admin/ApplicationScreen.tsx`**:

  - Added `Role.EXECUTIVE` to `allowedRoles` for all items in `PUBLIC_SERVICES` and `INTERNAL_MANAGEMENT` where `SUPERADMIN` was present.
  - This grants menu access to features like List Pengaduan, List Berita, Buat Dinas, etc.

- **`src/screens/NotificationDetailScreen.tsx`**:
  - Updated redirection logic for notification taps. `EXECUTIVE` users are now correctly routed to the _Admin_ detail screens (e.g., `AdminPengaduanDetail`) instead of user screens.

### 3. Feature Management (CRUD)

- **`src/screens/EventDetailScreen.tsx`**:

  - Allowed `EXECUTIVE` role to edit events (`canEdit`).

- **`src/screens/EventListScreen.tsx`**:

  - Allowed `EXECUTIVE` role to create events (`canCreate`).

- **`src/screens/DinasListScreen.tsx`**:

  - Updated `PermissionGuard` to allow `EXECUTIVE` to see the "Create Dinas" button.

- **`src/screens/LayananListScreen.tsx`**:

  - Updated `PermissionGuard` to allow `EXECUTIVE` to see the "Create Layanan" button.

- **`src/screens/admin/AnalisisAIListScreen.tsx`**:

  - Allowed `EXECUTIVE` role to see the "Create Analysis" button.

- **`src/screens/admin/BeritaDetailScreen.tsx`**:

  - Updated `canManage` logic to include `EXECUTIVE`, allowing them to edit or delete news items.

- **`src/screens/admin/EmergencyDetailScreen.tsx`**:

  - Updated `canManage` logic to include `EXECUTIVE` for updating status (Terima, Proses, Selesai, Tolak).

- **`src/screens/admin/PengaduanDetailScreen.tsx`**:
  - Updated `canManage` logic to include `EXECUTIVE` for updating status and completing reports.

## Verification

The following flows are now enabled for `EXECUTIVE` users:

1.  **Dashboard**: View full stats and charts.
2.  **Menus**: Access all admin modules via the Application grid.
3.  **Creation**: Create new Events, Dinas, Layanan, Berita, and AI Analyses.
4.  **Management**: Edit/Delete existing content and update status of Emergency/Pengaduan reports as a Super Admin would.
