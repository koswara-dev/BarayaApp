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
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import PengaturanScreen from '../screens/admin/PengaturanScreen';
import EventListScreen from '../screens/EventListScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import DinasListScreen from '../screens/DinasListScreen';
import DinasDetailScreen from '../screens/DinasDetailScreen';
import LayananListScreen from '../screens/LayananListScreen';
import LayananDetailScreen from '../screens/LayananDetailScreen';
import CreateEventScreen from '../screens/admin/CreateEventScreen';
import PengaduanListScreen from '../screens/PengaduanListScreen';
import PengaduanDetailScreen from '../screens/PengaduanDetailScreen';
import AdminPengaduanListScreen from '../screens/admin/PengaduanListScreen';
import AdminPengaduanDetailScreen from '../screens/admin/PengaduanDetailScreen';
import DaruratListScreen from '../screens/admin/DaruratListScreen';
import CreateDinasScreen from '../screens/admin/CreateDinasScreen';
import CreateLayananScreen from '../screens/admin/CreateLayananScreen';
import CreatePengaduanScreen from '../screens/CreatePengaduanScreen';
import ServiceHistoryScreen from '../screens/ServiceHistoryScreen';
import EmergencyDetailScreen from '../screens/admin/EmergencyDetailScreen';
import AnalisisAIListScreen from '../screens/admin/AnalisisAIListScreen';
import CreateAnalisisAIScreen from '../screens/admin/CreateAnalisisAIScreen';
import AnalisisAIDetailScreen from '../screens/admin/AnalisisAIDetailScreen';
import WebviewScreen from '../screens/WebviewScreen';
import AdminBeritaListScreen from '../screens/admin/BeritaListScreen';
import CreateBeritaScreen from '../screens/admin/CreateBeritaScreen';
import AdminBeritaDetailScreen from '../screens/admin/BeritaDetailScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import useUserStore from '../stores/userStore';
import SamsatKelilingScreen from '../screens/SamsatKelilingScreen';
import CreateSamsatScreen from '../screens/admin/CreateSamsatKelilingScreen';
import AsdaListScreen from '../screens/admin/AsdaListScreen';
import AsdaDetailScreen from '../screens/admin/AsdaDetailScreen';
import CamatListScreen from '../screens/admin/CamatListScreen';
import CamatDetailScreen from '../screens/admin/CamatDetailScreen';
import CreateCamatScreen from '../screens/admin/CreateCamatScreen';
import CreateAsdaScreen from '../screens/admin/CreateAsdaScreen';


import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import { navigationRef } from './navigationRef';
import { Role } from '../types/auth';
import useAuthStore from '../stores/authStore';

import useNotificationStore from '../stores/notificationStore';

import { notificationHelper } from '../utils/notificationHelper';

export default function RootNavigator() {
  const { token, user, isHydrated } = useAuthStore();
  // Ensure we subscribe to userStore updates for profile completeness check
  const { profile, loading: profileLoading } = useUserStore();
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
  const [isVersionChecked, setIsVersionChecked] = React.useState(false);

  // While checking auth status or version, show the Splash screen content directly
  if (!isHydrated || !isVersionChecked) {
    return <SplashScreen onCheckComplete={() => setIsVersionChecked(true)} />;
  }

  const isUser = user?.role === Role.USER || user?.role === Role.CAMAT;
  const isSuperAdmin = user?.role === Role.SUPERADMIN;
  const isAdminOrStaff = user?.role === Role.ADMIN || user?.role === Role.STAFF;

  return (
    <NavigationContainer ref={navigationRef}>


      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated Stack
          <>
             {/* Check Profile Completeness - Only for Users (Admins usually pre-seeded) */}
             {/* We use specific route for completion if needed. 
                 But to force it, we can conditionally render it as the home. 
                 However, simpler is just adding the screen to the stack and letting logic redirect.
                 But user asked "navigate to input form...".
                 If I make it the ONLY screen, it forces navigation.
             */}
             
            {(user?.role === Role.USER && (!profile?.phoneNumber || !profile?.fullName) && !profileLoading) ? (
                 <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
            ) : ( 
                 isUser ? (
                  <Stack.Screen name="Main" component={BottomTabNavigator} />
                ) : (
                  <>
                    <Stack.Screen name="AdminMain" component={AdminBottomTabNavigator} />
                    <Stack.Screen name="Main" component={BottomTabNavigator} />
                  </>
                )
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
            <Stack.Screen name="DinasDetail" component={DinasDetailScreen} />
            <Stack.Screen name="CreatePengaduan" component={CreatePengaduanScreen} />
            <Stack.Screen name="PengaduanList" component={PengaduanListScreen} />
            <Stack.Screen name="PengaduanDetail" component={PengaduanDetailScreen} />
            <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />

            {/* Admin/Staff Specific Screens (Guarded by component-level perms usually, but can be routed here) */}
            <Stack.Screen name="Pengaturan" component={PengaturanScreen} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="CreateDinas" component={CreateDinasScreen} />
            <Stack.Screen name="CreateLayanan" component={CreateLayananScreen} />
            <Stack.Screen name="LayananList" component={LayananListScreen} />
            <Stack.Screen name="LayananDetail" component={LayananDetailScreen} />
            <Stack.Screen name="AdminPengaduanList" component={AdminPengaduanListScreen} />
            <Stack.Screen name="AdminPengaduanDetail" component={AdminPengaduanDetailScreen} />
            <Stack.Screen name="EmergencyDetail" component={EmergencyDetailScreen} />
            <Stack.Screen name="DaruratList" component={DaruratListScreen} />
            <Stack.Screen name="AnalisisAIList" component={AnalisisAIListScreen} />
            <Stack.Screen name="CreateAnalisisAI" component={CreateAnalisisAIScreen} />
            <Stack.Screen name="AnalisisAIDetail" component={AnalisisAIDetailScreen} />
            <Stack.Screen name="Webview" component={WebviewScreen} />
            <Stack.Screen name="SamsatKeliling" component={SamsatKelilingScreen} />
            <Stack.Screen name="CreateSamsat" component={CreateSamsatScreen} />
            <Stack.Screen name="AdminBeritaList" component={AdminBeritaListScreen} />
            <Stack.Screen name="CreateBerita" component={CreateBeritaScreen} />
            <Stack.Screen name="AdminBeritaDetail" component={AdminBeritaDetailScreen} />
            <Stack.Screen name="AsdaList" component={AsdaListScreen} />
            <Stack.Screen name="AsdaDetail" component={AsdaDetailScreen} />
            <Stack.Screen name="CreateAsda" component={CreateAsdaScreen} />
            <Stack.Screen name="CamatList" component={CamatListScreen} />
            <Stack.Screen name="CamatDetail" component={CamatDetailScreen} />
            <Stack.Screen name="CreateCamat" component={CreateCamatScreen} />
          </>
        ) : (

          // Unauthenticated Stack - ONLY shows if token is null
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="Webview" component={WebviewScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

