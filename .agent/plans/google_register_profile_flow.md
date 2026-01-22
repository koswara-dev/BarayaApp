# Implementation Plan - Google Register & Profile Completion

This plan details the steps taken to implement the "Register with Google" feature and the mandatory profile completion flow for new users.

## User Objective

1.  Add a "Register with Google" button to `RegisterScreen.tsx`, mirroring the API usage in `LoginScreen.tsx`.
2.  Upon Google Login/Register, check if `fullName` and `phoneNumber` are missing (null).
3.  If missing, navigate to a form to input these details.
4.  Once filled, navigate to `HomeScreen`.

## Changes Implemented

### 1. New Screen: `CompleteProfileScreen`

- **File**: `src/screens/CompleteProfileScreen.tsx`
- **Purpose**: A dedicated screen to capture `fullName` and `phoneNumber` for users who sign up via Google (or have incomplete profiles).
- **Logic**:
  - Pre-fills data from `userStore` or `authStore` if available.
  - Validates inputs (Name >= 3 chars, Phone starts with '08').
  - Updates user profile via `PUT /users/{id}`.
  - Refreshes local profile state upon success.

### 2. Navigation Logic Updates

- **File**: `src/navigation/RootNavigator.tsx`
- **Changes**:

  - Added `CompleteProfileScreen` to the **Authenticated Stack**.
  - Added `WebviewScreen` to the **Unauthenticated Stack** to support Google Auth flow from Login/Register screens.
  - **Conditional Routing**: Implemented a check within the authenticated stack render logic:
    ```typescript
    {(user?.role === Role.USER && (!profile?.phoneNumber || !profile?.fullName) && !profileLoading) ? (
         <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
    ) : ( ...Normal Stacks... )}
    ```
  - This ensures that any logged-in USER with missing details is strictly routed to `CompleteProfileScreen` until they complete their profile. Once updated, the navigator automatically switches them to the `Main` (Home) stack.

- **File**: `src/navigation/types.ts`
  - Added `CompleteProfile: undefined` to `RootStackParamList`.

### 3. Register Screen Updates

- **File**: `src/screens/RegisterScreen.tsx`
- **Changes**:
  - Imported `API_BASE_URL` and missing styles.
  - Added the "Daftar dengan Google" button in Step 1 of the registration flow.
  - The button navigates to `Webview` with `url: ${API_BASE_URL}/auth/google` and `isAuth: true`, reusing the existing backend auth endpoint.

## Verification

1.  **Google Register**: User taps "Daftar dengan Google" -> Opens WebView -> Authenticates -> Returns to App as Logged In.
2.  **Profile Check**:
    - If the new user lacks a phone number (typical for Google Auth), `RootNavigator` detects `!profile.phoneNumber`.
    - User is shown `CompleteProfileScreen` instead of `HomeScreen`.
3.  **Completion**:
    - User enters Name and Whatsapp Number.
    - Submits form -> API Update Success -> Profile Refreshes.
    - `RootNavigator` detects complete profile -> Switches to `Main` Tab Navigator (`HomeScreen`).
