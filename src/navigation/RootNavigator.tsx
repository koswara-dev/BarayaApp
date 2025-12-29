import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import AdminBottomTabNavigator from './AdminBottomTabNavigator';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';

import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import NotificationScreen from '../screens/NotificationScreen';
import MapEmergencyScreen from '../screens/MapEmergencyScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import NewsScreen from '../screens/NewsScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';

import RegisterScreen from '../screens/RegisterScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PengaturanScreen from '../screens/admin/PengaturanScreen';
import EventListScreen from '../screens/EventListScreen';
import DinasListScreen from '../screens/DinasListScreen';
import CreateEventScreen from '../screens/admin/CreateEventScreen';
import PengaduanListScreen from '../screens/PengaduanListScreen';
import PengaduanDetailScreen from '../screens/PengaduanDetailScreen';
import AdminPengaduanListScreen from '../screens/admin/PengaduanListScreen';
import AdminPengaduanDetailScreen from '../screens/admin/PengaduanDetailScreen';
import CreateDinasScreen from '../screens/admin/CreateDinasScreen';
import CreateLayananScreen from '../screens/admin/CreateLayananScreen';
import CreatePengaduanScreen from '../screens/CreatePengaduanScreen';
import ServiceHistoryScreen from '../screens/ServiceHistoryScreen';
import EmergencyDetailScreen from '../screens/admin/EmergencyDetailScreen';
import EventDetailScreen from '../screens/EventDetailScreen';


import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import { navigationRef } from './navigationRef';
import { Role } from '../types/auth';
import useAuthStore from '../stores/authStore';

import useNotificationStore from '../stores/notificationStore';

import { notificationHelper } from '../utils/notificationHelper';

export default function RootNavigator() {
  const { token, user, isHydrated } = useAuthStore();
  const { startPolling, stopPolling } = useNotificationStore();

  // Global Polling for Push Notifications & Channel Init
  React.useEffect(() => {
    notificationHelper.createChannels(); // Ensure channels exist
    
    if (token) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => {
      // Cleanup on unmount (less likely for Root but good practice)
      stopPolling();
    };
  }, [token]);

  // While checking auth status, show the Splash screen content directly
  if (!isHydrated) {
    return <SplashScreen />;
  }

  const isUser = user?.role === Role.USER;
  const isSuperAdmin = user?.role === Role.SUPERADMIN;
  const isAdminOrStaff = user?.role === Role.ADMIN || user?.role === Role.STAFF;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated Stack
          <>
            {isUser ? (
              <Stack.Screen name="Main" component={BottomTabNavigator} />
            ) : (
              <Stack.Screen name="AdminMain" component={AdminBottomTabNavigator} />
            )}

            {/* Common Authenticated Screens */}
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
            <Stack.Screen name="Notifikasi" component={NotificationScreen} />
            <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
            <Stack.Screen name="MapEmergency" component={MapEmergencyScreen} />
            <Stack.Screen name="Berita" component={NewsScreen} />
            <Stack.Screen name="EventList" component={EventListScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="DinasList" component={DinasListScreen} />
            <Stack.Screen name="CreatePengaduan" component={CreatePengaduanScreen} />
            <Stack.Screen name="PengaduanList" component={PengaduanListScreen} />
            <Stack.Screen name="PengaduanDetail" component={PengaduanDetailScreen} />
            <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />

            {/* Admin/Staff Specific Screens (Guarded by component-level perms usually, but can be routed here) */}
            <Stack.Screen name="Pengaturan" component={PengaturanScreen} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="CreateDinas" component={CreateDinasScreen} />
            <Stack.Screen name="CreateLayanan" component={CreateLayananScreen} />
            <Stack.Screen name="AdminPengaduanList" component={AdminPengaduanListScreen} />
            <Stack.Screen name="AdminPengaduanDetail" component={AdminPengaduanDetailScreen} />
            <Stack.Screen name="EmergencyDetail" component={EmergencyDetailScreen} />
          </>
        ) : (

          // Unauthenticated Stack - ONLY shows if token is null
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

