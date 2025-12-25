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


import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import { navigationRef } from './navigationRef';
import useAuthStore from '../stores/authStore';

export default function RootNavigator() {
  const { token, user, isHydrated } = useAuthStore();

  // While checking auth status, show the Splash screen content directly
  if (!isHydrated) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated Stack
          <>
            {user?.role === 'USER' ? (
              <Stack.Screen name="Main" component={BottomTabNavigator} />
            ) : (
              <Stack.Screen name="AdminMain" component={AdminBottomTabNavigator} />
            )}
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
            <Stack.Screen name="Notifikasi" component={NotificationScreen} />
            <Stack.Screen name="MapEmergency" component={MapEmergencyScreen} />
            <Stack.Screen name="Berita" component={NewsScreen} />
            <Stack.Screen name="Pengaturan" component={PengaturanScreen} />
            <Stack.Screen name="EventList" component={EventListScreen} />
            <Stack.Screen name="DinasList" component={DinasListScreen} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="CreateDinas" component={CreateDinasScreen} />
            <Stack.Screen name="CreateLayanan" component={CreateLayananScreen} />
            <Stack.Screen name="CreatePengaduan" component={CreatePengaduanScreen} />
            <Stack.Screen name="PengaduanList" component={PengaduanListScreen} />
            <Stack.Screen name="PengaduanDetail" component={PengaduanDetailScreen} />
            <Stack.Screen name="AdminPengaduanList" component={AdminPengaduanListScreen} />
            <Stack.Screen name="AdminPengaduanDetail" component={AdminPengaduanDetailScreen} />
            <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
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

